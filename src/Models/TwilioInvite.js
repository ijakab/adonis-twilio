'use strict'

const Model = use('Model')
const Config = use('Config')

class UserChat extends Model {

    static get table() {
        return 'twilio_invites'
    }

    //Relations
    user() {
        return this.belongsTo(Config.get('twilio.UserModel'))
    }
}

module.exports = UserChat
