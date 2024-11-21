const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const crypto = require('crypto');
const mercadopago = require('mercadopago');
const { createPermissions, deleteProfilesPermissions } = require('../settings data/createPermissions');
const dataPermissionsPlanPro = require('./dataPermissionsPlanPro.json')

mercadopago.configure({
	access_token: process.env.ACCESS_TOKEN_MERCADO_PAGO,
});

module.exports = {
    payment: async (req, res) => {
        let connection
        try {
            const name = req.body.name
            const query = req.body.query
            const xField = req.body.xField
            const yField = req.body.yField
            const type = req.body.type

            // console.log("received notifications header: ", req.header)
            // console.log("received notifications params: ", req.params)
            console.log("received notifications: ", req)
            console.log("process.env.ACCESS_TOKEN_MERCADO_PAGO: ", process.env.ACCESS_TOKEN_MERCADO_PAGO)

            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
            let payer = ""
            mercadopago.payment.get(req.body.resource)
            .then((response) => {
                console.log("response Payment: ",response.response.payer)
                if (response.hasOwnProperty("response") && response.response.status == "approved") {
                    payer = response.response.payer
                    return payer
                }
            })
            .catch((error) => {
                console.log("response Payment: ",error)
            });

            if (payer.hasOwnProperty("email")) {
                const email = payer.email

            }
            if (payer.identification.type == "CPF"){
                const cpf = payer.identification.number.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4_');
                console.log("cpf retorno: ", cpf)
                const [orgId] = await connectionNeuttron.execute(`SELECT orgId FROM users WHERE CPF = ?;`, cpf)
                if(orgId.length > 0 ) {
                    const insertDataPermissions = await createPermissions(req={ params: { org: `org${orgId}`}, body: dataPermissionsPlanPro })
                    const deletePermissions = await deleteProfilesPermissions(req={ params: { org: `org${orgId}`} })
                }
            }
            // connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            // await connection.beginTransaction();
            // const queryCharts = `CREATE TABLE IF NOT EXISTS charts (
            //     id VARCHAR(255) PRIMARY KEY,
            //     name VARCHAR(255),
            //     query VARCHAR(2000),
            //     xField VARCHAR(255),
            //     yField VARCHAR(255),
            //     type VARCHAR(255)
            // )`;
            // await connection.execute(queryCharts);

            // const gerarHash = (dados) => {
            //     const dadosComTimestamp = dados + Date.now().toString();
            //     const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
            //     return hash.substring(0, 19)
            // }

            // const chart_id = gerarHash(JSON.stringify(orgId, name, query, xField, yField, type));
            // const [result] = await connection.execute(
            //     'INSERT INTO charts (id, name, query, xField, yField, type) VALUES (?, ?, ?, ?, ?, ?);',
            //     [chart_id, name, query, xField, yField, type]
            // );

            // await connection.commit();

            res.status(200).json({ success: true, message: "notification received" });
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}