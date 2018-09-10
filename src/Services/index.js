const Env = use('Env')
const account_sid = Env.get('TWILIO_ACCOUNT_SID')
const api_key = Env.get('TWILIO_TOKEN')
const api_key_sid = Env.get('TWILIO_API_KEY_SID')
const api_key_secret = Env.get('TWILIO_API_KEY_SECRET')
const service_sid = Env.get('TWILIO_SERVICE_SID')

const appClient = require('twilio')(account_sid, api_key)
const AccessToken = require('twilio').jwt.AccessToken
const ChatGrant = AccessToken.ChatGrant

const TwilioUser = use('Adonis/Twilio/TwilioUser')
const UserChat = use('Adonis/Twilio/UserChat')
const ChatLocal = use('Adonis/Twilio/ChatLocal')
const Invites = use('Adonis/Twilio/Invites')
const User = use('App/Models/User')

const Chat = use('Adonis/Twilio/Chat')
const Video = use('Adonis/Twilio/Video')

const TwilioService = {

    getClient() {
        return Chat.client(appClient)
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

    async createChat(data, creator_id, users) {
        let config = {
            createdBy: creator_id,
            dateCreated: new Date(),
            dateUpdated: new Date()
        }
        //add information about video chat
        if (!data.attributes) data.attributes = {}
        else data.attributes = JSON.parse(data.attributes)
        data.attributes.video = null
        data.attributes = JSON.stringify(data.attributes)
        Object.assign(config, data)

        let chat = await Chat.client(appClient).channels.create(config)
        let record = await ChatLocal.create({
            chat_sid: chat.sid,
            title: chat.friendlyName
        })
        record = record.toJSON()

        await this.addToChat(record.id, creator_id, 'admin')
        if (users) {
            for (let user_id of users) {
                await this.addToChat(record.id, user_id, 'user')
            }
        }

        return {record, chat}
    },

    async inviteToChat(chat_id, user_id, role_name) {
        let sid = (await ChatLocal.find(chat_id)).toJSON().chat_sid

        await Invites.create({
            user_id,
            chat_id
        })

        return await Chat.client(appClient).channels(sid).invites.create({
            identity: user_id,
            roleSid: this.getRoleSid(role_name)
        })
    },

    async acceptInvite(chat_id, user_id) {
        let record = await Invites.query()
            .where('user_id', user_id)
            .where('chat_id', chat_id)
            .first()
        if (!record) return
        await UserChat.create({
            user_id: user_id,
            chat_id: chat_id
        })
        await Invites.query().where('id', record.toJSON().id).delete()
    },

    async addToChat(chat_id, user_id, role_name) {
        let sid = (await ChatLocal.find(chat_id)).toJSON().chat_sid
        if (
            await UserChat.query().where({
                user_id: user_id,
                chat_id: chat_id
            }).first()
        ) throw {message: 'error.memberExist'}
        if (!(await User.find(user_id))) throw {message: 'error.noUser'}
        await UserChat.create({
            user_id: user_id,
            chat_id: chat_id
        })
        return await Chat.client(appClient).channels(sid).members.create({
            identity: user_id,
            dateCreated: new Date(),
            dateUpdated: new Date(),
            roleSid: this.getRoleSid(role_name)
        })
    },

    async removeFromChat(chat_id, user_id) {
        let sid = (await ChatLocal.find(chat_id)).toJSON().chat_sid
        await Chat.client(appClient).channels(sid).members(user_id).remove()
        await UserChat.query()
            .where('chat_id', chat_id)
            .where('user_id', user_id)
            .delete()
        await Invites.query()
            .where('chat_id', chat_id)
            .where('user_id', user_id)
            .delete()
    },

    async addVideoToChat(sid) {
        return await Video.addToChat(Video.client(appClient), Chat.client(appClient), sid)
    },

    async endVideoOnChat(sid) {
        return await Video.endOnChat(Video.client(appClient), Chat.client(appClient), sid)
    },

    getRoleSid(role_name) {
        return this.roles.find(role => role.friendlyName === `channel ${role_name}`).sid
    }

}

module.exports = TwilioService
