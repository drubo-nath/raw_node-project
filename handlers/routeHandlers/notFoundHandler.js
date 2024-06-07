const handlers = {}

handlers.notFoundHandler = (requestProperties, callback) => {
    console.log('Not found');
    callback(404, {
        message : 'Your requested url was not found'
    })
}

module.exports = handlers