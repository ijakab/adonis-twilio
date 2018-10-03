'use strict'

const {Command} = require('@adonisjs/ace')
const Config = use('Config')

class ToolsCommand extends Command {
    /**
     * The command signature getter to define the
     * command name, arguments and options.
     *
     * @attribute signature
     * @static
     *
     * @return {String}
     */
    static get signature() {
        return 'twilio:tools'
    }

    /**
     * The command description getter.
     *
     * @attribute description
     * @static
     *
     * @return {String}
     */
    static get description() {
        return 'Handy tools for twilio interactions'
    }

    /**
     * The handle method to be executed
     * when running command
     *
     * @method handle
     *
     * @param  {Object} args
     * @param  {Object} options
     *
     * @return {void}
     */
    async handle() {
        const TwilioService = use('Adonis/TwilioService')
        const User = use(Config.get('twilio.UserModel'))
        const TwilioUser = use('Adonis/Twilio/TwilioUser')

        const choice = await this.choice('What do you want to do?',
            [
                {
                    name: 'Drop all twilio users (both twilio and our side)',
                    value: 'drop'
                },
                {
                    name: 'Index all users from db to twilio (will create or update our db)',
                    value: 'index'
                }
            ])


        switch (choice) {
            case 'drop':
                // get the client
                const twilioClient = TwilioService.getClient()

                const twilioUsers = await twilioClient.users.list()

                for (let user of twilioUsers) {
                    this.info(`Dropping user sid: ${user.sid}`)
                    await twilioClient.users(user.sid).remove()
                }

                // truncate twilio user table... we just deleted all users from twilio
                await TwilioUser.truncate()

                break
            case 'index':
                // truncate twilio user table... we will reindex everything
                await TwilioUser.truncate()

                const appUsers = await User.all()

                for (let user of appUsers.rows) {
                    // call getters (computed properties)
                    const userJSON = user.toJSON()

                    this.info(`Creating user id: ${userJSON.id} with twilioName of: ${userJSON.twilioName}`)
                    await TwilioService.createUser(userJSON)
                }

                break
        }


        this.success('ALL DONE!')
        process.exit(0)


    }
}

module.exports = ToolsCommand