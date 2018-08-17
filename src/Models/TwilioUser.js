'use strict'

const Model = use('Model')

class TwilioUser extends Model {

    //Relations
    user() {
        return this.belongsTo('App/Models/User')
    }
}

module.exports = TwilioUser
