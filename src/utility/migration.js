require('dotenv').config()
const mysql = require('mysql2/promise');
const dbConfig = require('../database/index')
const fs = require('fs-extra');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const logger = require('./logger')

// // Configuração do logger
// const logger = createLogger({
//     level: 'info',
//     format: format.combine(
//         format.timestamp(),
//         format.printf(({ timestamp, level, message }) => {
//             return `${timestamp} [${level.toUpperCase()}]: ${message}`;
//         })
//     ),
//     transports: [
//         new transports.Console(),
//         new transports.File({ filename: 'app.log' })
//     ]
// });

// Função para buscar orgIds
async function fetchOrgIds() {
    logger.info('Conectando ao banco de dados Neuttron para buscar orgIds.');
    console.log("usdere", dbConfig)
    const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
    const [rows] = await connectionNeuttron.execute('SELECT DISTINCT orgId FROM users;');
    await connectionNeuttron.end();
    logger.info('orgIds recuperados com sucesso.');
    return rows.map(row => row.orgId);
}

// Função para encontrar o arquivo mais recente na pasta especificada
function findLatestScriptFile(directory) {
    logger.info(`Procurando o arquivo SQL mais recente na pasta: ${directory}`);
    const files = fs.readdirSync(directory);
    const scriptFiles = files.filter(file => path.extname(file) === '.sql');

    if (scriptFiles.length === 0) {
        const errorMessage = 'Nenhum arquivo SQL encontrado na pasta.';
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    scriptFiles.sort((a, b) => {
        // Extrair o número do nome do arquivo (assumindo o padrão '001', '002', etc.)
        const aNumber = parseInt(path.basename(a, '.sql').match(/\d+/)[0], 10);
        const bNumber = parseInt(path.basename(b, '.sql').match(/\d+/)[0], 10);
        return bNumber - aNumber;
    });

    const latestScript = path.join(directory, scriptFiles[0]);
    logger.info(`Arquivo SQL mais recente encontrado: ${latestScript}`);
    return latestScript;
}

// Função para executar o script MySQL em cada orgId
async function executeScriptInEachDatabase(orgIds, scriptFilePath) {
    const scriptContent = fs.readFileSync(scriptFilePath, 'utf-8');
    const queries = scriptContent.split(';').filter(query => query.trim());
    logger.info(`Executando script SQL em ${orgIds.length} bancos de dados.`);
    logger.info(`Conteúdo do script: ${scriptContent}`);

    for (const orgId of orgIds) {
        const dbName = `org${orgId}`;
        const orgDbConfig = { ...dbConfig, database: dbName };

        logger.info(`Conectando ao banco de dados: ${dbName}`);
        const connection = await mysql.createConnection(orgDbConfig);
        try {
            for (const query of queries) {
                if (query.trim()) {
                    await connection.query(query);
                }
            }
            logger.info(`Script executado com sucesso no banco: ${dbName}`);
        } catch (error) {
            logger.error(`Erro ao executar script no banco: ${dbName}. Erro: ${error.message}`);
        } finally {
            await connection.end();
        }
    }
}

// Função principal para executar o processo
async function main() {
    try {
        const orgIds = await fetchOrgIds();
        const scriptFilePath = findLatestScriptFile('./src/scripts');
        await executeScriptInEachDatabase(orgIds, scriptFilePath);
        logger.info('Script executado em todos os bancos.');
    } catch (error) {
        logger.error('Erro ao executar o script:', error);
    }
}

main();
