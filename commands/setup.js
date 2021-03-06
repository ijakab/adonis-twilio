'use strict'

const { Command } = require('@adonisjs/ace')
const path = require('path')
const Helpers = use('Adonis/Src/Helpers')

class SetupCommand extends Command {
    /**
     * The command signature getter to define the
     * command name, arguments and options.
     *
     * @attribute signature
     * @static
     *
     * @return {String}
     */
    static get signature () {
        return 'twilio:setup'
    }

    /**
     * The command description getter.
     *
     * @attribute description
     * @static
     *
     * @return {String}
     */
    static get description () {
        return 'Setup migration for twilio'
    }

    /**
     * Generates the blueprint for a given resources
     * using pre-defined template
     *
     * @method generateBlueprint
     *
     * @param  {String}         name
     *
     * @return {void}
     */
    async createFile(template, path) {
        const templateContents = await this.readFile(template, 'utf-8')
        await this.generateFile(path, templateContents)

        const createdFile = path.replace(Helpers.appRoot(), '').replace(path.sep, '')
        console.log('Created fle ' + path)
    }

    async generateBlueprint (name) {
        const templateFile = path.join(__dirname, './templates', `${name}.mustache`)
        const fileName = `${new Date().getTime()}_${name}`
        const filePath = Helpers.migrationsPath(`${fileName}.js`)
        await this.createFile(templateFile, filePath)
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
    async handle () {
        try {
            await this.generateBlueprint('create_twilio_user')
            await this.generateBlueprint('create_chat')
            await this.generateBlueprint('create_invites')
            await this.generateBlueprint('create_user_chat')
        } catch ({ message }) {
            this.error(message)
        }
    }
}

module.exports = SetupCommand