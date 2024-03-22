const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')

module.exports = {
    create: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            let fields = req.body;
            if (!Array.isArray(fields)) {
                fields = [fields];
            }
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const insertPromises = fields.map(async (field) => {
                const { name, type } = field;
                let { related_module } = field
                if (!field.hasOwnProperty("related_module")) {
                    related_module = null
                }
                let apiName = name.replace(/[^\w\s]|[\sç]/gi, '_').toLowerCase();
                const query = `CREATE TABLE IF NOT EXISTS fields (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255),
                    api_name VARCHAR(255),
                    type VARCHAR(255),
                    related_module VARCHAR(255),
                    module VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`;
                await connection.execute(query);
                await connection.execute(`INSERT INTO fields (name, api_name, type, related_module, module) VALUES (?, ?, ?, ?, ?);`, [ name, apiName, type, related_module, module ]);
                const [insertResult] = await connection.execute(`ALTER TABLE ${module} ADD ${apiName} ${type};`);
                return insertResult;
            });
            const insertResults = await Promise.all(insertPromises);
            await connection.end();
            res.json(insertResults);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    read: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const row = await connection.execute('SELECT * FROM fields WHERE module = ?', [module]);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const name = req.body.name
            const newName = req.body.new_name
            const field = req.body
            let { related_module } = field
            if (!field.hasOwnProperty("related_module")) {
                related_module = null
            }
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.execute('UPDATE fields SET name = ?, related_module = ? WHERE module = ?', [newName, related_module, module]);
            const row = await connection.execute(`ALTER TABLE ${module} RENAME COLUMN  ${name} TO ${newName}`);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const field_api_name = req.body.api_name
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const [nameField] = await connection.execute('SELECT name FROM fields WHERE module = ? AND api_name = ?;', [ module, field_api_name]);
            await connection.execute(`ALTER TABLE ${module} DROP COLUMN ${nameField[0].name};`);
            const row = await connection.execute('DELETE FROM fields WHERE module = ? AND api_name = ?;', [ module, field_api_name]);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
}