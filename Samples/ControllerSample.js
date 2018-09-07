'use strict'
const Twilio = use('Adonis/TwilioService')
const User = use('App/Models/User')
const Chat = use('Adonis/Twilio/ChatLocal')
const validator = use('Validator')

class ChatController {
    async getToken({request, user}) {
        return {token: await Twilio.generateToken(user.toJSON().id, request.input('endpointId'))}
    }

    async createChat({request, user}) { //todo: check if users exist
        let params = request.only(['users', 'additional', 'name', 'type'])

        let rules = {
            users: 'array',
            name: 'string|required',
            type: 'string|required|in:public,private'
        }
        let validation = await validator.validate(params, rules)
        if(validation.fails()) return validation.messages()

        let data = {
            friendlyName: params.name,
            type: params.type
        }
        if(params.additional) data.attributes = params.additional
        return await Twilio.createChat(data, user.toJSON().id, params.users)
    }

    async addUserToChat({request, response, params, user}) {
        let users = request.input('users')
        let promises = []
        for(let user_id of users) {
            promises.push(Twilio.addToChat(params.id, user_id, 'user'))
        }
        return Promise.all(promises).then(val => {
            return response.ok('success.userAdded')
        }).catch(err => {
            return response.badRequest(err)
        })
    }

    async removeUserFromChat({request, response, params, user}) {
        let users = request.input('users')
        let promises = []
        for(let user_id of users) {
            promises.push(Twilio.removeFromChat(params.id, user_id))
        }
        return Promise.all(promises).then(val => {
            return response.ok('success.userRemoved')
        }).catch(err => {
            return response.badRequest(err)
        })
    }

    async addVideo({user, request, response}) {
        let sid = request.all().sid
        if(!await Twilio.getMember(sid, user.toJSON().id)) return response.forbidden('error.notOnChat')
        return await Twilio.addVideoToChat(sid)
    }

    async removeVideo({user, request, response}) {
        let sid = request.all().sid
        if(!await Twilio.getMember(sid, user.toJSON().id)) return response.forbidden('error.notOnChat')
        return await Twilio.endVideoOnChat(sid)
    }

    async getChat({params, user}) {
        let chats = await Chat.query()
            .where('id', params.id)
            .with('users.user')
            .first()
        chats = chats.toJSON()
        return chats
    }

    async getUserChats({user}) {
        let id = user.toJSON().id
        let query = await User.query()
            .where('id', id)
            .with('twilio_user.chats')
            .first()
        query = query.toJSON()
        return query.twilio_user.chats
    }


}

module.exports = ChatController