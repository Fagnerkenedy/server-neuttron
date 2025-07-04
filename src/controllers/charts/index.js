const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const crypto = require('crypto');

module.exports = {
    create: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const name = req.body.name
            const query = req.body.query
            const xField = req.body.xField
            const yField = req.body.yField
            const type = req.body.type

            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();
            const queryCharts = `CREATE TABLE IF NOT EXISTS charts (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                query VARCHAR(2000),
                xField VARCHAR(255),
                xField_layout VARCHAR(255),
                yField VARCHAR(255),
                type VARCHAR(255)
            )`;
            await connection.execute(queryCharts);

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }

            const chart_id = gerarHash(JSON.stringify(orgId, name, query, xField, yField, type));
            const [result] = await connection.execute(
                'INSERT INTO charts (id, name, query, xField, yField, type) VALUES (?, ?, ?, ?, ?, ?);',
                [chart_id, name, query, xField, yField, type]
            );

            await connection.commit();

            res.json({ success: true, message: "Table charts created successfully", result });
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
    },
    read: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();
            const query = `SELECT * FROM charts;`
            let [result] = await connection.execute(query);
            result = await Promise.all(result.map(async (item) => {
                const [result] = await connection.execute(item.query);
                const json = {
                    query: item,
                    data: result
                }
                return json
            }));

            await connection.commit();
            res.json({ success: true, message: "Charts", result });
            
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