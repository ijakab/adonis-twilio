'use strict'

const Model = use('Model')

class TwilioChat extends Model {

    //Relations
    users() {
        return this.belongsToMany('Adonis/Twilio/TwilioUser', 'chat_id', 'user_id', 'id', 'user_id').pivotTable('twilio_user_chats')
    }

    service() {
        return this.hasOne('Adonis/Twilio/Service')
    }
}

module.exports = TwilioChat
