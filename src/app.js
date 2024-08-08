const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path');
const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

//MIDDLEWARES
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    next();
});

app.use(bodyParser.json())

app.use('/auth', require("./routes/userRoutes"))
app.use("/crm", require('./routes'))
app.use("/payment", require('./routes/payments'))
app.use("/charts", require('./routes/charts'))
app.use("/settings", require('./routes/settings'))
app.use("/permissions", require('./routes/permissions'))
app.use("/sections", require('./routes/sections'))

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`App running in port: ${process.env.EXPRESS_PORT}`)
})