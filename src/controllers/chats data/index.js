const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')

module.exports = {
    chatsData: async (orgId) => {
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });
            const queryContacts = `CREATE TABLE IF NOT EXISTS contacts (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                wa_id VARCHAR(255),
                bot_step INT(20),
                record_id VARCHAR(255),
                created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
            );`;
            const queryConversations = `CREATE TABLE IF NOT EXISTS conversations (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                wa_id_contact VARCHAR(255),
                unread INT(20),
                last_message TEXT,
                created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
            );`;
            const queryMessages = `CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(255) PRIMARY KEY,
                conversationId VARCHAR(255),
                senderId VARCHAR(255),
                name VARCHAR(255),
                body TEXT,
                created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
                updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
            );`;

            const queryBots = `CREATE TABLE IF NOT EXISTS bots (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            description VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`;
            const queryFlows = `CREATE TABLE IF NOT EXISTS flows (
                id VARCHAR(255) PRIMARY KEY,
                bot_id VARCHAR(255),
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`;
            const querySteps = `CREATE TABLE IF NOT EXISTS steps (
            id VARCHAR(255) PRIMARY KEY,
            flow_id VARCHAR(255),
            name VARCHAR(255),
            type VARCHAR(255),
            content JSON,
            step VARCHAR(255),
            next_step VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`;
            
            await connection.execute(queryContacts);
            await connection.execute(queryConversations);
            await connection.execute(queryMessages);
            await connection.execute(queryBots);
            await connection.execute(queryFlows);
            await connection.execute(querySteps);
            await connection.end();
        } catch (error) {
            console.error("Erro ao criar tabelas e inserir dados nos Chats:", error);
            throw error;
        }
    }
}