const { hash, parseJSON } = require('../../helpers/utilities');
const data = require('../../lib/data');
const tokenHandler = require('./tokenHandler');

const handlers = {}

handlers.userHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get','post','put','delete']
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handlers._users[requestProperties.method](requestProperties,callback)
    }else{
        callback(405)
    }
    
    // callback(200, {
    //     message: "This is a user url",
    // })
}

handlers._users = {};
handlers._users.post = (requestProperties, callback) => {
    const firstName = typeof(requestProperties.body.firstName) === 'string' && requestProperties.body.firstName.trim().length > 0 ? requestProperties.body.firstName : false;    
    const lastName = typeof(requestProperties.body.lastName) === 'string' && requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;    
    const phone = typeof(requestProperties.body.phone) === 'string' && requestProperties.body.phone.trim().length === 11 ? requestProperties.body.phone : false;   
    const password = typeof(requestProperties.body.password) === 'string' && requestProperties.body.password.trim().length > 6 ? requestProperties.body.password : false;   
    const toAgreement = typeof(requestProperties.body.toAgreement) === 'boolean' ? requestProperties.body.toAgreement : false;   

    if (firstName && lastName && phone && password && toAgreement) {
        data.read('users', phone, (err, user) => {
            if (err) {
                let userObject = {
                    firstName,
                    lastName, 
                    phone,
                    password: hash(password),
                    toAgreement
                }

                data.create('users',phone,userObject, (err) => {
                    if (!err) {
                        callback(200, {
                            'message' : 'user was created suceessfuly'
                        })
                    } else {
                        callback(500, {
                            'error' : 'Could not create user!'
                        })
                    }
                })
            }else{
                callback(500, {
                    error: 'There was a problem in server side'
                })
            }
        })
    }else{
        callback(400, {
            error : 'You have a problem in your request',
        })
    }
} 
handlers._users.get = (requestProperties, callback) => {
    const phone = typeof(requestProperties.queryStringObject.phone) === 'string' && requestProperties.queryStringObject.phone.trim().length === 11 ? requestProperties.queryStringObject.phone : false; 
    if (phone) {
        let token = typeof(requestProperties.headersObject.token) === 'string' ? 
        requestProperties.headersObject.token : false;
     
        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                data.read('users', phone, (err, userObject) => {
                    const user = { ... parseJSON(userObject)} 
                    if (!err && user) {
                        delete user.password;
                        callback(200, user)
                    } else {
                        callback(404, {
                            'error': 'Requested user was not found'
                        })
                    }
                })
            } else {
                callback(403, {
                    error: 'Authentication failed'
                })
            }
        })

    } else {
        callback(404, {
            'error': 'Requested user was not found'
        })
    }
}
handlers._users.put = (requestProperties, callback) => {
    const phone = typeof(requestProperties.body.phone) === 'string' && requestProperties.body.phone.trim().length === 11 ? requestProperties.body.phone : false;

    const firstName = typeof(requestProperties.body.firstName) === 'string' && requestProperties.body.firstName.trim().length > 0 ? requestProperties.body.firstName : false;    
    const lastName = typeof(requestProperties.body.lastName) === 'string' && requestProperties.body.lastName.trim().length > 0 ? requestProperties.body.lastName : false;    
    const password = typeof(requestProperties.body.password) === 'string' && requestProperties.body.password.trim().length > 6 ? requestProperties.body.password : false; 
    
    if (phone) {
        let token = typeof(requestProperties.headersObject.token) === 'string' ? 
        requestProperties.headersObject.token : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                if (firstName || lastName || password) {
                    data.read('users', phone, (err, userDataObject) => {
                        const userData = {... parseJSON(userDataObject)}
                        if (!err && userData) {
                            if (firstName) {
                                userData.firstName = firstName
                            }
                            else if(lastName){
                                userData.lastName = lastName
                            }
                            else if(password){
                                userData.password = hash(password)
                            }
        
                            data.update('users', phone, userData, (err) => {
                                if (!err) {
                                    callback(200, {
                                        message: 'User updated successfuly'
                                    })
                                } else {
                                    callback(500, {
                                        error: 'There is problem in the server side'
                                    })
                                }
                            })
                        } else {
                            callback(400, {
                                error: 'Nothing to change'
                                
                            })
                        }
                    })
                }else{
                    callback(400, {
                        error: 'Nothing to change'
                    })
                }
            } else {
                callback(403, {
                    error: 'Authentication failed'
                })
            }
        })

    } else {
        callback(404, {
            error: 'Invalid phone number. Please try again'
        })
    }

}
handlers._users.delete = (requestProperties, callback) => {
    const phone = typeof(requestProperties.queryStringObject.phone) === 'string' && requestProperties.queryStringObject.phone.trim().length === 11 ? requestProperties.queryStringObject.phone : false; 
    if(phone){
         let token = typeof(requestProperties.headersObject.token) === 'string' ? 
        requestProperties.headersObject.token : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        data.delete('users', phone, (err) => {
                            if (!err) {
                                callback(200, {
                                    message: 'User deleted succesfuly'
                                })
                            } else {
                                callback(500, {
                                    message: 'There was a problem deleting user'
                                })
                            }
                        })
                    } else {
                        callback(500, {
                            message: 'User cant be deleted succesfuly',
                            err: err
                        })
                    }
                })
            } else {
                callback(403, {
                    error: 'Authentication failed'
                })
            }
        })

    }else {
        callback(404, {
            "error" : 'User doesnt exist'
        })
    }
}
module.exports = handlers