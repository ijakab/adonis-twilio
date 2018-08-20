const Config = use('Config')
const Twilio = use('Adonis/TwilioService')
const TwilioUser = use('Adonis/Twilio/TwilioUser')

class TwilioSync{
    register(Model) {
        Model.addHook('afterCreate', async function (modelInstance) {
            Twilio.createUser({
                id: modelInstance.id,
                friendlyName: `${modelInstance.firstname} ${modelInstance.lastname}`
            })
        })
    }
}

module.exports = TwilioSync