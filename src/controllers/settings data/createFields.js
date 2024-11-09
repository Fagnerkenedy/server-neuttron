// module.exports = {
//     // createFields: async (fields, connection, orgId, module, idPerfil, userId) => {
//     //     try {
//     //         console.log("fields",fields)
//     //         console.log("connection",connection)
//     //         console.log("orgId",orgId)
//     //         console.log("module",module)


//     //         const insertPromises = fields.map(async (field) => {
//     //             console.log("aaaa1")
//     //             const { name, type } = field;
//     //             let { related_module } = field
//     //             let { related_id } = field
//     //             let { field_type } = field
//     //             let { options } = field
//     //             let { apiName } = field
//     //             let { alter_table } = field
//     //             if (!field.hasOwnProperty("related_module")) {
//     //                 related_module = null
//     //             }
//     //             if (!field.hasOwnProperty("related_id")) {
//     //                 related_id = null
//     //             }
//     //             if (field.hasOwnProperty("related_module") && !field.hasOwnProperty("related_id")) {
//     //                 related_id = idPerfil
//     //             }
//     //             if (!field.hasOwnProperty("field_type")) {
//     //                 field_type = null
//     //             }
//     //             if (!field.hasOwnProperty("options")) {
//     //                 options = null
//     //             }
//     //             if (!field.hasOwnProperty("apiName")) {
//     //                 apiName = null
//     //             }
//     //             if (!field.hasOwnProperty("alter_table")) {
//     //                 alter_table = null
//     //             }
//     //             // let apiName = name.replace(/[^\w\s]|[\sç]/gi, '_').toLowerCase();
//     //             const query = `CREATE TABLE IF NOT EXISTS fields (
//     //         id INT PRIMARY KEY AUTO_INCREMENT,
//     //         name VARCHAR(255),
//     //         api_name VARCHAR(255),
//     //         type VARCHAR(255),
//     //         field_type VARCHAR(255),
//     //         related_module VARCHAR(255),
//     //         related_id VARCHAR(255),
//     //         module VARCHAR(255),
//     //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     //     )`;
//     //             await connection.execute(query);
//     //             console.log("aaaa2")
//     //             const queryOptions = `CREATE TABLE IF NOT EXISTS options (
//     //             id INT PRIMARY KEY AUTO_INCREMENT,
//     //             name VARCHAR(255),
//     //             field_api_name VARCHAR(255),
//     //             module VARCHAR(255),
//     //             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     //             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     //         )`;
//     //             await connection.execute(queryOptions);
//     //             console.log("aaaa3")
//     //             if (options != null) {
//     //                 for (const option of options) {
//     //                     await connection.execute(`INSERT INTO options (name, field_api_name, module) VALUES (?, ?, ?);`, [option, apiName, module]);
//     //                 }
//     //             }

//     //             const [insertResult1] = await connection.execute(`INSERT INTO fields (name, api_name, type, field_type, related_module, related_id, module) VALUES (?, ?, ?, ?, ?, ?, ?);`, [name, apiName, type, field_type, related_module, related_id, module]);
//     //             console.log("aaaa4")

//     //             const queryModulosRelacionados = `CREATE TABLE IF NOT EXISTS modulos_relacionados (
//     //             id INT PRIMARY KEY AUTO_INCREMENT,
//     //             module_name VARCHAR(255),
//     //             module_id VARCHAR(255),
//     //             related_module VARCHAR(255),
//     //             related_id VARCHAR(255),
//     //             api_name VARCHAR(255),
//     //             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     //             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     //         )`;
//     //             await connection.execute(queryModulosRelacionados);
//     //             console.log("aaaa5")

//     //             if (related_module != null) {
//     //                 await connection.execute(`INSERT INTO modulos_relacionados (related_module, related_id, module_name, module_id, api_name) VALUES (?, ?, ?, ?, ?);`, [related_module, related_id, module, userId, apiName]);
//     //             }
//     //             if (alter_table == true) {

//     //                 const table = await connection.execute(`SELECT column_name
//     //                 FROM information_schema.columns
//     //                 WHERE table_schema = '${orgId}'
//     //                 AND table_name = '${module}'
//     //                 AND column_name = '${apiName}';
//     //                 `);
//     //                 if (table[0][0] == null) {
//     //                     const [insertResult] = await connection.execute(`ALTER TABLE ${module} ADD ${apiName} ${type};`);

//     //                     return insertResult;
//     //                 }
//     //             }
//     //             return insertResult1
//     //         });
//     //         const insertResults = await Promise.all(insertPromises);
//     //         return insertResults
//     //     } catch (error) {
//     //         return error
//     //     }
//     // },

// }
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const gerarHash = (dados) => {
    dados = JSON.stringify(dados);
    const dadosComTimestamp = dados + Date.now().toString();
    const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex');
    return hash.substring(0, 19);
};

const getUniqueApiName = async (moduleName, baseName, connection) => {
    const [rows] = await connection.query('SELECT api_name FROM fields WHERE module = ? and api_name LIKE ?;', [moduleName, `${baseName}%`]);

    if (rows.length === 0) {
        let maxIndex = 0;
        rows.forEach(row => {
            const match = row.api_name.match(/(\d+)$/);
            if (match) {
                const index = parseInt(match[1], 10);
                if (index > maxIndex) {
                    maxIndex = index;
                }
            }
        });

        return baseName;
    } else {
        let maxIndex = 0;
        rows.forEach(row => {
            const match = row.api_name.match(/(\d+)$/);
            if (match) {
                const index = parseInt(match[1], 10);
                if (index > maxIndex) {
                    maxIndex = index;
                }
            }
        });

        return `${baseName}${maxIndex + 1}`;
    }
};

