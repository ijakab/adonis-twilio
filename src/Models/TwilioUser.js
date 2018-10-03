'use strict'

const Model = use('Model')
const Config = use('Config')

class TwilioUser extends Model {

    //Relations
    user() {
        return this.belongsTo(Config.get('twilio.UserModel'))
    }

    chats() {
        return this.belongsToMany('Adonis/Twilio/ChatLocal', 'user_id', 'chat_id', 'user_id', 'id').pivotTable('twilio_user_chats')
    }

}

module.exports = TwilioUser
