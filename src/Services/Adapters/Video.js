const Env = use('Env')
const BaseProduct = use('Adonis/Twilio/BaseProducts')
const ChatLocal = use('Adonis/Twilio/ChatLocal')

class Video extends BaseProduct {
    constructor() {
        super()
    }

    static client(appClient) {
        return appClient.video
    }

    static async createChat({request, user}) {
        let data = {
            friendlyName: "glupost",
            type: "private"
        }
        let users = await User.query().whereIn('id',[20000]).fetch()

        let chatData = await Twilio.createChat(data, await User.find(1000), users)

        let video = await Twilio.addVideoToChat(chatData.chat_sid, {})
        video = await Twilio.addVideoToChat(chatData.chat_sid, {})
        video = await Twilio.endVideoOnChat(chatData.chat_sid)
        video = await Twilio.endVideoOnChat(chatData.chat_sid)
        return ''
    }

    static async endOnChat(videoClient, chatClient, sid) {
        let channel = await chatClient.channels(sid).fetch()
        channel.attributes = JSON.parse(channel.attributes)
        if(channel.attributes.video) {
            await videoClient.rooms(channel.attributes.video.sid).update({status: 'completed'})
            channel.attributes.video = null
            await chatClient.channels(sid).update({attributes: JSON.stringify(channel.attributes)})
        }
        await ChatLocal.query()
            .where('chat_sid', sid)
            .update({
                video_sid: null
            })
        return channel
    }
}

module.exports = Video