const createTables = async (connection, orgId, module) => {
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS fields (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255),
            api_name VARCHAR(255),
            type VARCHAR(255),
            field_type VARCHAR(255),
            related_module VARCHAR(255),
            related_id VARCHAR(255),
            field_base VARCHAR(255),
            search_field VARCHAR(255),
            kanban_order VARCHAR(255),
            table_order VARCHAR(255),
            module VARCHAR(255),
            is_visible_in_kanban BOOLEAN,
            unused BOOLEAN,
            required BOOLEAN,
            disabled BOOLEAN,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await connection.execute(`
        CREATE TABLE IF NOT EXISTS options (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            field_api_name VARCHAR(255),
            module VARCHAR(255),
            option_order VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await connection.execute(`
        CREATE TABLE IF NOT EXISTS modulos_relacionados (
            id INT PRIMARY KEY AUTO_INCREMENT,
            module_name VARCHAR(255),
            module_id VARCHAR(255),
            related_module VARCHAR(255),
            related_id VARCHAR(255),
            search_field VARCHAR(255),
            api_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

const createFields2 = async (fields, connection, orgId, module, idPerfil, userId) => {
    await createTables(connection, orgId, module);

    let idField;
    let results = []
    for (const field of fields) {
        try {
            const { name, type, id = null, position = null, sort_order = null, related_module = null, required = true, disabled = null, field_base = null, search_field = null, kanban_order = null, table_order = null, field_type = null, options = null } = field;
            let related_id = field.related_id || null;
            if (field.hasOwnProperty("related_module") && field.related_module == 'profiles') {
                related_id = idPerfil
            }
            let apiName = field.api_name || name.replace(/[^\w\s]|[\sç]/gi, '_').toLowerCase();

            const [searchField] = await connection.execute('SELECT id FROM fields WHERE module = ? and api_name = ? and id = ?;', [module, apiName, id]);

            let uniqueApiName = apiName
            if (searchField.length === 0) {
                uniqueApiName = await getUniqueApiName(module, apiName, connection);
                const [result] = await connection.execute(`
                INSERT INTO fields (name, api_name, type, field_type, related_module, related_id, field_base, search_field, kanban_order, table_order, module, required, disabled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                    [name, uniqueApiName, type, field_type, related_module, related_id, field_base, search_field, kanban_order, table_order, module, required, disabled]);
                idField = result.insertId;
                console.log("INSERT: ", result);
            } else {
                const [result] = await connection.execute(`
                UPDATE fields SET name = ?, api_name = ?, type = ?, field_type = ?, related_module = ?, related_id = ?, field_base = ?, search_field = ?, kanban_order = ?, table_order = ?, module = ?, required = ?, disabled = ? WHERE id = ?;`,
                    [name, apiName, type, field_type, related_module, related_id, field_base, search_field, kanban_order, table_order, module, required, disabled, searchField[0].id]);
                idField = searchField[0].id;
                console.log("UPDATE: ", result);
            }

            if (options != null) {
                Object.keys(options).forEach(async (index) => {
                    await connection.execute(`INSERT INTO options (name, field_api_name, module, option_order) VALUES (?, ?, ?, ?);`, [options[index], apiName, module, index]);
                })
                // for (const option of options) {
                //     const id = option.id
                //     const index = options.findIndex(option => option.id === id)
                //     console.log("iindex: ", index)
                // }
            }

            if (related_module != null) {
                const [searchRelatedModule] = await connection.execute(
                    'SELECT id FROM modulos_relacionados WHERE related_module = ? and related_id = ? and module_name = ? and api_name = ? and search_field = ?;', 
                    [related_module, related_id, module, apiName, search_field]
                );

                if (searchRelatedModule.length === 0) {
                    if (field.hasOwnProperty("related_module") && field.related_module == 'profiles') {
                        await connection.execute(
                            'INSERT INTO modulos_relacionados (related_module, related_id, module_name, module_id, api_name, search_field) VALUES (?, ?, ?, ?, ?, ?);', 
                            [related_module, related_id, module, userId, apiName, search_field]
                        );
                    } else {
                        await connection.execute(
                            'INSERT INTO modulos_relacionados (related_module, related_id, module_name, api_name, search_field) VALUES (?, ?, ?, ?, ?);', 
                            [related_module, related_id, module, apiName, search_field]
                        );
                    }
                } else {
                    await connection.execute(`
                        INSERT INTO modulos_relacionados 
                        (id, related_module, related_id, module_name, api_name, search_field) VALUES (?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE 
                        related_module = VALUES(related_module),
                        related_id = VALUES(related_id),
                        module_name = VALUES(module_name),
                        api_name = VALUES(api_name)
                        search_field = VALUES(search_field);`,
                        [searchRelatedModule[0].id, related_module, related_id, module, apiName, search_field ]
                    );
                }
            }

            const [table] = await connection.execute(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = ?
                AND table_name = ?
                AND column_name = ?;`, 
                [orgId, module, uniqueApiName]
            );

            if (table.length === 0) {
                await connection.execute(`ALTER TABLE ${module} ADD ${uniqueApiName} ${type};`);
            }
            results.push({ idField, id })

        } catch (error) {
            console.error(error.message);
        }
    }

    return results
};

module.exports = { gerarHash, createFields2 };
