'use strict'

const Model = use('Model')

class TwilioService extends Model {

    //Relations

    chat() {
        return this.belongsTo('Adonis/Twilio/ChatLocal')
    }
}

module.exports = TwilioService
