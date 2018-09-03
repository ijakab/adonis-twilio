'use strict'

const ace = require('@adonisjs/ace')
const { ServiceProvider } = require('@adonisjs/fold')

class CommandsProvider extends ServiceProvider {
    register () {
        this.app.bind('Adonis/Commands/Twilio:Setup', () => require('../commands/setup'))
        this.app.bind('Adonis/Commands/Twilio:Tools', () => require('../commands/tools'))
    }

    boot () {
        ace.addCommand('Adonis/Commands/Twilio:Setup')
        ace.addCommand('Adonis/Commands/Twilio:Tools')
    }
}

module.exports = CommandsProvider