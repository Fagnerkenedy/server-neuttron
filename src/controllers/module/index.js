const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')

module.exports = {
    create: async (req, res) => {
        try {
            const orgId = req.params.org
            const moduleName = req.body.name
            if (!orgId || !moduleName) {
                return res.status(400).json({ error: "Missing orgId or moduleName in request" });
            } 
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const query = `CREATE TABLE IF NOT EXISTS ${moduleName} (
                id VARCHAR(19) PRIMARY KEY,
                related_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            const query2 = `CREATE TABLE IF NOT EXISTS modules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                perfil VARCHAR(2000),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            await connection.execute(query2);
            await connection.execute(
                'INSERT INTO modules (name) VALUES (?);',
                [ moduleName ]
            );

            const [result] = await connection.execute(query);
            await connection.end();
            res.json({ success: true, message: "Table created successfully", result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // read: async (req, res) => {
    //     try {
    //         const orgId = req.params.org
    //         const moduleName = req.params.module
    //         const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
    //         const query = `SELECT * FROM ${moduleName};`
    //         const [result] = await connection.execute(query);
    //         await connection.end();
    //         res.json({ success: true, message: "Table", result });
    //     } catch (error) {
    //         res.status(500).json({ error: error.message });
    //     }
    // },
    read: async (req, res) => {
        try {
            const orgId = req.params.org
            // const moduleName = req.params.module
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const query = `SELECT name FROM modules;`
            const [result] = await connection.execute(query);
            await connection.end();
            res.json({ success: true, message: "Module Name", result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    readRelatedModule: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            // const moduleName = req.params.module
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const query = `SELECT related_module, related_id FROM modules WHERE name = ?;`
            const [result] = await connection.execute(query, [module]);
            await connection.end();
            res.json({ success: true, message: "Related Module", result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const orgId = req.params.org
            const moduleName = req.body.name
            const newName = req.body.new_name
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const row = await connection.execute('UPDATE modules SET name = ? WHERE name = ?;', [newName, moduleName]);
            await connection.execute(`ALTER TABLE ${moduleName} RENAME TO ${newName};`);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const orgId = req.params.org
            const moduleName = req.body.name
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            //const row = await connection.execute('DELETE FROM modules WHERE module_id = ? AND organization_id = ?; DELETE FROM module_fields WHERE module_id = ? AND organization_id = ?; DELETE FROM module_data WHERE module_id = ? AND organization_id = ?;', [module_id, orgId, module_id, orgId, module_id, orgId]);
            const deleteModuleQuery = 'DELETE FROM modules WHERE name = ?;';
            const deleteModuleTableQuery = `DROP TABLE ${moduleName};`;

            let row = await connection.execute(deleteModuleQuery, [moduleName]);
            row = await connection.execute(deleteModuleTableQuery);

            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
}