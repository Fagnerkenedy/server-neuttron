const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const vm = require('vm')
const { getRecordById, updateRecord, createRecord, get, today, sendEmail } = require('./functions.js')

module.exports = {
    executeCustomFunctions: async (event, orgId, module, fields, record_id, related_record) => {
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: orgId });
            const [moduleName] = await connection.execute(`SELECT DISTINCT name FROM modules WHERE api_name = '${module}';`)
            console.log("module: ",moduleName)
            const [functions] = await connection.execute(`SELECT * FROM functions WHERE executar_quando LIKE '%${event}%' AND modulo = '${moduleName[0].name}';`)
            console.log("!", functions)
            function getRecordByIdFunction(connection) {
                return (module, id) => getRecordById(module, id, connection);
            }

            function updateRecordFunction(connection) {
                return (module, id, data) => updateRecord(module, id, data, connection);
            }

            function createRecordFunction(connection) {
                return (module, data) => createRecord(module, data, orgId, connection);
            }

            function getFields(fields) {
                const getModuleFields = (path) => get(fields, path);
                return getModuleFields
            }

            function sendEmailFunction() {
                return (emailHeader) => sendEmail(emailHeader);
            }

            functions.map(async func => {

                const customGetRecordById = getRecordByIdFunction(connection);
                const customUpdateRecordById = updateRecordFunction(connection);
                const customCreateRecord = createRecordFunction(connection);
                const customGetFields = getFields(fields)
                const customSendEmail = sendEmailFunction()

                const customFunction = new Function(
                    'module', 
                    'fields', 
                    'id', 
                    'orgId',
                    'related_record', 
                    'getRecordById', 
                    'updateRecord', 
                    'createRecord',
                    'get', 
                    'today',
                    'sendEmail',
                    `return (async () => {
                        ${func.funcao}
                    })();`
                );
                const result = await customFunction(
                    module,
                    fields,
                    record_id,
                    orgId,
                    related_record,
                    customGetRecordById,
                    customUpdateRecordById,
                    customCreateRecord,
                    customGetFields,
                    today,
                    customSendEmail
                )
            })
            // await connection.end()
        } catch (e) {
            console.error('Erro ao validar ou executar a função personalizada:', e.message)
        }
    }
}

/* 
console.log("connection", connection, " module", module, " fields", fields, " record_id", record_id)
const soma = (quantidade, valorUnitario) => {
    const result = quantidade*valorUnitario
    return result
}
const resultado = soma(fields.quantidade, fields.valor_unit_rio)
connection.execute(`UPDATE ${module} SET valor_total = ${resultado} WHERE id = '${record_id}' ;`) */