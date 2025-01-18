const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const axios = require('axios')
const crypto = require('crypto')

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN } = process.env;
const log = console.log;

module.exports = {
    webhookPost: async (req, res) => {
        console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

        try {
            // Lógica do webhook
            const { io } = req;
            const value = req.body.entry?.[0]?.changes[0]?.value
            const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
            // const message = req.body.value?.messages?.[0];

            console.log("message: ", message)

            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
            const phoneNumberId = value.metadata.phone_number_id
            const displayPhoneNumber = value.metadata.display_phone_number
            const [organization] = await connectionNeuttron.execute('SELECT DISTINCT orgId, name FROM users WHERE phone_number_id = ?', [phoneNumberId])
            const orgId = organization[0].orgId
            const name = organization[0].name
            const connection = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });
            const wa_id = value.contacts[0].wa_id
            const [contact] = await connection.execute('SELECT * FROM contacts WHERE wa_id = ?', [wa_id])

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }

            let contactId
            let conversationId
            const contactName = value.contacts[0].profile.name
            const body = value.messages[0].text.body
            let botStep

            if (contact.length == 0) {
                botStep = 1
                contactId = gerarHash(JSON.stringify({ contactName, wa_id, phoneNumberId }))
                const [contact] = await connection.execute('INSERT INTO contacts SET id = ?, name = ?, wa_id = ?, bot_step = ?;', [contactId, contactName, wa_id, botStep])
                conversationId = gerarHash(JSON.stringify({ contactId, wa_id, phoneNumberId }))
                const [conversation] = await connection.execute('INSERT INTO conversations SET id = ?, name = ?, wa_id_contact = ?, unread = ?', [conversationId, contactName, wa_id, 1])
                const messageId = gerarHash(JSON.stringify({ conversationId, contactId, wa_id, phoneNumberId }))
                const [insertMessage] = await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?;', [messageId, conversationId, contactId, body])
            } else {
                botStep = contact[0].bot_step || 1
                const [conversation] = await connection.execute('SELECT * FROM conversations WHERE wa_id_contact = ?', [wa_id])
                contactId = contact[0].id
                conversationId = conversation[0].id
                const unread = conversation[0].unread + 1
                const updateConversation = await connection.execute('UPDATE conversations SET unread = ? WHERE id = ?;', [unread, conversationId])
                const messageId = gerarHash(JSON.stringify({ wa_id, phoneNumberId }))
                const body = value.messages[0].text.body
                const [insertMessage] = await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?;', [messageId, conversationId, contactId, body])
            }

            const [bot] = await connection.execute('SELECT * FROM bots JOIN flows ON flows.bot_id = bots.id JOIN steps ON steps.flow_id = flows.id WHERE steps.step = ?;', [botStep])
            let responseMessage = 'Desculpe, não entendi sua mensagem.'
            let jsonData = {
                messaging_product: "whatsapp",
                to: "+5545999792202",
                // to: message.from,
                text: { body: responseMessage },
            }

            let json = {
                "object": "whatsapp_business_account",
                "entry": [
                    {
                        "id": "568659012986958",
                        "changes": [
                            {
                                "value": {
                                    "messaging_product": "whatsapp",
                                    "metadata": {
                                        "display_phone_number": "554599750447",
                                        "phone_number_id": "537389792787824"
                                    },
                                    "contacts": [
                                        {
                                            "profile": {
                                                "name": "Fagner"
                                            },
                                            "wa_id": "554599792202"
                                        }
                                    ],
                                    "messages": [
                                        {
                                            "context": {
                                                "from": "554599750447",
                                                "id": "wamid.HBgMNTU0NTk5NzkyMjAyFQIAERgSODY4ODY3QkEzQTAzRTk0N0EwAA=="
                                            },
                                            "from": "554599792202",
                                            "id": "wamid.HBgMNTU0NTk5NzkyMjAyFQIAEhgWM0VCMDFCRjAyMTdBOTdDNzc2M0U0NgA=",
                                            "timestamp": "1736898926",
                                            "type": "interactive",
                                            "interactive": {
                                                "type": "button_reply",
                                                "button_reply": {
                                                    "id": "option_2",
                                                    "title": "Boleto"
                                                }
                                            }
                                        }
                                    ]
                                },
                                "field": "messages"
                            }
                        ]
                    }
                ]
            }

            if (bot.length > 0) {
                [jsonData] = bot.map((step) => {
                    if (step.type != "text") {
                        botStep = botStep + 1
                        responseMessage = step.content.body.text
                        return {
                            messaging_product: "whatsapp",
                            to: "+5545999792202",
                            // // to: message.from,
                            type: step.type,
                            interactive: step.content,
                        }
                    } else {
                        botStep = botStep + 1
                        responseMessage = step.content.text.body
                        return {
                            messaging_product: "whatsapp",
                            to: "+5545999792202",
                            text: step.content
                        }
                    }
                })
                console.log("jsonData: ", jsonData)
            }

            await connection.execute('UPDATE contacts SET bot_step = ? WHERE id = ?;', [botStep, contactId])

            const [responseSystemUserId] = await connection.execute('SELECT id FROM contacts WHERE wa_id = ?', [displayPhoneNumber])
            let systemsUserId = ''

            if (responseSystemUserId.length == 0) {
                systemsUserId = gerarHash(JSON.stringify({ displayPhoneNumber }))
                await connection.execute('INSERT INTO contacts (id, name, wa_id) values(?, ?, ?);', [systemsUserId, 'Bot', displayPhoneNumber])
            } else {
                systemsUserId = responseSystemUserId[0]?.id
            }
            if(systemsUserId) {
                const responseMessageId = gerarHash(JSON.stringify({ systemsUserId, phoneNumberId }))
                await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?;', [responseMessageId, conversationId, systemsUserId, responseMessage])
            }

            if (message?.type === "text") {
                // const business_phone_number_id = req.body.value?.metadata?.phone_number_id;
                const business_phone_number_id = req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
                try {

                    await axios({
                        method: "POST",
                        url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
                        headers: {
                            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                        },
                        data: jsonData
                        // data: {
                        //     messaging_product: "whatsapp",
                        //     to: message.from,
                        //     text: { body: responseMessage },
                        //     // context: {
                        //     //     message_id: message.id, // shows the message as a reply to the original user message
                        //     // },
                        // },
                    });

                    await axios({
                        method: "POST",
                        url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
                        headers: {
                            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                        },
                        data: {
                            messaging_product: "whatsapp",
                            status: "read",
                            message_id: message.id,
                        },
                    });

                } catch (error) {
                    log("Erro ao tentar enviar mensagem: ", error)
                }
            }

            if (message) {
                io.to(`org${orgId}`).emit('newMessage', {
                    senderName: contactName,
                    body,
                    timestamp: value.messages[0].timestamp,
                    conversationId
                });
                io.to(`org${orgId}`).emit('newMessage', {
                    senderName: name,
                    body: jsonData.text.body,
                    timestamp: value.messages[0].timestamp,
                    conversationId
                });
            }

            res.status(200).send('Webhook recebido com sucesso.');
        } catch (error) {
            console.error('Erro no webhook:', error);
            res.status(500).send('Erro no servidor.');
        }
    },

    webhookGet: async (req, res) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        // check the mode and token sent are correct
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
            // respond with 200 OK and challenge token from the request
            res.status(200).send(challenge);
            console.log("Webhook verified successfully!");
        } else {
            // respond with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
}
