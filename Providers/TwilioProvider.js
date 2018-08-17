'use strict'
const { ServiceProvider } = require('@adonisjs/fold')

class TwilioProvider extends ServiceProvider {
    register () {
        //Services
        this.app.bind('Adonis/TwilioService', () => {
            const Config = this.app.use('Adonis/Src/Config')
            let service = require('../src/Services/index')
            service.init(Config)
            return service
        })
        //Adapters
        this.app.bind('Adonis/Twilio/Chat', () => {
            return require('../src/Services/Adapters/Chat')
        })
        this.app.bind('Adonis/Twilio/BaseProducts', () => {
            return require('../src/Services/Adapters/BaseProduct')
        })

        //Models
        this.app.bind('Adonis/Twilio/TwilioUser', () => {
            let Model = require('../src/Models/TwilioUser')
            Model._bootIfNotBooted()
            return Model
        })

        //Traits
        this.app.bind('Adonis/Twilio/SyncTrait', () => {
            let Trait = require('../src/Traits/TwilioSync')
            return new Trait()
        })
    }

    boot () {
    }
}

module.exports = TwilioProvider