const axios = require('axios')
const mysql = require('mysql2/promise')
const dbConfig = require('../../database/index')
const crypto = require('crypto')

const { GRAPH_API_TOKEN } = process.env;

module.exports = {
    sendMessage: async (req, res) => {
        const { numberId, to, message, conversationId, userName, userId } = req.body;
        const { org } = req.params
        const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${numberId}/messages`
        const connection = await mysql.createConnection({ ...dbConfig, database: `${org}` });

        try {
            const response = await axios.post(
                WHATSAPP_API_URL,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    // type: 'template',
                    // template: {
                    //     name: 'hello_world',
                    //     language: {
                    //         code: 'en_US'
                    //     },
                    // },
                    text: { body: message },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                }
            );
            await connection.beginTransaction();

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }

            const messageId = gerarHash(JSON.stringify({ numberId, to, message }))
            const [contact] = await connection.execute('SELECT * FROM contacts WHERE id = ?', [userId])
            if (contact.length == 0) {
                const [contact] = await connection.execute('INSERT INTO contacts SET id = ?, name = ?;', [userId, userName])
            }
            const [insertMessage] = await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?;', [messageId, conversationId, userId, message])

            await connection.commit();
            res.status(200).json({ success: true, message: 'Message Sent Successfuly!', insertMessage })
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Erro ao enviar mensagem:', error);
            res.status(500).send(error.response.data);
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },
    getConversations: async (req, res) => {
        const orgId = req.params.org
        const { page = 1, limit = 10 } = req.query
        
        const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
        try {
            await connection.beginTransaction();
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitNumber = parseInt(limit)
            const offsetNumber = parseInt(offset)
            console.log("limitNumber: ",limitNumber)
            console.log("offsetNumber: ",offsetNumber)
            const [conversations] = await connection.execute("SELECT * FROM conversations ORDER BY updated_at DESC LIMIT '?' OFFSET '?';", [limitNumber, offsetNumber])
            
            const [total] = await connection.query(`SELECT COUNT(*) AS count FROM conversations;`);

            await connection.commit();
            res.status(200).json({ success: true, message: "Conversations recovered successfully", conversations, hasMore: parseInt(offset) + parseInt(limit) < total[0].count, });
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ success: false, message: "Erro ao buscar conversas", error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },
    getMessages: async (req, res) => {
        const { org, conversationId } = req.params
        const { page = 1, limit = 10 } = req.query
        const connection = await mysql.createConnection({ ...dbConfig, database: `${org}` });
        try {
            await connection.beginTransaction();
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const [conversation] = await connection.execute("SELECT messages.*, contacts.name as senderName, contacts.wa_id as contactNumber FROM messages JOIN contacts ON contacts.id = messages.senderId WHERE conversationId = ? ORDER BY created_at ASC LIMIT ? OFFSET ?;", [conversationId, parseInt(limit), parseInt(offset)])

            const [total] = await connection.query(`SELECT COUNT(*) AS count FROM messages WHERE conversationId = ?;`, [conversationId]);
            console.log("totall: ", total)
            console.log("total[0].count : ", total[0].count)
            console.log("parseInt(page) - 1 : ", parseInt(page) - 1)
            console.log("limit : ", limit)
            console.log("offset : ", offset)
            console.log("offset + limit: ", parseInt(offset) + parseInt(limit))
            console.log("hasMore : ", parseInt(offset) + parseInt(limit) < total[0].count)
            console.log("Page : ", page)
            console.log("--------------------------")
            await connection.commit();
            res.status(200).json({ success: true, message: "Conversations recovered successfully", conversation, hasMore: parseInt(offset) + parseInt(limit) < total[0].count, page });
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ success: false, message: "Erro ao buscar conversas", error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}