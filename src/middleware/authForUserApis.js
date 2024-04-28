module.exports = (req, res, next) => {
  if (process.env.USER_API_TOKEN === req.headers["Authorization"]) {
    next();
  }
  else {
    if (!req.headers.authorization) {
      console.log('Received request without authorization in header.')
      return res.status(401).json({ success: false, message: 'Authorization must be supplied.' })
    } else if (req.headers.authorization !== process.env.USER_API_TOKEN) {
      console.log('Received request with invalid authorization.')
      return res.status(403).json({ success: false, message: 'Authorization is invalid.' })
    }
    next()
  }
}
