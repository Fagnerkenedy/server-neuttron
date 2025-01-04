const axios = require('axios')

const { GRAPH_API_TOKEN } = process.env;

module.exports = {
    sendMessage: async (req, res) => {
        const { numberId, to, message } = req.body;
        const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${numberId}/messages`

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
            res.status(200).send(response.data);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error.response.data);
            res.status(500).send(error.response.data);
        }
    }
}