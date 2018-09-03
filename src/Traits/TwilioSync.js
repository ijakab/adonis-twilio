const Config = use('Config')
const Twilio = use('Adonis/TwilioService')

class TwilioSync{
    // todo should we handle user updates?
    register(Model) {
        Model.addHook('afterCreate', async function (modelInstance) {

            const modelJSON = modelInstance.toJSON()

            Twilio.createUser({
                id: modelJSON.id,
                friendlyName: modelJSON.twilioName
            })
        })
    }
}

module.exports = TwilioSync