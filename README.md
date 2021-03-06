# Adonis-twilio
This is provider for integrating twilio chat service into your [adonis.js](https://github.com/adonisjs)
As of current version, requires to be built on top of Adonis Starter (link soon)

## Installation
1. *Install the package*
>adonis install adonis-twilio-provider
1. *Register a providers*
Inside `start/app.js`

```javascript
const providers = [
    //anything you have
    'adonis-twilio-provider/Providers/TwilioProvider'
    //anything you have
]

const aceProviders = [
    //anything you have
    'adonis-twilio-provider/Providers/CommandsProvider'
    //anything you have
]
```

1. *Add config file*
inside `config/twilio.js`

```javascript
module.exports = {
    UserModel: 'App/Models/User'
}
```

1. *Add relation to user model*
```javascript
twilio_user() {
    return this.hasOne('Adonis/Twilio/TwilioUser')
}
```
1. *Add computed property to your user model*
Inside UserModel file (probably `app/Models/User.js`)
```javascript
static get computed () {
    return ['twilioName']
}

getTwilioName ({ firstname, lastname }) {
    return `${firstname} ${lastname}`
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
    TWILIO_ACCOUNT_SID=Your account sid starting with AC
    TWILIO_TOKEN=Authorization token (on dashboard it is hidden but you can click show button)
    TWILIO_API_KEY_SID=Inside service, API key you registered (you can have multiple) SID starting with SK
    TWILIO_API_KEY_SECRET=That string that was shown to you only once and you had to write it down... if you lost it you need new api key
    TWILIO_SERVICE_SID=SID of service starting with SK
```

## Philosophy

This provider uses twilio service for real-time communication. Some things it does through twilio, and some things it handles on your application

### It uses twilio for

1. Receiving events for new messages in chats
1. Pushing messages to chats, along with files
1. Receiving events for new chats
1. Receiving events for new users in chats
1. Receiving events for added video to chat
1. Communication through video

Why? Real time communication is tricky to handle, especially with adding files and video communication, that is why we use twilio to handle the heavy lifting
Your front-end will take a token from back-end and use twilio directly for these purposes.

### It uses your app to

1. Generating tokens for users
1. Creating new chats
1. Adding users to chats
1. Removing users from chats
1. Add videos to chat

Why? Even thou twilio provides these services on it's own, and this provider contacts twilio for these actions anyway, you probably need a lot more flexibility in your application. For example, when displaying user his chats - e.g. participants' avatars, names etc. You could put it in twilio additional data but it makes for hell in maintaining you app.
Your fronted will contact your back-end directly to perform these actions

### Major drawback

This approach has a drawback however - you will have to implement your own ACL. *This provider does not come with acl implemented for you*. [We recommend using Adonis ACL](https://github.com/ijakab/Adonis-acl) as both were built for the same project and we will make sure they are always compatible

## Reference

### Service methods

To use these methods write something like this

```javascript
const Twilio = use('Adonis/TwilioService')
Twilio.methodName(inputs)
```

| Method name | Inputs | Return | Description |
| ----------- | ------ | ------ | ----------- |
| createUser | object containing attribute *id* matching your user id and friendlyName | Twilio response | Call this to sync user. *You probably don't need this method* if you registered twilioSync trait to user model. For existing user call twilio:tools command |
| generateToken | `user_id` id of user, `endpointId` from font-end | token | Your front-end will need this token to connect to twilio |
| createChat | *data* any data twilio supports, *creator_id* user object who created chat, *users* users objects to add to chat, *not including creator* | Twilio response | First, it checks if chat with provided members exist. If that is the case, returns it. Otherwise creates new |
| addToChat | *chat* your local chat instance, *user* user instance to add, *role_name* name of twilio role. You probably want to add everyone as 'user' since you need your acl, but you can add admins if you want | Twilio response | Call this to add users to chat
| removeFromChat | *chat* your local chat instance, *user* user instance to remove | void | Removes user from chat |
| removeChat | *id* local id of chat to remove | Void | Removes chat and video on it |
| createUserIfNotExist | *user* your user instance | Void | Adds user to twilio if one did not exist. You might want to call this before adding users to chat, because you don't want to pay for all users, and good portion of them will never use these services

### Videos

```javascript
const Twilio = use('Adonis/TwilioService')
Twilio.addVideoToChat(inputs, {recordParticipantsOnConnect: true})
Twilio.endVideoOnChat(inputs)
```

Call these methods to add videos to chats with provided twilio sid (not local id).
It will create new Video room. Your front-end will have to listen for changes on Channel. When video room is created, appropriate Channel will get an update to it's additional data with name of video room. Front-end will then connect to that room
When video ends, front-end will also receive event that channel is changed, and in additional data it will get null for video, in which case it should remove call interface

When creating video, it will first check if that chat already has video going on, in which case it returns it

### Models

You can use this provider's models for as regular lucid models, in fact you probably need to.
Access them as:

```javascript
const TwilioUser = use('Adonis/Twilio/TwilioUser')
const UserChat = use('Adonis/Twilio/UserChat')
const ChatLocal = use('Adonis/Twilio/ChatLocal')
```

So, if you need to query data, you can write something like this
```javascript
await ChatLocal.query()
    .where('id', CHAT_LOCAL_ID)
    .with('users.user', q => {
        //this q is user query builder
        q.with('avatar')
        q.with('anything')
    })
```
Note that to access users, we go chat.users.user, because Chat has many users (twilio users, added by this provider) and those have one user (your user)

### Commands

`adonis twilio:setup` Adds migration to your project

`adonis twilio:tools` Tools for syncing existing users to twilio and removing all users. Follow the instruction

More information soon