const https = require('https');
const { hostname } = require('os');
const queryString = require('queryString')

const notifications = {}

notifications.sendTwilioSms = (phone, msg, callback) => {
    const userPhone = typeof( phone) === 'string' && phone.trim().length === 11 ?  phone.trim() :
    false;
    const userMsg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600
     ? msg.trim : false;

    if (userPhone && userMsg) {
        
        const payload = {
            From: '',
            To: `+88${userPhone}`,
            Body: userMsg,
        }
        const stringifyPayload = queryString.stringify(payload)

        const requestDetails = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: ``,
            auth: ``,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }


        const req = https.request(requestDetails, (res) => {
             const status = res.statusCode;
             if (status === 200 || status === 300) {
                callback(false)
             } else {
                callback(`Status code returned was ${status}`)
             }
        })

        req.on('error', (err) => {
            callback(err)
        })
        req.write(stringifyPayload)
        req.end()

    } else {
        callback('Given parameters were missing or invalid')
    }
}

module.exports = notifications;