'use strict'

const Model = use('Model')
const Config = use('Config')


class TwilioService extends Model {

    //Relations

    chat() {
        return this.belongsTo(Config.get('twilio.ChatModel'))
    }
}

module.exports = TwilioService
