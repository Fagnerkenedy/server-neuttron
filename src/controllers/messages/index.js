const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const axios = require('axios')
const crypto = require('crypto')
const logger = require('../../utility/logger')
const { executeCustomFunctions } = require('../customFunctions/customFunctions')
const fs = require("fs");
const FormData = require("form-data");

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
                let botStep
                let selectedId = ''

                if (!message.hasOwnProperty("interactive")) {
                    body = value.messages[0].text.body
                }

                if (message.hasOwnProperty("interactive") && message.interactive.type == "list_reply") {
                    body = message.interactive.list_reply.title
                }

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

                if (message.hasOwnProperty("interactive") && message.interactive.type == "list_reply") {
                    botStep = message.interactive.list_reply.id
                }
                                                                                                                                                                    // ss61df8s4fs1d36g465ds1 qrcode
                const [bot] = await connection.execute("SELECT * FROM bots JOIN flows ON flows.bot_id = bots.id JOIN steps ON steps.flow_id = flows.id WHERE bots.id = 'ss61df8s4fs1d36g465ds1' and steps.step = ?;", [botStep]) // ss61df8s4fs1d36g465ds1
                let responseMessage = 'Desculpe, não entendi sua mensagem.'
                let jsonData = {
                    messaging_product: "whatsapp",
                    // to: "+5545999792202",
                    to: message.from,
                    text: { body: responseMessage },
                }

                const uploadMedia = async (PHONE_NUMBER_ID, ACCESS_TOKEN, FILE_PATH) => {
                    try {
                        const form = new FormData();
                        form.append("file", fs.createReadStream(FILE_PATH));
                        form.append("type", "application/pdf");
                        form.append("messaging_product", "whatsapp");

                        const response = await axios.post(
                            `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/media`,
                            form,
                            {
                                headers: {
                                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                                    ...form.getHeaders(),
                                },
                            }
                        );

                        console.log("Upload bem-sucedido! MEDIA_ID:", response.data.id);
                        return response.data.id;
                    } catch (error) {
                        console.error("Erro ao fazer upload:", error.response?.data || error.message);
                    }
                }

                let pathFront = ''
                let botStepAtual = botStep
                if (bot.length > 0) {
                    for (const step of bot) {
                        console.log("Bot.step: ", step);

                        if (step.type === "interactive") {
                            botStep = selectedId || 1;
                            responseMessage = step.content.body.text;
                            jsonData = {
                                messaging_product: "whatsapp",
                                to: message.from,
                                type: step.type,
                                interactive: step.content,
                            };
                        } else if (step.type === "text") {
                            botStep = step.next_step || 1;
                            responseMessage = step.content.text.body.text;
                            jsonData = {
                                messaging_product: "whatsapp",
                                to: message.from,
                                type: "text",
                                text: { body: step.content.text.body.text },
                            };
                        } else if (step.type === "media") {
                            const paths = {
                                option_1: "src/files/1 - Nota Fiscal Produtor eletrônica (NFPe).pdf",
                                option_2: "src/files/2 - Gestão Agricola.pdf",
                                option_3: "src/files/3 - Gestão de Agroindústria.pdf",
                                option_4: "src/files/4 - Gestão de Algodoeira.pdf",
                                option_5: "src/files/5 - Gestão de Cerealista.pdf",
                                option_6: "src/files/6 - Gestão de Armazenagem.pdf",
                                option_7: "src/files/7 - Gestão de Cooperativa.pdf",
                                option_8: "src/files/8 - Gestão de Transporte.pdf",
                                nota: "src/files/Modelo Nota Fiscal Eletrônica.pdf",
                            };
                            const pathsFrontend = {
                                option_1: "/files/1 - Nota Fiscal Produtor eletrônica (NFPe).pdf",
                                option_2: "/files/2 - Gestão Agricola.pdf",
                                option_3: "/files/3 - Gestão de Agroindústria.pdf",
                                option_4: "/files/4 - Gestão de Algodoeira.pdf",
                                option_5: "/files/5 - Gestão de Cerealista.pdf",
                                option_6: "/files/6 - Gestão de Armazenagem.pdf",
                                option_7: "/files/7 - Gestão de Cooperativa.pdf",
                                option_8: "/files/8 - Gestão de Transporte.pdf",
                                nota: "/files/Modelo Nota Fiscal Eletrônica.pdf",
                            };
                            const options = {
                                option_1: `Segue PDF com maiores informações sobre: \nNota Fiscal Produtor eletrônica (NFPe) \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!`,
                                option_2: "Segue PDF com maiores informações sobre: \nGestão Agricola \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!",
                                option_3: "Segue PDF com maiores informações sobre: \nGestão de Agroindústria \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!",
                                option_4: "Segue PDF com maiores informações sobre: \nGestão de Algodoeira \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!",
                                option_5: "Segue PDF com maiores informações sobre: \nGestão de Cerealista \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!",
                                option_6: "Segue PDF com maiores informações sobre: \nGestão de Armazenagem \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!",
                                option_7: "Segue PDF com maiores informações sobre: \nGestão de Cooperativa \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!",
                                option_8: "Segue PDF com maiores informações sobre: \nGestão de Transporte \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!",
                                nota: "Segue PDF da Nota Fiscal De Produtor Eletrônica:",
                            }
                            const optionsNames = {
                                option_1: "Nota Fiscal Produtor eletrônica (NFPe)",
                                option_2: "Gestão Agricola",
                                option_3: "Gestão de Agroindústria",
                                option_4: "Gestão de Algodoeira",
                                option_5: "Gestão de Cerealista",
                                option_6: "Gestão de Armazenagem",
                                option_7: "Gestão de Cooperativa",
                                option_8: "Gestão de Transporte",
                                nota: "Modelo Nota Fiscal Eletrônica.pdf",
                            }
                            responseMessage = options[botStep]
                            if(responseMessage == null) responseMessage = step.content.text.body.text
                            responseNames = optionsNames[botStep]
                            pathFront = pathsFrontend[botStep]

                            try {
                                const mediaId = await uploadMedia(phoneNumberId, GRAPH_API_TOKEN, paths[botStep]);
                                console.log("mediaId", mediaId);
                                botStep = step.next_step;
                                jsonData = {
                                    messaging_product: "whatsapp",
                                    recipient_type: "individual",
                                    to: message.from,
                                    type: "document",
                                    document: {
                                        id: mediaId,
                                        caption: responseMessage,
                                        filename: responseNames
                                    },
                                };
                            } catch (error) {
                                console.error("Erro no upload do arquivo:", error);
                            }
                        }
                    }
                    console.log("jsonData: ", JSON.stringify(jsonData));
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
                    await connection.execute('INSERT INTO messages SET id = ?, conversationId = ?, senderId = ?, body = ?, pathFront = ?;', [responseMessageId, conversationId, systemsUserId, responseMessage, pathFront])
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
                console.log("io pathFront:", pathFront)
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
                            updated_at: isoString,
                            pathFront,
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
