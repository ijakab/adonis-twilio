const Env = use('Env')
const BaseProduct = use('Adonis/Twilio/BaseProducts')

class Chat extends BaseProduct {
    constructor() {
        super()
    }

    static client(appClient) {
        return appClient.video
    }

    static async addToChat(videoClient, chatClient, sid, name) {
        let room = await videoClient.rooms.create({uniqueName: name, type: 'group'})
        let channel = await chatClient.channels(sid).fetch()
        channel.attributes.video = {
            unique_name: room.unique_name,
            sid: room.sid
        }
        await chatClient.channels(sid).update(attributes => channel.attributes)
        return room
    }

    static async endOnChat(videoClient, chatClient, sid) {
        let channel = await chatClient.channels(sid).fetch()
        if(channel.attributes.video) {
            await videoClient.rooms(channel.attributes.video.sid).update({status: 'completed'})
            channel.attributes.video = null
            await chatClient.channels(sid).update(attributes => channel.attributes)
        }
        return channel
    }
}

module.exports = Chat