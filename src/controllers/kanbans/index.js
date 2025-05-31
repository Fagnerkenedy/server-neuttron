const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const { createFields } = require('../../utility/functions')
const { gerarHash } = require('../../utility/functions')
const groupBy = require('./GroupBy')

module.exports = {
    read: async (req, res) => {
        let connection;
        try {
            const orgId = req.params.org;
            const moduleName = req.params.module;
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const [kanbanResults] = await connection.execute('SELECT field FROM kanban WHERE module = ?;', [moduleName]);

            if (kanbanResults.length === 0) {
                res.status(200).json({ success: true, message: "No kanbans found", kanban: [] });
                return;
            }

            const [fields] = await connection.execute(`SELECT name, api_name, field_type FROM fields WHERE module = ? AND is_visible_in_kanban = true ORDER BY kanban_order;`, [moduleName]);

            const fieldMetaMap = {};
            fields.forEach(field => {
                fieldMetaMap[field.api_name] = {
                    name: field.name,
                    field_type: field.field_type
                }
            });
            
            const fieldNames = fields.map(field => `${moduleName}.${field.api_name}`).join(', ');

            const sqlOptions = `SELECT ${moduleName}.id, ${fieldNames != '' ? `${fieldNames},` : ''} options.name FROM options LEFT JOIN ${moduleName} ON options.name = ${moduleName}.${kanbanResults[0].field} WHERE options.field_api_name = '${kanbanResults[0].field}' AND options.module = '${moduleName}' ORDER BY option_order;`

            const [options] = await connection.execute(sqlOptions);

            console.log("options: ", options)
            let separatedOptions = groupBy.group(options, ['name']);
            console.log("separatedOptions: ", separatedOptions)
            const resultObject = {};

            Object.keys(separatedOptions).forEach((optionName) => {
                resultObject[optionName] = {
                    name: optionName,
                    items: separatedOptions[optionName].filter(field => field.id !== null).map(option => {
                        // delete option.name
                        const contentWithMeta = {};
                        Object.keys(option).forEach(key => {
                            if (key !== 'id' && key !== 'name') {
                                contentWithMeta[key] = {
                                    value: option[key],
                                    field_name: fieldMetaMap[key].name || key, // fallback se não tiver nome
                                    field_type: fieldMetaMap[key].field_type || 'unknown',
                                };
                            }
                        });

                        return {
                            id: option['id'],
                            content: contentWithMeta,
                        };
                    })
                };
            });

            await connection.commit();
            res.status(200).json({ success: true, message: "Kanbans", field_api_name: kanbanResults[0].field, resultObject });

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
    readFieldsOrder: async (req, res) => {
        let connection;
        try {
            const orgId = req.params.org;
            const moduleName = req.params.module;
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const [kanbanFieldsOrder] = await connection.execute('SELECT id, name, api_name, kanban_order, is_visible_in_kanban FROM fields WHERE module = ? ORDER BY kanban_order;', [moduleName]);

            if (kanbanFieldsOrder.length === 0) {
                res.status(404).json({ success: true, message: "No kanbans fields found", kanbanFieldsOrder: [] });
                return;
            }

            console.log(kanbanFieldsOrder);

            await connection.commit();
            res.status(200).json({ success: true, message: "Kanban fields order", kanbanFieldsOrder });

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
    updateFieldsOrder: async (req, res) => {
        let connection;
        try {
            const orgId = req.params.org;
            const moduleName = req.params.module;
            const fields = req.body

            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const kanbanFieldsOrder = fields.map(async (field) => {
                const id = field.id
                const index = fields.findIndex(field => field.id === id)
                await connection.execute(
                    'UPDATE fields SET kanban_order = ? WHERE id = ? and module = ?;',
                    [index, id, moduleName]
                )
            })

            await connection.commit();
            res.status(200).json({ success: true, message: "Kanban fields order", kanbanFieldsOrder });

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
    updateVisibleFields: async (req, res) => {
        let connection;
        try {
            const orgId = req.params.org;
            const moduleName = req.params.module;
            const id = req.body.id
            const checked = req.body.is_visible_in_kanban

            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const kanbanVisibleFields = await connection.execute(
                'UPDATE fields SET is_visible_in_kanban = ? WHERE id = ? and module = ?;',
                [checked, id, moduleName]
            )

            await connection.commit();
            res.status(200).json({ success: true, message: "Kanban visible fields", kanbanVisibleFields });

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