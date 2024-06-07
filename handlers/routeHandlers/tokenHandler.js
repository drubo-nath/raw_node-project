const {
  hash,
  parseJSON,
  createRandomString,
} = require("../../helpers/utilities");
const data = require("../../lib/data");

const handlers = {};

handlers.tokenHandler = (requestProperties, callback) => {
  const acceptedMethods = ["get", "post", "put", "delete"];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handlers._token[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }

};

handlers._token = {};
handlers._token.post = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.body.phone === "string" &&
    requestProperties.body.phone.trim().length === 11
      ? requestProperties.body.phone
      : false;
  const password =
    typeof requestProperties.body.password === "string" &&
    requestProperties.body.password.trim().length > 6
      ? requestProperties.body.password
      : false;

  if (phone && password) {
    data.read("users", phone, (err, userData) => {
      let hashedPassword = hash(password);
      if (hashedPassword === parseJSON(userData).password) {
        let tokenId = createRandomString(20);
        let expires = Date.now() + 3600000;
        let tokenObj = {
          phone,
          id: tokenId,
          expires,
        };

        data.create("tokens", tokenId, tokenObj, (err) => {
          if (!err) {
            callback(200, tokenObj);
          } else {
            callback(500, {
              error: "creating token failed",
            });
          }
        });
      } else {
        callback(400, {
          error: "password is not valid",
        });
      }
    });
  } else {
    callback(400, {
      error: "There is a problem in post req in token",
    });
  }
};

handlers._token.get = (requestProperties, callback) => {
     const id = typeof(requestProperties.queryStringObject.id) === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ? requestProperties.queryStringObject.id : false; 
    if (id) {
        data.read('tokens', id, (err, tokenData) => {
            const token = { ... parseJSON(tokenData)} 
            if (!err && token) {
                callback(200, token)
            } else {
                callback(404, {
                    'error': 'Requested token was not found'
                })
            }
        })
    } else {
        callback(404, {
            'error': 'Requested token was not found'
        })
    }
};
handlers._token.put = (requestProperties, callback) => {
    const id = typeof(requestProperties.body.id) === 'string' && requestProperties.body.id.trim().length === 20 ? requestProperties.body.id : false;
    
    const extend = typeof(requestProperties.body.extend) === 'boolean' ? requestProperties.body.extend : false; 

    if (id && extend) {
        data.read('tokens', id, (err, tokenData) => {
            let tokenObj = parseJSON(tokenData)
            if (tokenObj.expires > Date.now()) {
                tokenObj. expires = Date.now() + 3600000;

                data.update('tokens', id, tokenObj, (err) => {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(500, {
                            'error': 'Updating token was failed'
                        })
                    }
                })
            } else {
                callback(404, {
                    'error': 'token already expired'
                })
            }
        })
    } else {
        callback(404, {
            'error': 'Requested token was not found'
        })
    }
};
handlers._token.delete = (requestProperties, callback) => {
    const id = typeof(requestProperties.queryStringObject.id) === 'string' && requestProperties.queryStringObject.id.trim().length === 20 ? requestProperties.queryStringObject.id : false; 
    if(id){
        data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200, {
                            message: 'token deleted succesfuly'
                        })
                    } else {
                        callback(500, {
                            message: 'There was a problem deleting token'
                        })
                    }
                })
            } else {
                callback(500, {
                    message: 'token cant be deleted succesfuly',
                    err: err
                })
            }
        })
    }else {
        callback(404, {
            "error" : 'token doesnt exist'
        })
    }
};

handlers._token.verify = (id, phone, callback) => {
    data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (parseJSON(tokenData).phone === phone && parseJSON(tokenData).expires > Date.now()) {
                callback(true)
            }else{
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}


module.exports = handlers;
