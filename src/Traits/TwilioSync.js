const Config = use('Config')
const Twilio = use('Adonis/TwilioService')
const TwilioUser = use('Adonis/Twilio/TwilioUser')

class TwilioSync{
    register(Model) {
        Model.addHook('afterCreate', async function (modelInstance) {
            let res = await Twilio.createUser({
                identity: modelInstance.id,
                friendlyName: `${modelInstance.firstname} ${modelInstance.lastname}`
            })
            await TwilioUser.create({
                user_id: modelInstance.id,
                sid: res.sid
            })
        })
    }
}

module.exports = TwilioSync