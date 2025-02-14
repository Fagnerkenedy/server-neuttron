const axios = require('axios')
const mysql = require('mysql2/promise')
const dbConfig = require('../../database/index')
const crypto = require('crypto')

const { GRAPH_API_TOKEN } = process.env;

module.exports = {
    sendMessage: async (req, res) => {
        const { numberId, to, message, conversationId, userName, userId, created_at, contactNumber } = req.body;
        const { org } = req.params
        const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${numberId}/messages`
        const connection = await mysql.createConnection({ ...dbConfig, database: `${org}` });

        try {
            // if (process.env.NODE_ENV == "production") {

                const response = await axios.post(
                    WHATSAPP_API_URL,
                    {
                        messaging_product: 'whatsapp',
                        to: to,
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
            // }
            await connection.beginTransaction();

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }

            const messageId = gerarHash(JSON.stringify({ numberId, to, message }))
            const [contact] = await connection.execute('SELECT * FROM contacts WHERE id = ?', [userId])
            if (contact.length == 0) {
                const [contact] = await connection.execute('INSERT INTO contacts SET id = ?, name = ?, wa_id = ?;', [userId, userName, contactNumber])
            }
            await connection.execute('UPDATE conversations SET last_message = ? WHERE id = ?;', [message, conversationId])
            const [insertMessage] = await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?, created_at = ?;', [messageId, conversationId, userId, message, created_at])

            await connection.commit();
            res.status(200).json({ success: true, message: 'Message Sent Successfuly!', insertMessage })
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Erro ao enviar mensagem:', error);
            console.error('Erro ao enviar mensagem data:', error.response.data);
            console.error('Erro ao enviar mensagem data JSON:', JSON.stringify(error.response.data));
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
            const sql = `SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ${limitNumber} OFFSET ${offsetNumber};`
            const [conversations] = await connection.execute(sql)

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
            const sql = `SELECT messages.*, contacts.name as senderName, contacts.wa_id as contactNumber FROM messages JOIN contacts ON contacts.id = messages.senderId WHERE conversationId = '${conversationId}' ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)};`
            const [conversation] = await connection.execute(sql)

            const [total] = await connection.query(`SELECT COUNT(*) AS count FROM messages WHERE conversationId = ?;`, [conversationId]);
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
    },
    updateUnread: async (req, res) => {
        const { org, conversationId } = req.params
        const connection = await mysql.createConnection({ ...dbConfig, database: `${org}` });
        try {
            await connection.beginTransaction();
            await connection.query(`UPDATE conversations SET unread = 0, updated_at = updated_at WHERE id = ?;`, [conversationId]);
            
            await connection.commit();
            res.status(200).json({ success: true, message: "Conversation unread updated successfully" });
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ success: false, message: "Erro ao atualizar unread de conversations", error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },
    getConversation: async (req, res) => {
        const { org, conversationId } = req.params
        const connection = await mysql.createConnection({ ...dbConfig, database: `${org}` });
        try {
            await connection.beginTransaction();
            const [conversation] = await connection.query(`SELECT * FROM conversations WHERE id = ?;`, [conversationId]);
            const conversationData = conversation[0]
            await connection.commit();
            res.status(200).json({ success: true, message: "Conversation get successfully", data: conversationData });
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ success: false, message: "Erro ao fazer o get em conversations", error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}