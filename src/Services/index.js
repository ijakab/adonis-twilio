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
const Invites = use('Adonis/Twilio/Invites')

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
                q.whereInPivot('user_id', ids)
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
            users.rows.map(user => promises.push(this.addToChat(record.id, user.id, 'user')))
        }
        promises.push(this.addToChat(record.id, creator.id, 'admin'))
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
        let promises = [
            UserChat.create({
                user_id: user_id,
                chat_id: chat_id
            }),
            Chat.client(appClient).channels(sid).members.create({
                identity: user_id,
                dateCreated: new Date(),
                dateUpdated: new Date(),
                roleSid: this.getRoleSid(role_name)
            })
        ]
        return await Promise.all(promises)[1]
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
