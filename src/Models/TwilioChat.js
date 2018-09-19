'use strict'

const Model = use('Model')

class TwilioChat extends Model {

    //Relations
    users() {
        return this.belongsToMany('Adonis/Twilio/TwilioUser', 'chat_id', 'user_id', 'id', 'id').pivotTable('twilio_user_chats')
    }
}

module.exports = TwilioChat
