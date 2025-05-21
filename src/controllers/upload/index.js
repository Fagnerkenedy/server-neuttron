var xslx = require("xlsx");
var fs = require('fs');
const path = require("path");
const { parseSheet } = require("../../utility/parseSheet");
const modelIntegration = require("../../model/modelIntegration")
const Field = modelIntegration();
//const controllerfields = require("../../controllers/fields/index");

/*const acceptedColumns = [
  "Unidade de Negócio",
  "Sistema de Ensino (Selo)",
  "N.º do cliente.",
  "Status",
  "Ciclo",
  "CNPJ contratante",
  "Número Portal",
  "Representante Legal (Primeiro)",
  "Representante Legal (Segundo)",
  "Grupo",
  "Número de professores",
  "Tipo de faturamento",
  "Índice de Reajuste",
  "Comissionado",
  "Consultor da Escola",
  "Proprietário da Contrato",
  "Gerente da Escola",
  "E-mail Tabela de Preço",
  "Segmentos",
  "Nº Contrato OLEM",
  "Proposta Liquida do Comercial",
  "Consultor Comercial",
  "Documento",
  "Data Devolução Documento",
  "Tipo Contrato",
  "Formato Documento",
  "Pendência Documento",
  "Data Liberação Boas Vindas",
  "Data Passagem de Bastão",
  "Liberado para Boas-vindas?",
  "Tipo Minuta",
  "Data Liberação Cadastro",
  "Ano Inicial",
  "Vencimento",
  "Tempo de Contrato",
  "Tempo de contrato (Número Inteiro)",
  "Data Renovação Automática",
  "Data Carta Cancelamento",
  "Status Carta Cancelamento",
  "Status NIJ",
  "Operador Mercantil",
  "Tipo de cessão",
  "Data emissão da cessão",
  "Data retorno da cessão",
  "Termo de locação",
  "Tempo de locação",
  "Produtos da locação",
  "País de Cobrança",
  "Estado de Cobrança",
  "Cidade de Cobrança",
  "Bairro de Cobrança",
  "CEP de Cobrança",
  "Rua de Cobrança",
  "Número de Cobrança",
  "Complemento de Cobrança",
  "País de Entrega",
  "Estado de Entrega",
  "Cidade de Entrega",
  "Bairro de Entrega",
  "CEP de Entrega",
  "Rua de entrega",
  "Número de Entrega",
  "Complemento de Entrega",
  "Condições de Pagamento",
  "Formato de Entrega do Material",
  "Frete",
  "Percentual de Devolução",
  "Tipo Atendimento Contrato",
  "Termos e condições",
  "Percentual de Multa",
  "Desconto Progressivo/Regressivo",
  "Cláusulas Especiais Aprovadas",
  "Tabela de Preço Portal",
  "Formato EM",
  "Estrutura",
  "Serviços Avulsos",
  "Valor dos Serviços Avulsos",
  "Material Bonificado (Descrição)",
  "Incentivo Comercial",
  "Material Aluno (Quantidade)",
  "Material Bonificado (Quantidade)",
  "Adota Chromebook",
  "Total Exemplares",
  "Pacotes EMME",
  "Descrição",
  "Pendências OLEM",
  "Número Demanda",
  "Status Demanda",
  "Desconto Médio",
  "Margem de Contribuição (VPL)",
  "Total Geral(carga)",
  "Margem (VPL)",
  "Receita Liquida Após Devolução (VPL)",
  "Share Proposto",
  "Originou Oportunidade",
  "Originou Boas-vindas",
  "Contrato Cancelado/Declinado",
  "Tipo Material",
  "Id Importação",
  "Processado consultor",
  "Moeda",
  "Chave",
  "Proprietário Carga",
  "Representante Legal Carga",
  "Proprietário contrato email",
  "Status carga",
  "Taxa de câmbio",
  "Tags",
  "SALESORDERID",
  "Assunto",
  "Ajuste",
  "Desconto",
  "Imposto",
  "Sub-total",
  "Total Geral",
  "TAG"
];*/

/*const acceptedColumns = [
  "SALESORDERID",
  "Assunto",
  "Escola Nome",
  "CNPJ contratante",
  "Status",
  "Carrier",
  "Billing Country",
  "Data de vencimento",
  "Deal Name",
  "Contact First Name",
];*/

module.exports = {
  upload: async (req, res) => {
    const filename = req.file.filename;
    const acceptedFileTypes = [".xls"];

    //FILTRO DE FORMATOS
    if (!acceptedFileTypes.includes(path.extname(filename))) {
      fs.unlinkSync("./uploads/" + filename, (err) => {
        if (err) return res.send({ err })
      });
      return res.status(404).json({ message: "formato de arquivo não suportado!" });
    }


    const book = await xslx.readFile("./uploads/" + filename);

    const sheetname = await book.SheetNames[0]

    if (!sheetname) {
      fs.unlinkSync("./uploads/" + filename, (err) => {
        if (err) return res.send({ err })
      });
      return res.status(404).json({ message: "Documento não encontrado." });
    }

    const sheet = parseSheet(`./uploads/${filename}`, 0)[sheetname];

    if (!sheet.length) {
      fs.unlinkSync("./uploads/" + filename, (err) => {
        if (err) { return res.send({ err }) }
      });
      return res.status(404).json({ message: "não há dados na tabela" })
    }


    const columns = Object.keys(sheet[0]);
    console.log("columns:",columns)

    //FILTRO DE COLUNA SALESORDER
    // if (!columns.includes("SALESORDERID")) {
    //   fs.unlinkSync("./uploads/" + filename, (err) => {
    //     if (err) return res.send({ err })
    //   });
    //   return res.status(404).json({ message: "coluna SALESORDERID não encontrada!" });
    // }

    const findColumns = await Field.find()
    const acceptedColumns = findColumns.map(acceptedColumn => acceptedColumn.name);

    // Filtrar as colunas que têm correspondência
    const matchedColumns = columns.filter(column => acceptedColumns.includes(column));

    // Encontrar as colunas que não têm correspondência
    const unmatchedColumnsDb = acceptedColumns.filter(column => !columns.includes(column));
    const unmatchedColumnsSheet = columns.filter(column => !acceptedColumns.includes(column));

    // Agora você pode retornar as colunas correspondentes e não correspondentes
    return res.json({ matchedColumns, unmatchedColumnsDb, unmatchedColumnsSheet, filename });
  },
};
