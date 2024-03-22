const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth.json')

module.exports = (req, res, next) => {
    const autHeader = req.headers.authorization
    
    if(!autHeader)
        return res.status(401).send({ error: 'No token provided!' })
    
    const parts = autHeader.split(' ')

    if(!parts.lenght === 2)
        return res.status(401).send({ error: 'Token error!' })

    const [ scheme, token ] = parts

    if(!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error: 'Token malformatted!' })

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if(err) return res.status(401).send({ error: 'Token invalid or expired' })
        req.organization_id = decoded.organization_id
        return next()
    })
}