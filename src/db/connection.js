// require("dotenv").config({
//     path: "../../.env"
// })


// async function connect() {
//     if (global.connection && global.connection.state !== 'disconnected')
//         return global.connection;

//     const mysql = require("mysql2/promise");
//     const connection = mysql.createConnection({
//         host: 'cloud.wikiconsultoria.com.br',
//         user: 'root',
//         database: 'zohooauth',
//         password: "Sugar@123456"
//     });
//     console.log("Conectou no MySQL!");
//     global.connection = connection;
//     return connection;
// }


// module.exports = { connect };