'use strict'

const Model = use('Model')

class TwilioUser extends Model {

    //Relations
    user() {
        return this.belongsTo('App/Models/User')
    }

    chats() {
        return this.belongsToMany('Adonis/Twilio/Chat', 'user_id', 'chat_id', 'user_id', 'id').pivotTable('twilio_user_chats')
    }

    invitedChats() {
        return this.belongsToMany('Adonis/Twilio/Chat', 'user_id', 'chat_id', 'user_id', 'id').pivotTable('twilio_invites')
    }

}

module.exports = TwilioUser
