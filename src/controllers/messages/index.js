const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const axios = require('axios')

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN } = process.env;

module.exports = {
    webhookPost: async (req, res) => {
        console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

        const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
        // const message = req.body.value?.messages?.[0];

        console.log("message: ", message)

        if (message?.type === "text") {
            // const business_phone_number_id = req.body.value?.metadata?.phone_number_id;
            const business_phone_number_id = req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

            // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/v21.0/${business_phone_number_id}/messages`,
                headers: {
                    Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                },
                data: {
                    messaging_product: "whatsapp",
                    to: message.from,
                    text: { body: "Olá, como posso ajudar?" },
                    // context: {
                    //     message_id: message.id, // shows the message as a reply to the original user message
                    // },
                },
            });

            // mark incoming message as read
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
        }

        res.sendStatus(200);
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
