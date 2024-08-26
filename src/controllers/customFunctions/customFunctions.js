const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const vm = require('vm')
const { getRecordById, updateRecord, get, today } = require('./functions.js')

module.exports = {
    executeCustomFunctions: async (event, orgId, module, fields, record_id, related_record) => {
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: orgId });
            const [moduleName] = await connection.execute(`SELECT DISTINCT name FROM modules WHERE api_name = '${module}';`)
            const [functions] = await connection.execute(`SELECT * FROM functions WHERE executar_quando LIKE '%${event}%' AND m_dulo = '${moduleName}';`)
            console.log("!", functions)
            function createGetRecordById(connection) {
                return (module, id) => getRecordById(module, id, connection);
            }

            function createUpdateRecordById(connection) {
                return (module, id, data) => updateRecord(module, id, data, connection);
            }

            function getFields(fields) {
                const getModuleFields = (path) => get(fields, path);
                return getModuleFields
            }

            functions.map(async func => {
                console.log("fieldikdklsjkdroek", fields)

                const customGetRecordById = createGetRecordById(connection);
                const customUpdateRecordById = createUpdateRecordById(connection);
                const customGetFields = getFields(fields)

                const customFunction = new Function(
                    'module', 
                    'fields', 
                    'id', 
                    'related_record', 
                    'getRecordById', 
                    'updateRecord', 
                    'get', 
                    'today',
                    `return (async () => {
                        ${func.fun__o}
                    })();`
                );
                const result = await customFunction(
                    module, 
                    fields, 
                    record_id, 
                    related_record, 
                    customGetRecordById, 
                    customUpdateRecordById, 
                    customGetFields, 
                    today
                )
                console.log("customFunction", result)
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