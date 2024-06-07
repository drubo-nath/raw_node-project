const { checkHandler } = require('./handlers/routeHandlers/checkHandler')
const {sampleHandlers} = require('./handlers/routeHandlers/sampleHandlers')
const { tokenHandler } = require('./handlers/routeHandlers/tokenHandler')
const {userHandler} = require('./handlers/routeHandlers/userHandler')




const routes = {
    sample:  sampleHandlers,
    user: userHandler,
    token: tokenHandler,
    check: checkHandler,
}

module.exports = routes