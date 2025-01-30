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
            
            await connection.execute(queryContacts);
            await connection.execute(queryConversations);
            await connection.execute(queryMessages);
            await connection.end();
        } catch (error) {
            console.error("Erro ao criar tabelas e inserir dados nos Chats:", error);
            throw error;
        }
    }
}