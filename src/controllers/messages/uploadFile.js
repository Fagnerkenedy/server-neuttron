const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

// const PHONE_NUMBER_ID = "YOUR_PHONE_NUMBER_ID";
// const ACCESS_TOKEN = "YOUR_ACCESS_TOKEN";
// const FILE_PATH = "./arquivo.pdf"; // Caminho do PDF
// const TO_PHONE_NUMBER = "5511999999999"; // Número do destinatário

module.exports = {
    uploadMedia: async (PHONE_NUMBER_ID, ACCESS_TOKEN, FILE_PATH) => {
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
}
