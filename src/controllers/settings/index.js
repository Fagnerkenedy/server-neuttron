const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')

module.exports = {
    create: async (req, res) => {
        let connection
        try {
            const { orgId, empresa, email, name, phone } = req.body

            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();
            const user_id = gerarHash(JSON.stringify({ empresa, name, email, phone }));

            const user = await connection.execute(`INSERT INTO users SET id = ?, orgId = ?, name = ?, email = ?, phone = ?, dark_mode = ?, perfil = 'Padrão';`, [user_id, orgId, name, email, phone, false]);

            await connection.commit();

            res.json({ success: true, message: "User created successfully", user });
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
            const module = req.params.module
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();
            const query = `SELECT * FROM ${module};`
            let [result] = await connection.execute(query);

            await connection.commit();
            res.json({ success: true, message: "Settings", result });
            
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