const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path');
const fs = require('fs')
const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
let server
// if (process.env.NODE_ENV === 'production') {
//     try {
//         const options = {
//             key: fs.readFileSync(process.env.PRIVATE_KEY),
//             cert: fs.readFileSync(process.env.CERTIFICATE),
//         };
//         server = https.createServer(options, app);
//         console.log('Servidor HTTPS configurado.');
//     } catch (error) {
//         console.error('Erro ao carregar certificados HTTPS:', error.message);
//         process.exit(1); // Encerra o processo em caso de erro
//     }
// } else {
//     console.log('Servidor HTTP configurado para ambiente de desenvolvimento.');
// }
server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use((req, res, next) => {
    req.io = io;
    next();
});

//MIDDLEWARES
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.options('*', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.sendStatus(200);
});

app.use(bodyParser.json())

app.use('/auth', require("./routes/userRoutes"))
app.use("/crm", require('./routes'))
app.use("/payment", require('./routes/payments'))
app.use("/charts", require('./routes/charts'))
app.use("/settings", require('./routes/settings'))
app.use("/permissions", require('./routes/permissions'))
app.use("/sections", require('./routes/sections'))
app.use("/kanbans", require('./routes/kanban'))
app.use("/notifications", require('./routes/notifications'))
app.use("/messages", require('./routes/messages'))
app.use("/chat", require('./routes/chat'))


io.on("connection", (socket) => {
    console.log("Socket conectado: ",socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(process.env.EXPRESS_PORT, () => {
    console.log(`App running in port: ${process.env.EXPRESS_PORT}`)
})