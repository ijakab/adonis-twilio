'use strict'

const Model = use('Model')
const Config = use('Config')

class TwilioChat extends Model {

    //Relations
    users() {
        return this.belongsToMany('Adonis/Twilio/TwilioUser', 'chat_id', 'user_id', 'id', 'user_id').pivotTable('twilio_user_chats')
    }

    service() {
        return this.hasOne(Config.get('twilio.ServiceModel'))
    }
}

module.exports = TwilioChat
