const { hash, parseJSON, createRandomString } = require('../../helpers/utilities');
const data = require('../../lib/data');
const checkHandler = require('./checkHandler');
const { tokenHandler } = require('./tokenHandler');
const {maxChecks} = require('../../helpers/environment')

const handlers = {}

handlers.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get','post','put','delete']
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handlers._check[requestProperties.method](requestProperties,callback)
    }else{
        callback(405)
    }
    
    // callback(200, {
    //     message: "This is a user url",
    // })
}

handlers._check = {};

handlers._check.post = (requestProperties, callback) => {
   let protocol = typeof(requestProperties.body.protocol) === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 
   ? requestProperties.body.protocol : false;

   let url = typeof(requestProperties.body.url) === 'string' ? requestProperties.body.url : false;

   let method = typeof(requestProperties.body.method) === 'string' && ['GET', 'POST', 'PUR', 'DELETE    '].indexOf(requestProperties.body.method) > -1 
    ? requestProperties.body.method : false;

    let sucessCodes = typeof(requestProperties.body.sucessCodes) === 'object' && requestProperties.body.sucessCodes instanceof Array
    ? requestProperties.body.sucessCodes : false;

    let timeoutSeconds = typeof(requestProperties.body.timeoutSeconds) === 'number' && requestProperties.body.timeoutSeconds % 1 === 0 
    ? requestProperties.body.timeoutSeconds : false;

    if (protocol && url && method && sucessCodes && timeoutSeconds) {
        let token = typeof(requestProperties.headerObject.token) === 'string' 
        ? requestProperties.headerObject.token : false;

        data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                let userPhone = parseJSON(tokenData).userPhone
                data.read('users', userPhone, (err, userData) => {

                    if (!err && userData) {
                        tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                            if (tokenIsValid) {
                                let userObject = parseJSON(userData)
                                let userChecks = typeof(userObject.checks) === 'object' && userObject.checks instanceof Array 
                                ? userObject.checks : [];

                                if (userChecks.length < 5) {
                                    let checkId = createRandomString(20)
                                    let checkObj = {
                                        'id' : checkId,
                                        'userPhone': userPhone,
                                        protocol,
                                        url,
                                        method,
                                        sucessCodes,
                                        timeoutSeconds
                                    }
                                    data.create('checks', checkId, checkObj, (err) => {
                                        if (!err ) {
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId)

                                            data.update('users', userPhone, userObject, (err) => {
                                                if (!err) {
                                                    callback(200, checkObj)
                                                } else {
                                                    callback(500, {
                                                        error: 'There was a problem in the server side'
                                                    })
                                                }
                                            })
                                        } else {
                                            callback(500, {
                                                error: 'There was a problem in the server side'
                                            })
                                        }
                                    })
                                } else {
                                    callback(500, {
                                        error: 'There was a problem in the server side'
                                    })
                                }
                            } else {
                                callback(500, {
                                    error: 'There was a problem in the server side'
                                })
                            }
                        })
                    } else {
                        callback(500, {
                            error: 'There was a problem in the server side'
                        })
                    }
                })
            } else {
                callback(500, {
                    error: 'There was a problem in the server side'
                })
            }
        })
    } else {
        callback(400, {
            error: 'There was a problem in request'
        })
    }
} 





handlers._check.get = (requestProperties, callback) => {
    const id = typeof(requestProperties.queryStringObject.id) === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ? requestProperties.queryStringObject.id : false; 
    if (id) {
        data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                let token = typeof(requestProperties.headerObject.token) === 'string' 
                ? requestProperties.headerObject.token : false;

                tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, parseJSON(checkData))
                    } else {
                        callback(403, {
                            error: 'Authentication failure'
                        })
                    }
                })
            } else {
                callback(500, {
                    error: 'There was a problem in the server side'
                })
            }
        })
    } else {
        callback(400, {
            error: 'There was a problem in request'
        })
    }
}
handlers._check.put = (requestProperties, callback) => {
    const id = typeof(requestProperties.queryStringObject.id) === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ? requestProperties.queryStringObject.id : false; 
    let protocol = typeof(requestProperties.body.protocol) === 'string' && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1 
   ? requestProperties.body.protocol : false;

   let url = typeof(requestProperties.body.url) === 'string' ? requestProperties.body.url : false;

   let method = typeof(requestProperties.body.method) === 'string' && ['GET', 'POST', 'PUR', 'DELETE    '].indexOf(requestProperties.body.method) > -1 
    ? requestProperties.body.method : false;

    let sucessCodes = typeof(requestProperties.body.sucessCodes) === 'object' && requestProperties.body.sucessCodes instanceof Array
    ? requestProperties.body.sucessCodes : false;

    let timeoutSeconds = typeof(requestProperties.body.timeoutSeconds) === 'number' && requestProperties.body.timeoutSeconds % 1 === 0 
    ? requestProperties.body.timeoutSeconds : false;

    if (id) {
        if (protocol || url || method || sucessCodes || timeoutSeconds) {
            data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    let checkObj = parseJSON(checkData) 
                    let token = typeof(requestProperties.headerObject.token) === 'string' 
                    ? requestProperties.headerObject.token : false;

                    tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) {
                                checkObj.protocol = protocol;
                            }
                            else if (url) {
                                checkObj.url = url;
                            }
                            else if (method) {
                                checkObj.method = method;
                            }
                            else if (sucessCodes) {
                                checkObj.sucessCodes = sucessCodes;
                            }
                            else if (timeoutSeconds) {
                                checkObj.timeoutSeconds = timeoutSeconds;
                            }
                        
                            data.update('checks', id, checkObj, (err) => {
                                if (!err) {
                                    callback(200)
                                } else {
                                    callback(500, {error: 'There was a server side error'})
                                }
                            })
                        } else {
                            callback(403, {
                                error: 'Authentication error'
                            })
                        }
                    })
                } else {
                    callback(500, {
                        error: 'There was a problem in sever side'
                    })
                }
            })
        } else {
            callback(400, {
                error: 'Provide atleast one field to update'
            })
        }
    } else {
        callback(400, {
            error: 'There was a problem in request'
        })
    }


}


handlers._check.delete = (requestProperties, callback) => {
    const id = typeof(requestProperties.queryStringObject.id) === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ? requestProperties.queryStringObject.id : false; 
    if (id) {
        data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                let token = typeof(requestProperties.headerObject.token) === 'string' 
                ? requestProperties.headerObject.token : false;

                tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        data.delete('checks', id, (err) => {
                            if (!err) {
                                data.read('users', parseJSON(checkData).userPhone, (err, userData) => {
                                    if (!err && userData) {
                                        let userObject = parseJSON(userData)
                                        let userChecks = typeof(userObject.checks) === 'object' && userObject.checks instanceof Array ? userObject.checks : []

                                        let checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1)

                                            userObject.checks = userChecks;
                                            data.update('users', userObject.phone, userObject, (err) => {
                                                callback(200)
                                            })
                                        } else {
                                            callback(500, {
                                            error: 'there is a problem in server side'
                                        })
                                        }
                                    } else {
                                        callback(500, {
                                            error: 'there is a problem in server side'
                                        })
                                    }
                                })
                            } else {
                                callback(500, {
                                    error: 'There was a server side problem'
                                })
                            }
                        })
                    } else {
                        callback(403, {
                            error: 'Authentication failure'
                        })
                    }
                })
            } else {
                callback(500, {
                    error: 'There was a problem in the server side'
                })
            }
        })
    } else {
        callback(400, {
            error: 'There was a problem in request'
        })
    }
}
module.exports = handlers