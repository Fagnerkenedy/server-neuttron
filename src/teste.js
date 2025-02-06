// json = {
//     "object": "whatsapp_business_account",
//     "entry": [
//       {
//         "id": "0",
//         "changes": [
//           {
//             "field": "messages",
//             "value": {
//               "messaging_product": "whatsapp",
//               "metadata": {
//                 "display_phone_number": "16505551111",
//                 "phone_number_id": "123456123"
//               },
//               "contacts": [
//                 {
//                   "profile": {
//                     "name": "test user name"
//                   },
//                   "wa_id": "16315551181"
//                 }
//               ],
//               "messages": [
//                 {
//                   "from": "16315551181",
//                   "id": "ABGGFlA5Fpa",
//                   "timestamp": "1504902988",
//                   "type": "text",
//                   "text": {
//                     "body": "this is a text message"
//                   }
//                 }
//               ]
//             }
//           }
//         ]
//       }
//     ]
//   }

// const business_phone_number_id = json.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

// console.log("teste: ", business_phone_number_id)




// const estaEumaFuncao = () => {
//   console.log("Este é um texto que é exibido quando a função é executada/chamada")
//   const a = 2
//   const b = 4
//   console.log("O valor total é: ", a + b)
// }

// estaEumaFuncao()


// const date = new Date();
// console.log("new Date: ",date)
// const ISO = date.toISOString('pt-BR').replace('T', ' ').replace('Z', '')
// console.log("ISO String: ", ISO)
// const dateISO = new Date(ISO)
// const newDate = dateISO.toLocaleTimeString('pt-BR');
// console.log(newDate)





const date = new Date();

// Converter para formato ISO
// const isoString = date.toISOString();
// console.log("ISO String:", isoString);

// const brazilianDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
// console.log(brazilianDate)


// const toDateTime = date.toLocaleString("pt-br").slice(0, 20).replace(',', '')
// console.log(toDateTime)

date.setHours(date.getHours() - 3)
const formattedDate = date.toISOString().replace("T", " ").replace("Z", "")

console.log("formattedDate: ", formattedDate)

// const isoString = new Date("1738350970" * 1000).toISOString().replace('T', ' ').replace('Z', '')
// console.log("time server: ", isoString)