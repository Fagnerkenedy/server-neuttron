json = {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "0",
        "changes": [
          {
            "field": "messages",
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "16505551111",
                "phone_number_id": "123456123"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "test user name"
                  },
                  "wa_id": "16315551181"
                }
              ],
              "messages": [
                {
                  "from": "16315551181",
                  "id": "ABGGFlA5Fpa",
                  "timestamp": "1504902988",
                  "type": "text",
                  "text": {
                    "body": "this is a text message"
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  }

const business_phone_number_id = json.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

console.log("teste: ", business_phone_number_id)