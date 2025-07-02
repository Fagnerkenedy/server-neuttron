const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path');
const configureSocketIoServer = require('./utility/configureSocketIoServer');
const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });
const { Server } = require('socket.io');

const server = configureSocketIoServer(app)
const io = new Server(server, { cors: { origin: process.env.FRONT_URL, methods: ['GET', 'POST'] } });
app.use((req, res, next) => { req.io = io; next(); });

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

// app.use("/downloadModel", require("./routes/downloadModel"));
// app.use("/fields", require("./routes/fields"));
// app.use("/upload", require("./routes/upload"));
// app.use("/processing", require("./routes/processing"));

io.on("connection", (socket) => {
    console.log("Socket conectado: ", socket.id);
    socket.on('identify', ({ orgId }) => {
        console.log(`Socket ${socket.id} identificado com orgId: ${JSON.stringify(orgId)}`);
        socket.join(orgId);
        socket.join('orgId');
        // io.to(orgId).emit('newMessage', "message teste");
        // console.log("io.sockets.adapter.rooms: ", io.sockets.adapter)
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(process.env.EXPRESS_PORT, () => {
    console.log(`App running in port: ${process.env.EXPRESS_PORT}`)
})