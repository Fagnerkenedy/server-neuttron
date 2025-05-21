const path = require('path');
const mongoose = require('mongoose')
const logger = require('../utility/logger')
require('dotenv').config();

// Caminho para o diretório que contém o arquivo .env
const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
 
const DB_URI = process.env.MONGODB_URI

// configs
// mongoose.set('debug', true);
mongoose.set('strictQuery', true)
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true, autoIndex: true })


mongoose.connection.once('open', () => logger.msg('info', ['MongoDB'], 'Connected to DB.'))
mongoose.connection.on('error', (error) => logger.msg('error', ['MongoDB'], error))
mongoose.connection.on('disconnect', () => logger.msg('error', ['MongoDB'], 'Disconnected from DB.'))
mongoose.connection.on('close', () => logger.msg('info', ['MongoDB'], 'Connection closed.'))

module.exports = mongoose
