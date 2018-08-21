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
        this.app.bind('Adonis/Twilio/Video', () => {
            return require('../src/Services/Adapters/Video')
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

        this.app.bind('Adonis/Twilio/UserChat', () => {
            let Model = require('../src/Models/UserChat')
            Model._bootIfNotBooted()
            return Model
        })

        this.app.bind('Adonis/Twilio/ChatLocal', () => {
            let Model = require('../src/Models/TwilioChat')
            Model._bootIfNotBooted()
            return Model
        })

        this.app.bind('Adonis/Twilio/Invites', () => {
            let Model = require('../src/Models/TwilioInvite')
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