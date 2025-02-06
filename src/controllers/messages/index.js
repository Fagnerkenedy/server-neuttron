const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const axios = require('axios')
const crypto = require('crypto')
const logger = require('../../utility/logger')
const { executeCustomFunctions } = require('../customFunctions/customFunctions')

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN } = process.env;
const log = console.log;

module.exports = {
    webhookPost: async (req, res) => {
        console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));
        logger.info('Recebido mensagem no webhook.');
        let connection
        try {
            // Lógica do webhook
            const { io } = req;
            const value = req.body.entry?.[0]?.changes[0]?.value
            const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
            // const message = req.body.value?.messages?.[0];

            console.log("message: ", message)
            if (message) {

                console.log("message.id: ", message.id)

                const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
                const phoneNumberId = value.metadata.phone_number_id
                const displayPhoneNumber = value.metadata.display_phone_number
                const [organization] = await connectionNeuttron.execute('SELECT DISTINCT orgId, name, wa_id FROM users WHERE phone_number_id = ?', [phoneNumberId])
                await connectionNeuttron.end()
                const orgId = organization[0].orgId
                const name = organization[0].name
                const wa_id_org = organization[0].wa_id
                connection = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });
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
                let body
                if (message.hasOwnProperty("interactive")) {
                    body = message.interactive.list_reply.title
                } else {
                    body = value.messages[0].text.body
                }
                let botStep

                if (contact.length == 0) {
                    botStep = 1
                    contactId = gerarHash(JSON.stringify({ contactName, wa_id, phoneNumberId }))
                    const [contact] = await connection.execute('INSERT INTO contacts SET id = ?, name = ?, wa_id = ?, bot_step = ?;', [contactId, contactName, wa_id, botStep])
                    conversationId = gerarHash(JSON.stringify({ contactId, wa_id, phoneNumberId }))
                    const [conversation] = await connection.execute('INSERT INTO conversations SET id = ?, name = ?, wa_id_contact = ?, unread = ?, last_message = ?;', [conversationId, contactName, wa_id, 1, body])
                    const messageId = gerarHash(JSON.stringify({ conversationId, contactId, wa_id, phoneNumberId }))
                    const [insertMessage] = await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?;', [messageId, conversationId, contactId, body])
                } else {
                    botStep = contact[0].bot_step || 1
                    const [conversation] = await connection.execute('SELECT * FROM conversations WHERE wa_id_contact = ?', [wa_id])
                    if (conversation.length == 0) {
                        conversationId = gerarHash(JSON.stringify({ contactId, wa_id, phoneNumberId }))
                        contactId = contact[0].id
                        // const body = value.messages[0].text.body
                        await connection.execute('INSERT INTO conversations SET id = ?, name = ?, wa_id_contact = ?, unread = ?, last_message = ?;', [conversationId, contactName, wa_id, 1, body])
                        const messageId = gerarHash(JSON.stringify({ wa_id, phoneNumberId }))
                        await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?;', [messageId, conversationId, contactId, body])
                    } else {
                        contactId = contact[0].id
                        conversationId = conversation[0].id
                        const unread = conversation[0].unread + 1
                        // const body = value.messages[0].text.body
                        await connection.execute('UPDATE conversations SET unread = ?, last_message = ? WHERE id = ?;', [unread, body, conversationId])
                        const messageId = gerarHash(JSON.stringify({ wa_id, phoneNumberId }))
                        await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?;', [messageId, conversationId, contactId, body])

                    }
                }

                const [bot] = await connection.execute('SELECT * FROM bots JOIN flows ON flows.bot_id = bots.id JOIN steps ON steps.flow_id = flows.id WHERE steps.step = ?;', [botStep])
                let responseMessage = 'Desculpe, não entendi sua mensagem.'
                let jsonData = {
                    messaging_product: "whatsapp",
                    // to: "+5545999792202",
                    to: message.from,
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
                let botStepAtual = botStep
                if (bot.length > 0) {
                    [jsonData] = bot.map((step) => {
                        if (step.type != "text") {
                            botStep = step.next_step || 1
                            responseMessage = step.content.body.text
                            return {
                                messaging_product: "whatsapp",
                                // to: "+5545999792202",
                                to: message.from,
                                type: step.type,
                                interactive: step.content,
                            }
                        } else {
                            botStep = step.next_step || 1
                            responseMessage = step.content.text.body.text
                            return {
                                messaging_product: "whatsapp",
                                // to: "+5545999792202",
                                type: "text",
                                to: message.from,
                                text: {
                                    body: step.content.text.body.text
                                }
                            }
                        }
                    })
                    console.log("jsonData: ", JSON.stringify(jsonData))
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
                if (systemsUserId && bot.length > 0) {
                    const responseMessageId = gerarHash(JSON.stringify({ systemsUserId, phoneNumberId }))
                    await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?;', [responseMessageId, conversationId, systemsUserId, responseMessage])
                }

                if (bot.length > 0) {
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
                        logger.info('Mensagem enviada com sucesso para a API do Whatsapp.');
                    } catch (error) {
                        log("Erro ao tentar enviar mensagem: ", error.response.data)
                        logger.error('Erro ao tentar enviar mensagem para a API do Whatsapp: ', error);
                    }
                }

                console.log("io contact:", contactName)
                console.log("io body:", body)
                console.log("io value.messages[0].timestamp:", value.messages[0].timestamp)
                console.log("io conversationId:", conversationId)
                console.log("io ////////////////:")
                console.log("io name:", name)
                console.log("io jsonData.text.body:", jsonData?.text?.body)
                console.log("io value.messages[0].timestamp:", value.messages[0].timestamp)
                console.log("io conversationId:", conversationId)
                const isoString = new Date(value.messages[0].timestamp * 1000).toISOString()
                console.log("time server: ", isoString)
                if (message) {
                    io.to(`org${orgId}`).emit('newMessage', {
                        senderName: contactName,
                        contactNumber: value.contacts.wa_id,
                        body,
                        timestamp: value.messages[0].timestamp,
                        conversationId,
                        updated_at: isoString
                    });
                    if (bot.length > 0) {
                        io.to(`org${orgId}`).emit('newMessage', {
                            senderName: name,
                            contactNumber: wa_id_org,
                            body: responseMessage,
                            // body: jsonData.text.body,
                            timestamp: value.messages[0].timestamp,
                            conversationId,
                            updated_at: isoString
                        });
                    }
                }
                const obj = {
                    ...contact[0],
                    botStepAtual,
                    message: body
                }
                await executeCustomFunctions('Interagir com o Chatbot', `org${orgId}`, 'Leads', obj, contactId)
                logger.info('Webhook recebido com sucesso.');
                res.status(200).send('Webhook recebido com sucesso.');
            } else {
                res.status(200).send('Webhook recebido com sucesso sem mensagem.');
            }
        } catch (error) {
            logger.info('Erro no webhook:', error);
            res.status(500).send('Erro no servidor.');
        } finally {
            if (connection) {
                await connection.end();
            }
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
            logger.info('Webhook verified successfully!');
        } else {
            // respond with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
}
