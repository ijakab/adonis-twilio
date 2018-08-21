'use strict'

const Model = use('Model')

class UserChat extends Model {

    static get table() {
        return 'twilio_invites'
    }

    //Relations
    user() {
        return this.belongsTo('App/Models/User')
    }
}

module.exports = UserChat
