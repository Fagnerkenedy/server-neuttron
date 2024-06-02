const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const vm = require('vm')
const { getRecordById } = require('./functions.js')
const { updateRecordById } = require('./functions.js')
const { get } = require('./functions.js')

module.exports = {
    executeCustomFunctions: async (event, orgId, module, fields, record_id, related_record) => {
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: orgId });
            const [functions] = await connection.execute(`SELECT * FROM functions WHERE executar_quando = '${event}' AND m_dulo = '${module}';`)
            console.log("!",functions)
            functions.map(async func => {
            console.log("fieldikdklsjkdroek",fields)

                const sum = new Function('connection', 'module', 'fields', 'record_id', 'related_record', 'getRecordById', 'updateRecordById', 'get', func.fun__o);
                console.log("SUM", sum(connection, module, fields, record_id, related_record, getRecordById, updateRecordById, get))

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