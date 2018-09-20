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

    static async addToChat(videoClient, chatClient, sid, data = {}) {
        data.type = 'group'
        let channel = await chatClient.channels(sid).fetch()
        channel.attributes = JSON.parse(channel.attributes)

        if(channel.attributes.video) {
            if(channel.attributes.video.sid) {
                try {
                    let existing = await videoClient.rooms(channel.attributes.video.sid).fetch()
                    return existing
                } catch (e) {
                }
            }
        }

        let room = await videoClient.rooms.create(data)
        channel.attributes.video = {
            unique_name: room.unique_name,
            sid: room.sid
        }
        await chatClient.channels(sid).update({attributes: JSON.stringify(channel.attributes)})
        await ChatLocal.query()
            .where('chat_sid', sid)
            .update({
                video_sid: room.sid
            })
        return room
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