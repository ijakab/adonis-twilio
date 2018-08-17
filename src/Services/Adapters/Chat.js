const Env = use('Env')
const BaseProduct = use('Adonis/Twilio/BaseProducts')

class Chat extends BaseProduct {
    constructor() {
        super()
    }

    static client(appClient) {
        return appClient.chat.services(Env.get('TWILIO_SERVICE'))
    }

    static async createUser(client, user) {
        await client.users.create(user)
    }
}

module.exports = Chat