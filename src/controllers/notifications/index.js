const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const crypto = require('crypto');
const mercadopago = require('mercadopago');

mercadopago.configure({
	access_token: process.env.ACCESS_TOKEN_MERCADO_PAGO,
});

module.exports = {
    payment: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const name = req.body.name
            const query = req.body.query
            const xField = req.body.xField
            const yField = req.body.yField
            const type = req.body.type

            console.log("received notifications: ", req.body.id)

            mercadopago.payment.get({ id: req.body.id, })
            .then(console.log)
            .catch(console.log);

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