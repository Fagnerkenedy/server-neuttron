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





// const date = new Date();

// Converter para formato ISO
// const isoString = date.toISOString();
// console.log("ISO String:", isoString);

// const brazilianDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
// console.log(brazilianDate)


// const toDateTime = date.toLocaleString("pt-br").slice(0, 20).replace(',', '')
// console.log(toDateTime)

// date.setHours(date.getHours() - 3)
// const formattedDate = date.toISOString().replace("T", " ").replace("Z", "")

// console.log("formattedDate: ", formattedDate)

// const isoString = new Date("1738350970" * 1000).toISOString().replace('T', ' ').replace('Z', '')
// console.log("time server: ", isoString)



// const fileName = "Segue PDF com maiores informações sobre: Gestão Agricola \n\nA ABIGS agradece o seu contato, tenha um ótimo evento!";
    
// // Transformando o texto em um array de strings
// const linhas = fileName.split("\n");

// // Exibir no console corretamente
// console.log("Texto formatado:");
// console.log(linhas.join("\n"));


const PDFDocument = require('pdfkit');
const fs = require('fs');

const generatePDF = (text, filePath) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        doc.fontSize(12).text(text, { align: 'left' });

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', (err) => reject(err));
    });
};

// Exemplo de uso
const text = `Assinatura Anual - Proposta
Empresa: Empresa Teste
Produto: Assinatura Anual 3 Usuários
Valor Total: R$ 5963.4

PROPOSTA COMERCIAL

Nome do Cliente: Empresa Teste
Endereço: [Endereço Completo]
Contato: [E-mail | Telefone]
Data da Proposta: [DD/MM/AAAA]

1. Apresentação
Prezados(as) Empresa Teste,
Agradecemos pela oportunidade de apresentar nossa solução de CRM para sua empresa. Nosso objetivo é fornecer uma plataforma que otimize a gestão de relacionamento com seus clientes, automatize processos e aumente a eficiência da sua equipe.

2. Detalhes da Solução
Produto: Assinatura Anual 3 Usuários
Descrição: [Breve descrição do produto e seus principais benefícios]

Recursos principais:
- Gerenciamento de leads e oportunidades
- Automação de vendas e marketing
- Relatórios e dashboards personalizados
- Integração com outras ferramentas
- Suporte técnico especializado

3. Plano e Investimento
Plano       | Valor Mensal | Valor Anual
----------------------------------------
[Plano 1]  | R$ [Valor]   | R$ [Valor]
[Plano 2]  | R$ [Valor]   | R$ [Valor]
[Plano 3]  | R$ [Valor]   | R$ [Valor]

Valor Total: R$ 5963.4
Condições especiais para pagamento anual e descontos para contratos de longo prazo.

4. Suporte e Implementação
Nossa equipe oferece suporte completo durante a implementação e uso do sistema, incluindo:
- Treinamento inicial para sua equipe
- Suporte técnico via e-mail e chat
- Atualizações constantes com novas funcionalidades

5. Validade da Proposta
Esta proposta é válida por [XX] dias a partir da data de emissão.

6. Próximos Passos
Para darmos continuidade, basta entrar em contato e formalizarmos a contratação.
Estamos à disposição para esclarecer quaisquer dúvidas.

Atenciosamente,
[Nome do Representante]
Neuttron
[E-mail | Telefone]`;

generatePDF(text, `/pdfs/${text.substring(0, 10)}.pdf`)
    .then(() => console.log('PDF gerado com sucesso!'))
    .catch(err => console.error('Erro ao gerar PDF:', err));
