const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const { createFields } = require('../../utility/functions')
const { gerarHash } = require('../../utility/functions')

module.exports = {
    create: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const moduleName = req.params.module
            const sections = req.body.sections

            const insertPromises = req.body.sections.map(async (section) => {
                const sectionId = section.id
                const sectionName = section.name
                const sort_order = section.sort_order
                let fields = section.fields

                if (!Array.isArray(fields)) {
                    fields = [fields];
                }

                if (!Array.isArray(section)) {
                    section = [section];
                }

                connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
                await connection.beginTransaction();
                const querySections = `CREATE TABLE IF NOT EXISTS sections (
                    id VARCHAR(19) NOT NULL PRIMARY KEY,
                    name VARCHAR(255),
                    module VARCHAR(255),
                    sort_order VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`;
                await connection.execute(querySections);

                const index = sections.findIndex(section => section.id === sectionId)
                const [result] = await connection.execute(
                    'INSERT INTO sections (id, name, module, sort_order) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);',
                    [sectionId, sectionName, moduleName, index]
                )

                const querySectionFields = `CREATE TABLE IF NOT EXISTS section_fields (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    section_id VARCHAR(19),
                    field_id VARCHAR(19),
                    position VARCHAR(255),
                    sort_order VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )`;
                await connection.execute(querySectionFields);

                let createdFieldsLeft = ''
                let createdFieldsRight = ''
                let upsertFieldLeft = []
                let upsertFieldRight = []
                if (fields[0].left.length !== 0) {
                    createdFieldsLeft = await createFields(fields[0].left, connection, orgId, moduleName)
                    if (createdFieldsLeft.length !== 0) {
                        for (const result of createdFieldsLeft) {
                            if (result.idField) {
                                const index = fields[0].left.findIndex(field => field.id === result.id);
                                const [searchSectionFieldsLeft] = await connection.execute(`
                                    SELECT id FROM section_fields WHERE field_id = ?;`,
                                    [result.id])
                                if (searchSectionFieldsLeft.length === 0) {
                                    upsertFieldLeft = await connection.execute(`
                                    INSERT INTO section_fields 
                                    (section_id, field_id, position, sort_order) VALUES (?, ?, ?, ?);`,
                                        [sectionId, result.idField, "left", index]);
                                } else {
                                    upsertFieldLeft = await connection.execute(`
                                    UPDATE section_fields SET section_id = ?, field_id = ?, position = ?, sort_order = ? WHERE id = ?;`,
                                        [sectionId, result.idField, "left", index, searchSectionFieldsLeft[0].id]);
                                }
                            }
                        }
                    }
                }
                if (fields[0].right.length !== 0) {
                    createdFieldsRight = await createFields(fields[0].right, connection, orgId, moduleName)
                    if (createdFieldsRight.length !== 0) {
                        for (const result of createdFieldsRight) {
                            if (result.idField) {
                                const index = fields[0].right.findIndex(field => field.id === result.id);
                                const [searchSectionFieldsRight] = await connection.execute(`
                                SELECT id FROM section_fields WHERE field_id = ?;`,
                                    [result.id])
                                if (searchSectionFieldsRight.length === 0) {
                                    upsertFieldRight = await connection.execute(`
                                    INSERT INTO section_fields 
                                    (section_id, field_id, position, sort_order) VALUES (?, ?, ?, ?);`,
                                        [sectionId, result.idField, 'right', index]);
                                } else {
                                    upsertFieldRight = await connection.execute(`
                                    UPDATE section_fields SET section_id = ?, field_id = ?, position = ?, sort_order = ? WHERE id = ?;`,
                                        [sectionId, result.idField, 'right', index, searchSectionFieldsRight[0].id]);
                                }
                            }
                        }
                    }
                }
                return { upsertFieldLeft, upsertFieldRight }
            });
            const insertResults = await Promise.all(insertPromises);

            await connection.commit();

            res.json({ success: true, message: "Layout updated successfully", insertResults });
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
        let connection;
        try {
            const orgId = req.params.org;
            const moduleName = req.params.module;
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            // Obtém todas as seções
            const [sectionResults] = await connection.execute('SELECT * FROM sections WHERE module = ? ORDER BY sort_order;',[moduleName]);

            if (sectionResults.length === 0) {
                res.json({ success: true, message: "No sections found", sections: [] });
                return;
            }

            const sectionIds = sectionResults.map(section => section.id);

            if (sectionIds.length === 0) {
                res.json({ success: true, message: "No sections found", sections: [] });
                return;
            }

            // Obtém os section_fields associados às seções
            const [sectionFieldsResults] = await connection.execute(
                `SELECT * FROM section_fields WHERE section_id IN (${sectionIds.map(() => '?').join(',')})`,
                sectionIds
            );

            if (sectionFieldsResults.length === 0) {
                res.json({ success: true, message: "No section fields found", sections: sectionResults });
                return;
            }

            const fieldIds = sectionFieldsResults.map(field => field.field_id);

            // Obtém os campos associados ao módulo especificado
            const [fieldsResults] = await connection.execute(
                `SELECT * FROM fields WHERE id IN (${fieldIds.map(() => '?').join(',')}) AND module = ?`,
                [...fieldIds, moduleName]
            );

            const fieldsMap = fieldsResults.reduce((acc, field) => {
                acc[field.id] = field;
                return acc;
            }, {});

            const sections = sectionResults.map(section => ({
                ...section,
                fields: {
                    left: sectionFieldsResults
                        .filter(field => field.section_id === section.id && field.position === 'left' && fieldsMap[field.field_id])
                        .map(field => ({ ...field, ...fieldsMap[field.field_id] }))
                        .sort((a, b) => a.sort_order - b.sort_order),
                    right: sectionFieldsResults
                        .filter(field => field.section_id === section.id && field.position === 'right' && fieldsMap[field.field_id])
                        .map(field => ({ ...field, ...fieldsMap[field.field_id] }))
                        .sort((a, b) => a.sort_order - b.sort_order),
                }
            }));

            await connection.commit();
            res.status(200).json({ success: true, message: "Sections", sections });

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
    delete: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const moduleName = req.params.module
            const sections = req.body
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            let fetchProfilePermission
            for (const section of sections) {
                console.log("sections: ", section);
                try {
                    fetchProfilePermission = await connection.execute(
                        'DELETE FROM sections WHERE module = ? AND id = ?;',
                        [moduleName, section.sectionId]
                    );
                } catch (error) {
                    console.error(`Erro ao deletar a seção com id ${section.sectionId}:`, error);
                }
            }

            await connection.commit();
            res.status(200).json({ success: true, message: "Sections deleted", fetchProfilePermission });

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