const Env = use('Env')
const sid = Env.get('TWILIO_ACCOUNT_SID')
const api_key = Env.get('TWILIO_TOKEN')
const api_secret = Env.get('TWILIO_SECRET')
const appClient = require('twilio')(sid, api_key)
const AccessToken = require('twilio').jwt.AccessToken
const ChatGrant = AccessToken.ChatGrant

const TwilioUser = use('Adonis/Twilio/TwilioUser')

const Chat = use('Adonis/Twilio/Chat')

const TwilioService = {
    async init() {
        this.roles = await Chat.client(appClient).roles.list()
    },

    async createUser(data) {
        return await Chat.client(appClient).users.create(data)
    },

    async generateToken(user_id, deviceId) {
        const token = new AccessToken(sid, api_key, api_secret)
        token.addGrant(new ChatGrant({
            serviceSid: sid,
            endpointId: `TwilioChat:${user_id}:${deviceId}`
        }))
        token.identity = user_id
        return token.toJwt()
    },

    async createChat(data, creator_id, users) {
        let config = {
            createdBy: creator_id,
            dateCreated: new Date(),
            dateUpdated: new Date()
        }
        Object.assign(config, data)
        let chat = await Chat.client(appClient).channels.create(config)
        await this.addToChat(chat.sid, creator_id, 'admin')
        if(users) {
            for(let user_id of users) {
                await this.addToChat(chat.sid, user_id, 'user')
            }
        }
        return chat
    },

    async inviteToChat(sid, user_id, role_name) {
        return await Chat.client(appClient).channels(sid).invites.create({
            identity: user_id,
            roleSid: this.getRoleSid(role_name)
        })
    },

    async addToChat(sid, user, role_name) {
        return await Chat.client(appClient).channels(sid).members.create({
            identity: user,
            dateCreated: new Date(),
            dateUpdated: new Date(),
            roleSid: this.getRoleSid(role_name)
        })
    },

    async getChatMembers(sid) {
        return await Chat.client(appClient).channels(sid).members.list()
    },

    async getUserChats(user_id) {
        let user = await TwilioUser.findBy('user_id', user_id)
        let sid = user.toJSON().sid
        return await Chat.client(appClient).users(sid).userChannels.list()
    },

    async getPossibleActions(user_id, channel_sid) {
        let member = await Chat.client(appClient).channels(channel_sid).members(user_id).fetch()
        let role = await Chat.client(appClient).roles(member.roleSid).fetch()
        return role.permissions
    },
    
    getRoleSid(role_name) {
        return this.roles.find(role => role.friendlyName === `channel ${role_name}`).sid
    }

}

module.exports = TwilioService