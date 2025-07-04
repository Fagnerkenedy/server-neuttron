const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const crypto = require('crypto');
const { executeCustomFunctions } = require('../customFunctions/customFunctions');
const { sendEmail } = require('../../utility/functions');

module.exports = {
    create: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            let data = req.body

            if (!Array.isArray(data)) {
                data = [data];
            }

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }
            if (!data || Object.keys(data).length === 0) {
                return res.status(400).json({ error: 'Nenhum dado fornecido para inserção.' });
            }
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });

            const inserts = [];

            for (const obj of data) {
                console.log("obj",obj)
                const record_id = gerarHash(JSON.stringify({ orgId, module, obj }));
                // await executeCustomFunctions('Criar', orgId, module, obj, record_id, obj.related_record )
                let related_record = null
                if (obj.hasOwnProperty("related_record")) related_record = obj.related_record
                delete obj.related_record
                if (module == "users") {
                    sendEmail(obj.email, record_id, orgId)
                    const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
                    const [subscriptions] = await connectionNeuttron.execute(`SELECT users, active_users FROM subscriptions WHERE orgId = ?;`, [orgId.slice(3)]);
                    if (subscriptions.length > 0 && subscriptions[0].users > subscriptions[0].active_users) {
                        const active_users = Number(subscriptions[0].active_users) + 1
                        
                        await connectionNeuttron.execute(`INSERT INTO users SET id = ?, name = ?, email = ?, phone = ?, orgId = ?;`, [record_id, obj.name, obj.email, obj.phone, orgId.slice(3)]);
                        await connectionNeuttron.execute(`UPDATE subscriptions SET active_users = ? WHERE orgId = ?;`, [active_users, orgId.slice(3)]);
                    }
                    await connectionNeuttron.end();
                }
                const fieldNames = Object.keys(obj).join(', ');
                const fieldValues = Object.values(obj);
                if (fieldValues.length === 0) {
                    continue;
                }
                console.log("record_id",record_id)
                const placeholders = fieldValues.map(() => '?').join(', ');
                let query
                let insertRow
                if (module == "charts") {
                    let operation = ''
                    switch (obj.operation) {
                        case "Soma":
                            operation = "SUM"
                            break
                        case "Contagem":
                            operation = "COUNT"
                        default:
                            break;
                    }
                    const queryChart = `SELECT ${operation}(${obj.module}.${obj.yField}) as ${obj.yField}, options.name as name, options.option_order FROM ${obj.module} JOIN options ON options.name = ${obj.module}.${obj.xField_layout} WHERE options.module = '${obj.module}' GROUP BY options.name, options.option_order ORDER BY options.option_order;`
                    query = `INSERT INTO ${module} (id, query, xField, ${fieldNames}) VALUES (?, ?, ?, ${placeholders})`;
                    [insertRow] = await connection.execute(query, [record_id, queryChart, 'name', ...fieldValues]);
                } else {
                    query = `INSERT INTO ${module} (id, ${fieldNames}) VALUES (?, ${placeholders})`;
                    [insertRow] = await connection.execute(query, [record_id, ...fieldValues]);
                }
                inserts.push({ record_id, ...insertRow[0] });
                [obj].forEach(item => {
                    if (related_record != null) {
                        for (let key in item) {
                            if (related_record[key]) {
                                item[key] = related_record[key];
                            }
                        }
                    }
                });                
                console.log("asduasdhj",obj)
                await executeCustomFunctions('Criar', orgId, module, obj, record_id )
            }

            const row = await Promise.all(inserts);


            await connection.end();
            res.status(200).json( row[0] );
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    fetch: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            
            const row = await connection.execute(`SELECT * FROM ${module};`);

            await connection.end();

            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    read: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const record_id = req.params.id
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            
            const row = await connection.execute(`SELECT * FROM ${module} WHERE id = ?;`, [record_id]);
            await connection.end();

            res.json(row[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    readRelatedData: async (req, res) => {
        // try {
        //     const orgId = req.params.org
        //     const module = req.params.module
        //     const related_id = req.params.related_id
        //     const api_name = req.params.api_name
        //     const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            
        //     const row = await connection.execute(`SELECT * FROM ${module} WHERE ${api_name} = ?;`, [related_id]);
        //     await connection.end();

        //     res.json(row[0]);
        // } catch (error) {
        //     res.status(500).json({ error: error.message });
        // }
    },
    readRelatedData2: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const related_id = req.params.related_id
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            
            const [row] = await connection.execute(`SELECT DISTINCT module_id, module_name FROM modulos_relacionados WHERE related_id = ? AND module_name = ?;`, [related_id, module]);

            const recordsPromises = row.map(async (result) => {
                const [row2] = await connection.execute(`SELECT * FROM ${result.module_name} WHERE id = ?;`, [result.module_id]);
                return row2[0];
            });
    
            let records = await Promise.all(recordsPromises);
            records = records.filter(record => !!record);
            const sortedRecords = [...records].sort((a, b) => descending = true ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at));
            await connection.end();

            res.json(sortedRecords);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    readRelatedDataById: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const module_id = req.params.module_id
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            
            const [row] = await connection.execute(`SELECT related_id FROM modulos_relacionados WHERE module_id = ? AND related_module = ?;`, [module_id, module]);

            // const recordsPromises = row.map(async (result) => {
            //     console.log("registro 1", result)
            //     const [row2] = await connection.execute(`SELECT * FROM ${result.module_name} WHERE id = ?;`, [result.module_id]);
            //     console.log("fasdas", row2)
            //     return row2[0];
            // });
    
            // let records = await Promise.all(recordsPromises);
            // records = records.filter(record => !!record);
            await connection.end();

            return res.status(200).json({ success: true, row });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const record_id = req.params.id
            let data = req.body;
            if (!Array.isArray(data)) {
                data = [data];
            }
            console.log("data dentro do update: ",data)
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });

            const update = [];

            // Itera sobre cada objeto no array de dados e insere no banco de dados
            for (const obj of data) {
                let related_record = null
                if (obj.hasOwnProperty("related_record")) related_record = obj.related_record
                delete obj.related_record
                const fieldValues = Object.values(obj)
                if (fieldValues.length === 0) continue
                const setClause = Object.entries(obj).map(([fieldName, fieldValue]) => `${fieldName} = ?`).join(', ');
                // const query = `UPDATE ${module} SET ${setClause} WHERE id = ?`;
                // const [updateRow] = await connection.execute(query, [...fieldValues, record_id]);
                let query
                let updateRow
                if (module == "charts") {
                    let operation = ''
                    switch (obj.operation) {
                        case "Soma":
                            operation = "SUM"
                            break
                        case "Contagem":
                            operation = "COUNT"
                        default:
                            break;
                    }
                    const queryChart = `SELECT ${operation}(${obj.module}.${obj.yField}) as ${obj.yField}, options.name as name, options.option_order FROM ${obj.module} JOIN options ON options.name = ${obj.module}.${obj.xField_layout} WHERE options.module = '${obj.module}' GROUP BY options.name, options.option_order ORDER BY options.option_order;`
                    query = `UPDATE ${module} SET query = ?, xField = ?, ${setClause} WHERE id = ?`;
                    [updateRow] = await connection.execute(query, [ queryChart, 'name', ...fieldValues, record_id]);
                } else {
                    query = `UPDATE ${module} SET ${setClause} WHERE id = ?`;
                    [updateRow] = await connection.execute(query, [...fieldValues, record_id]);
                }
                update.push({ ...updateRow[0] });
                [obj].forEach(item => {
                    if (related_record != null) {
                        for (let key in item) {
                            if (related_record[key]) {
                                item[key] = related_record[key];
                            }
                        }
                    }
                })
                console.log("update obj: ",obj)
                await executeCustomFunctions('Editar', orgId, module, obj, record_id)
            }

            const row = await Promise.all(update);
            await connection.end();
            return res.status(200).json({ success: true, row, record_id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // update: async (req, res) => {
    //     try {
    //         const orgId = req.organization_id
    //         const module = req.params.module
    //         const id = req.params.id
    //         const data = req.body;
    //         console.log("dadadad",data)
    //         if (!data || Object.keys(data).length === 0) {
    //             return res.status(400).json({ error: 'Nenhum dado fornecido para inserção.' });
    //         }

    //         const connection = await mysql.createConnection(dbConfig);

    //         // Check if the module exists
    //         const [moduleRow] = await connection.execute(
    //             'SELECT module_id FROM modules WHERE organization_id = ? AND module_name = ?;',
    //             [orgId, module]
    //         );

    //         const module_id = moduleRow[0]?.module_id;

    //         if (!module_id) {
    //             await connection.end();
    //             return res.status(404).json({ error: 'Módulo não encontrado.' });
    //         }

    //         const fields = Object.keys(data);
    //         const values = Object.values(data);
    //         console.log("fieldsfields", fields)
    //         console.log("valuesvalues", values)
    //         const fieldRecord = await connection.execute(
    //             'SELECT field_api_name FROM module_data WHERE organization_id = ? AND module_id = ? AND record_id = ? AND field_api_name = ?;',
    //             [orgId, module_id, id, data.field_api_name]
    //         );
    //         console.log("fieldRecord", fieldRecord[0].length)

    //         const gerarHash = (dados) => {
    //             const dadosComTimestamp = dados + Date.now().toString();
    //             const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
    //             return hash.substring(0, 19)
    //         }
    //         if (fieldRecord[0].length == 0) {
    //             const idHash = gerarHash(JSON.stringify({ orgId, module_id, data, id }));
    //             const row = await connection.execute(
    //                 'INSERT INTO module_data (id, organization_id, module_id, record_id, field_api_name, field_value) VALUES (?, ?, ?, ?, ?, ?)',
    //                 [idHash, orgId, module_id, id, data.field_api_name, data.field_value]
    //             )
    //             await connection.end();
    //             return res.json(row)
    //         } else {
    //             const updateSql = `UPDATE module_data SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE record_id = ? AND module_id = ? AND organization_id = ? AND field_api_name = ?`;
    //             const updateValues = [...values, id, module_id, orgId, values[0]];
    //             console.log("updateSQL:", updateSql)
    //             console.log("updateValues:", updateValues)
    //             const row = await connection.execute(updateSql, updateValues);
    //             await connection.end();
    //             return res.json(row)
    //         }
    //     } catch (error) {
    //         res.status(500).json({ error: error.message });
    //     }
    // },
    delete: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module;
            const ids = req.params.id.split(',');
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });

            if (ids.length === 1) {
                if (module == "users") {
                    const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
                    const deleteSql = `DELETE FROM users WHERE id = ?`;
                    const deleteValues = [ids[0]];
                    await connectionNeuttron.execute(deleteSql, deleteValues);
                    const [subscriptions] = await connectionNeuttron.execute(`SELECT active_users FROM subscriptions WHERE orgId = ?;`, [orgId.slice(3)]);
                    if (subscriptions.length > 0) {
                        const active_users = Number(subscriptions[0].active_users) - 1

                        await connectionNeuttron.execute(`UPDATE subscriptions SET active_users = ? WHERE orgId = ?;`, [active_users, orgId.slice(3)]);
                    }
                    await connectionNeuttron.end();
                }
                const deleteSql = `DELETE FROM ${module} WHERE id = ?`;
                const deleteValues = [ids[0]];
                await connection.execute(deleteSql, deleteValues);
                await executeCustomFunctions('Excluir', orgId, module, '', ids[0])
            } else {
                const placeholders = ids.map(() => '?').join(', ');
                deleteSql = `DELETE FROM ${module} WHERE id IN (${placeholders})`;
                deleteValues = [...ids];
                await connection.execute(deleteSql, deleteValues);
            }

            await connection.end();
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}