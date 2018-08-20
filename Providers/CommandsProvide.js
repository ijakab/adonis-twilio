'use strict'

const ace = require('@adonisjs/ace')
const { ServiceProvider } = require('@adonisjs/fold')

class CommandsProvider extends ServiceProvider {
    register () {
        this.app.bind('Adonis/Commands/Twilio:Setup', () => require('../commands/setup'))
    }

    boot () {
        ace.addCommand('Adonis/Commands/Twilio:Setup')
    }
}

module.exports = CommandsProvider