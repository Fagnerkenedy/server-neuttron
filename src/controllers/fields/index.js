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
                let { related_id } = field   
                let { field_type } = field
                let { options } = field
                if (!field.hasOwnProperty("related_module")) {
                    related_module = null
                }
                if (!field.hasOwnProperty("related_id")) {
                    related_id = null
                }
                if (!field.hasOwnProperty("field_type")) {
                    field_type = null
                }
                if (!field.hasOwnProperty("options")) {
                    options = null
                }
                let apiName = name.replace(/[^\w\s]|[\sç]/gi, '_').toLowerCase();
                const query = `CREATE TABLE IF NOT EXISTS fields (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255),
                    api_name VARCHAR(255),
                    type VARCHAR(255),
                    field_type VARCHAR(255),
                    related_module VARCHAR(255),
                    related_id VARCHAR(255),
                    search_field VARCHAR(255),
                    module VARCHAR(255),
                    unused BOOLEAN,
                    required BOOLEAN,
                    disabled BOOLEAN,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`;
                await connection.execute(query);

                const queryOptions = `CREATE TABLE IF NOT EXISTS options (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255),
                    field_api_name VARCHAR(255),
                    module VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`;
                await connection.execute(queryOptions);
                if (options != null) {
                    for (const option of options) {
                        await connection.execute(`INSERT INTO options (name, field_api_name, module) VALUES (?, ?, ?);`, [option, apiName, module]);
                    }
                }

                const [insertResult1] = await connection.execute(`INSERT INTO fields (name, api_name, type, field_type, related_module, related_id, module) VALUES (?, ?, ?, ?, ?, ?, ?);`, [name, apiName, type, field_type, related_module, related_id, module]);

                const queryModulosRelacionados = `CREATE TABLE IF NOT EXISTS modulos_relacionados (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        module_name VARCHAR(255),
                        module_id VARCHAR(255),
                        related_module VARCHAR(255),
                        related_id VARCHAR(255),
                        search_field VARCHAR(255),
                        api_name VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`;
                await connection.execute(queryModulosRelacionados);
                if (related_module != null) {
                    await connection.execute(`INSERT INTO modulos_relacionados (related_module, related_id, module_name, api_name) VALUES (?, ?, ?, ?);`, [related_module, related_id, module, apiName]);
                }
                const table = await connection.execute(`SELECT column_name
                        FROM information_schema.columns
                        WHERE table_schema = '${orgId}'
                        AND table_name = '${module}'
                        AND column_name = '${apiName}';
                        `);
                if (table[0][0] == null) {
                    const [insertResult] = await connection.execute(`ALTER TABLE ${module} ADD ${apiName} ${type};`);

                    return insertResult;
                }
                return insertResult1
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
            const row = await connection.execute('SELECT * FROM fields WHERE module = ?;', [module]);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    readUnusedFields: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const row = await connection.execute('SELECT * FROM fields WHERE module = ? AND unused = true;', [module]);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    readOptions: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const api_name = req.params.api_name
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const row = await connection.execute('SELECT * FROM options WHERE module = ? and field_api_name = ?;', [module, api_name]);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    readRelatedField: async (req, res) => {
        try {
            const orgId = req.params.org
            const moduleName = req.params.module
            const related_id = req.params.record_id
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const row = await connection.execute(`SELECT DISTINCT module_name FROM modulos_relacionados WHERE related_module = ? AND related_id = ?;`, [moduleName, related_id]);
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
            let { id } = field
            let { related_id } = field
            let { api_name } = field
            let data = req.body;
            if (!Array.isArray(data)) {
                data = [data];
            }
            if (!field.hasOwnProperty("id")) {
                id = null
            }
            if (!field.hasOwnProperty("related_id")) {
                related_id = null
            }
            if (!field.hasOwnProperty("api_name")) {
                api_name = null
            }
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });

            const update = [];

            for (const obj of data) {
                const fieldValues = Object.values(obj);
                if (fieldValues.length === 0) {
                    continue;
                }
                const setClause = Object.entries(obj).map(([fieldName, fieldValue]) => `${fieldName} = ?`).join(', ');
                const query = `UPDATE fields SET ${setClause} WHERE id = ?;`;
                const [updateRow] = await connection.execute(query, [...fieldValues, id]);
                update.push({ ...updateRow[0] });
            }

            const row = await Promise.all(update);
            await connection.execute(`ALTER TABLE ${module} RENAME COLUMN  ${api_name} TO ${newName == null ? api_name : newName}`);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updateUnusedFields: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const name = req.body.name
            const newName = req.body.new_name
            const field = req.body
            let { id } = field
            let { related_id } = field
            let { api_name } = field
            let { unused } = field
            let data = req.body;
            if (!Array.isArray(data)) {
                data = [data];
            }
            if (!field.hasOwnProperty("id")) {
                id = null
            }
            if (!field.hasOwnProperty("related_id")) {
                related_id = null
            }
            if (!field.hasOwnProperty("api_name")) {
                api_name = null
            }
            if (!field.hasOwnProperty("unused")) {
                unused = null
            }
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });

            const update = [];

            for (const obj of data) {
                const query = `UPDATE fields SET unused = ? WHERE id = ?;`;
                const [updateRow] = await connection.execute(query, [obj.unused, obj.id]);
                update.push({ ...updateRow[0] });
            }

            const row = await Promise.all(update);

            const update2 = [];
            for (const obj of data) {
                const query = `DELETE FROM section_fields WHERE field_id = ?;`;
                const [updateRow] = await connection.execute(query, [obj.id]);
                update2.push({ ...updateRow[0] });
            }

            const row2 = await Promise.all(update2);

            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updateRelatedField: async (req, res) => {
        try {
            const orgId = req.params.org
            const moduleName = req.params.module
            const name = req.body.name
            const api_name = req.body.api_name
            const newName = req.body.new_name
            const field = req.body
            let { id } = field
            let { related_module } = field
            let { related_id } = field
            let { module_id } = field
            let data = req.body;
            if (!Array.isArray(data)) {
                data = [data];
            }
            if (!field.hasOwnProperty("id")) {
                id = null
            }
            if (!field.hasOwnProperty("related_module")) {
                related_module = null
            }
            if (!field.hasOwnProperty("related_id")) {
                related_id = null
            }
            if (!field.hasOwnProperty("related_id")) {
                module_id = null
            }
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });

            const [row] = await connection.execute(`UPDATE modulos_relacionados SET related_id = ? WHERE module_id = ? AND related_module = ?;`, [related_id, module_id, related_module]);
            insertRow = null
            if (row.affectedRows === 0) {
                const [insertResult] = await connection.execute(`INSERT INTO modulos_relacionados (related_id, module_id, related_module, module_name) VALUES (?, ?, ?, ?);`, [related_id, module_id, related_module, moduleName]);
                insertRow = insertResult
            }


            await connection.end();
            res.json({ updateResult: row[0], insertResult: insertRow });
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
            await connection.execute(`ALTER TABLE ${module} DROP COLUMN ${field_api_name};`);
            const row = await connection.execute('DELETE FROM fields WHERE module = ? AND api_name = ?;', [module, field_api_name]);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
}