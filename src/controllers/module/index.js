const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index');
const { createProfilesPermissions, createPermissions } = require('../settings data/createPermissions');
const { createSectionFields } = require('../../utility/functions');
const basicFields = require('./basicFields.json');
const { sectionLogs } = require('./basicFields');

module.exports = {
    create: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const moduleName = req.body.name
            if (!orgId || !moduleName) {
                return res.status(400).json({ error: "Missing orgId or moduleName in request" });
            }
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            let moduleNameApi = moduleName.replace(/[^\w\s]|[\sç]/gi, '_')
            await connection.beginTransaction();
            const query = `CREATE TABLE IF NOT EXISTS ${moduleNameApi} (
                id VARCHAR(19) PRIMARY KEY,
                related_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            const query2 = `CREATE TABLE IF NOT EXISTS modules (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                api_name VARCHAR(255),
                perfil VARCHAR(2000),
                layout_type VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            await connection.execute(query2);
            await connection.execute(
                "INSERT INTO modules (name, api_name, layout_type) VALUES (?, ?, 'tabela');",
                [moduleName, moduleNameApi]
            );
            const [result] = await connection.execute(query);

            const insertDataPermissions = await createPermissions(req={ params: { org: orgId}, body: [{action: 'read', subject: moduleNameApi},{action: 'create', subject: moduleNameApi},{action: 'update', subject: moduleNameApi},{action: 'delete', subject: moduleNameApi},{action: 'access', subject: moduleNameApi}] })

            const [idProfile] = await connection.execute(
                `SELECT id FROM profiles WHERE perfil = 'Administrador';`
            );

            for(const id_permission of insertDataPermissions) {
                const req = {
                    params: { org: orgId},
                    body: {
                        id_profile: idProfile[0].id,
                        id_permission: id_permission
                    }
                }
                await createProfilesPermissions(req)
            }
            
            
            // await connection.commit();
            await createSectionFields(sectionLogs(), connection, orgId, moduleNameApi)
            // await connection.end();

            res.json({ success: true, message: "Table created successfully", result, moduleNameApi });
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
    createSectionFields: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const moduleName = req.body.name
            if (!orgId || !moduleName) {
                return res.status(400).json({ error: "Missing orgId or moduleName in request" });
            }
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            let moduleNameApi = moduleName.replace(/[^\w\s]|[\sç]/gi, '_')

            await createSectionFields(basicFields, connection, orgId, moduleNameApi)
            
            // await connection.end();

            res.json({ success: true, message: "Table created successfully", result, moduleNameApi });
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
            const query = `SELECT name, api_name FROM modules;`
            const [result] = await connection.execute(query);
            await connection.end();
            res.json({ success: true, message: "Module Name", result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    readLayoutContent: async (req, res) => {
        try {
            const orgId = req.params.org
            const moduleName = req.params.module
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const query = `SELECT layout_type FROM modules WHERE api_name = '${moduleName}';`
            const [result] = await connection.execute(query);
            await connection.end();
            res.status(200).json({ success: true, message: "Module Layout", result });
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
            let moduleNameApi = moduleName.replace(/[^\w\s]|[\sç]/gi, '_')
            let newModuleNameApi = newName.replace(/[^\w\s]|[\sç]/gi, '_')
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const row = await connection.execute('UPDATE modules SET name = ? WHERE name = ?;', [newName, moduleName]);
            // await connection.execute(`ALTER TABLE ${moduleNameApi} RENAME TO ${newModuleNameApi};`);
            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updateLayoutContent: async (req, res) => {
        try {
            const orgId = req.params.org
            const moduleName = req.params.module
            const layout_type = req.body.layout_type
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const row = await connection.execute('UPDATE modules SET layout_type = ? WHERE api_name = ?;', [layout_type, moduleName]);
            // await connection.execute(`ALTER TABLE ${moduleNameApi} RENAME TO ${newModuleNameApi};`);
            await connection.end();
            res.status(200).json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const orgId = req.params.org
            const moduleName = req.body.name
            const moduleNameApi = req.body.api_name
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            //const row = await connection.execute('DELETE FROM modules WHERE module_id = ? AND organization_id = ?; DELETE FROM module_fields WHERE module_id = ? AND organization_id = ?; DELETE FROM module_data WHERE module_id = ? AND organization_id = ?;', [module_id, orgId, module_id, orgId, module_id, orgId]);
            const deleteModuleQuery = 'DELETE FROM modules WHERE api_name = ?;';
            const deleteFieldsQuery = 'DELETE FROM fields WHERE module = ?;';
            const deleteModuleTableQuery = `DROP TABLE ${moduleNameApi};`;
            const deleteModuloRelacionado = 'DELETE FROM modulos_relacionados WHERE module_name = ?;'
            const deleteSectionFields = 'DELETE FROM section_fields WHERE section_id IN (SELECT id FROM sections WHERE module = ?);'
            const deleteSections = 'DELETE FROM sections WHERE module = ?;'
            const deleteOptions = 'DELETE FROM options WHERE module = ?'

            let row = await connection.execute(deleteModuleQuery, [moduleNameApi]);
            await connection.execute(deleteFieldsQuery, [moduleName]);
            row = await connection.execute(deleteModuleTableQuery);
            await connection.execute(deleteModuloRelacionado, [moduleName]);
            await connection.execute(deleteSectionFields, [moduleName]);
            await connection.execute(deleteSections, [moduleName]);
            await connection.execute(deleteOptions, [moduleName]);

            await connection.end();
            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
}