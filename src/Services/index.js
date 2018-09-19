const Env = use('Env')
const account_sid = Env.get('TWILIO_ACCOUNT_SID')
const api_key = Env.get('TWILIO_TOKEN')
const api_key_sid = Env.get('TWILIO_API_KEY_SID')
const api_key_secret = Env.get('TWILIO_API_KEY_SECRET')
const service_sid = Env.get('TWILIO_SERVICE_SID')

const appClient = require('twilio')(account_sid, api_key)
const videoClient = require('twilio')(api_key_sid, api_key_secret, {
    accountSid: account_sid
})
const AccessToken = require('twilio').jwt.AccessToken
const ChatGrant = AccessToken.ChatGrant

const TwilioUser = use('Adonis/Twilio/TwilioUser')
const UserChat = use('Adonis/Twilio/UserChat')
const ChatLocal = use('Adonis/Twilio/ChatLocal')

const Chat = use('Adonis/Twilio/Chat')
const Video = use('Adonis/Twilio/Video')

const TwilioService = {

    getClient() {
        return Chat.client(appClient)
    },

    getVideoClient() {
        return videoClient
    },

    async init() {
        this.roles = await Chat.client(appClient).roles.list()
    },

    async createUser(data) {
        let res = await Chat.client(appClient).users.create({
            identity: data.id,
            friendlyName: data.friendlyName
        })
        await TwilioUser.create({
            user_id: data.id,
            sid: res.sid
        })
        return res
    },

    async createUserIfNotExist(data) {
        try {
            await TwilioUser.findByOrFail('user_id', data.id)
        } catch (e) {
            await this.createUser(data)
        }
    },

    async generateToken(user_id, endpointId) {
        const token = new AccessToken(account_sid, api_key_sid, api_key_secret)
        let grant = new ChatGrant({
            serviceSid: service_sid
        })
        grant.endpointId = service_sid + user_id + endpointId
        token.addGrant(grant)
		token.identity = user_id + ''
        token.addGrant(new AccessToken.VideoGrant())
        return token.toJwt()
    },

    async createChat(data, creator, users) {
        let config = {
            createdBy: creator.id,
            dateCreated: new Date(),
            dateUpdated: new Date()
        }

        //first, check if chat with those users exist
        let ids = []
        if(users) users.rows.map(user => ids.push(user.id))
        ids.push(creator.id)

        let record = await ChatLocal
            .query()
            .whereHas('users', q => {
                q.whereIn('twilio_users.user_id', ids)
            }, '=', ids.length)
            .with('users.user')
            .first()
        if(record) return record

        //add information about video chat
        if (!data.attributes) data.attributes = {}
        else data.attributes = JSON.parse(data.attributes)
        data.attributes.video = null
        data.attributes = JSON.stringify(data.attributes)
        Object.assign(config, data)

        //to speed up, we need to do things in parallel
        let promises = []
        if(users) {
            users.rows.map(user => promises.push(this.createUserIfNotExist(user)))
        }
        promises.push(this.createUserIfNotExist(creator))
        promises.push(Chat.client(appClient).channels.create(config))
        let res = await Promise.all(promises)
        let chat = res[ids.length] //index of create chat promise is equal to number of users, or number of promises before it

        record = await ChatLocal.create({
            chat_sid: chat.sid,
            title: chat.friendlyName
        })

        //we also add users in parallel
        promises = []
        if(users) {
            users.rows.map(user => promises.push(this.addToChat(record, user, 'user')))
        }
        promises.push(this.addToChat(record, creator, 'admin'))
        await Promise.all(promises)

        await record.loadMany({
            users: builder => {
                builder.with('user')
            }
        })
        return record
    },

    async removeChat(id) {
        let chat = await ChatLocal.find(id)
        try {
            await this.endVideoOnChat(chat.sid)
        } catch (e) {}
        try {
            await Chat.client(appClient).channels(chat.sid).remove()
        } catch(e) {}
        try {
            await ChatLocal.delete()
        } catch (e) {}
    },

    async addToChat(chat, user, role_name) {
        let promises = []
        let exists = await UserChat.query()
            .where('chat_id', chat.id)
            .where('user_id', user.id)
            .first()
        if(exists) return
        promises.push(UserChat.create({
            user_id: user.id,
            chat_id: chat.id
        }))
        promises.push(Chat.client(appClient).channels(chat.chat_sid).members.create({
            identity: user.id,
            dateCreated: new Date(),
            dateUpdated: new Date(),
            roleSid: this.getRoleSid(role_name)
        }))
        return await Promise.all(promises)[1]
    },

    async removeFromChat(chat, user) {
        await Chat.client(appClient).channels(chat.chat_sid).members(user.id).remove()
        await UserChat.query()
            .where('user_id', user.id)
            .where('chat_id', chat.id)
    },

    async addVideoToChat(sid, data) {
        return await Video.addToChat(videoClient, Chat.client(appClient), sid, data)
    },

    async endVideoOnChat(sid) {
        return await Video.endOnChat(videoClient, Chat.client(appClient), sid)
    },

    getRoleSid(role_name) {
        return this.roles.find(role => role.friendlyName === `channel ${role_name}`).sid
    }

}

module.exports = TwilioService
