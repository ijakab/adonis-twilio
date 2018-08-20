'use strict'

const Model = use('Model')

class UserChat extends Model {

    static get table() {
        return 'twilio_user_chat'
    }

    //Relations
    user() {
        return this.belongsTo('App/Models/User')
    }
}

module.exports = UserChat
