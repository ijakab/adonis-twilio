# Adonis-twilio
This is provider for integrating twilio chat service into your [adonis.js](https://github.com/adonisjs)
As of current version, requires to be built on top of Adonis Starter (link soon)

## Installation
1. *Install the package*
>adonis install adonis-acl-advanced
1. *Register a providers*
Inside `start/app.js`
```javascript
const providers = [
    //anything you have
    'adonis-twilio-provider/providers/TwilioProvider'
    //anything you have
]

const aceProviders = [
    //anything you have
    'adonis-twilio-provider/providers/CommandsProvider'
    //anything you have
]
```
1. *Add relation to user model*
```javascript
twilio_user() {
    return this.hasOne('Adonis/Twilio/TwilioUser')
}
```
1. *Add trait to your user model*
Inside UserModel file (probably `app/Models/User.js`)
```javascript
static get traits() {
    return [
        '@provider:Adonis/Twilio/SyncTrait'
    ]
}
```
1. *Setup database*

Add migrations with

>node ace twilio:setup

Run migrations with

>node ace migration:run

1. *Add twilio data to .env*

```
    ##################
    #  TWILLIO DATA  #
    ##################
    TWILIO_ACCOUNT_SID=account_sid
    TWILIO_TOKEN=auth_token
    TWILIO_SERVICE=service_sid
    TWILIO_SECRET=api_key
```

1. *Add routes*

Inside `start/routes.js`

```javascript
_requireRoutes('Chat').prefix('chat')


// --- PRIVATE
function _requireRoutes(group) {
    return require(`../app/Routes/${group}`)
}
```

More information soon