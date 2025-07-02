

const http = require('http');
const https = require('https');
const fs = require('fs')

const configureSocketIoServer = (app) => {
    let server
    if (process.env.NODE_ENV === 'production') {
        try {
            // Carregar os arquivos do certificado SSL
            const options = {
                key: fs.readFileSync(process.env.PRIVATE_KEY),
                cert: fs.readFileSync(process.env.CERTIFICATE),
            };
            // Criar um servidor HTTPS
            server = https.createServer(options, app);
            console.log('Servidor HTTPS configurado.');
        } catch (error) {
            console.error('Erro ao carregar certificados HTTPS:', error.message);
            process.exit(1); // Encerra o processo em caso de erro
        }
    } else {
        server = http.createServer(app);
        console.log('Servidor HTTP configurado para ambiente de desenvolvimento.');
    }
    // Configurar o socket.io com o servidor HTTP ou HTTPS
    return server
}

module.exports = configureSocketIoServer