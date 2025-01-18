const crypto = require('crypto');
const mysql = require('mysql2/promise');
const { createFields2 } = require('../controllers/settings data/createFields')
const dbConfig = require('../../src/database/index')
const nodemailer = require('nodemailer')

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

const createFields = async (fields, connection, orgId, module, fieldType, moduleNameSubform) => {
    await createTables(connection, orgId, module);

    let idField;
    let results = []
    for (const field of fields) {
        try {
            const { name, type, id, position = null, sort_order = null, related_module = null, related_id = null, required = null, disabled = null, visible_rows = null, search_field = null, field_type = null, options = null, unused = null } = field;
            let apiName = field.api_name || name.replace(/[^\w\s]|[\sç]/gi, '_').toLowerCase();

            const [searchField] = await connection.execute('SELECT id FROM fields WHERE module = ? and api_name = ? and id = ?;', [module, apiName, id]);

            let uniqueApiName = apiName
            if (searchField.length === 0) {
                uniqueApiName = await getUniqueApiName(module, apiName, connection);
                const [result] = await connection.execute(`
                INSERT INTO fields (name, api_name, type, field_type, related_module, related_id, search_field, module, unused, required, disabled, visible_rows) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                    [name, uniqueApiName, type, field_type, related_module, related_id, search_field, module, unused, required, disabled, visible_rows]);
                idField = result.insertId;
                console.log("INSERT: ", result);
            } else {
                const [result] = await connection.execute(`
                UPDATE fields SET name = ?, api_name = ?, type = ?, field_type = ?, related_module = ?, related_id = ?, search_field = ?, module = ?, unused = ?, required = ?, disabled = ?, visible_rows = ? WHERE id = ?;`,
                    [name, apiName, type, field_type, related_module, related_id, search_field, module, unused, required, disabled, visible_rows, searchField[0].id]);
                idField = searchField[0].id;
                console.log("UPDATE: ", result);
            }

            if (options) {
                for (let index = 0; index < options.length; index++) {
                    const option = options[index];
                    const id = option.id;
                    const name = option.label || option;

                    if (id == null) {
                        // Gerar ID para opções novas
                        const option_id = gerarHash(JSON.stringify(option, module, orgId));
                        console.log("index: ", index);

                        await connection.execute(
                            `INSERT INTO options (id, name, field_api_name, module, option_order) VALUES (?, ?, ?, ?, ?);`,
                            [option_id, name, uniqueApiName, module, index]
                        );
                    } else {
                        // Atualizar opções existentes
                        await connection.execute(
                            `UPDATE options SET name = ?, option_order = ? WHERE id = ?;`,
                            [name, index, id]
                        );
                    }
                }
            }

            // if (options != null) {
            //     Object.keys(options).forEach(async (index) => {
            //         const option_id = gerarHash(JSON.stringify( options[index], module, orgId ));
            //         console.log("option_id", option_id)
            //         console.log("optihjrio", options)
            //         await connection.execute(`INSERT INTO options (id, name, field_api_name, module, option_order) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), option_order = VALUES(option_order);`, [option_id, options[index], apiName, module, index]);

            //     })
            //     // for (const option of options) {
            //     //     const id = option.id
            //     //     const index = options.findIndex(option => option.id === id)
            //     //     console.log("iindex: ", index)
            //     //     await connection.execute(`INSERT INTO options (name, field_api_name, module, option_order) VALUES (?, ?, ?, ?);`, [option, apiName, module, index]);
            //     // }
            // }

            if (related_module != null) {
                const [searchRelatedModule] = await connection.execute('SELECT id FROM modulos_relacionados WHERE related_module = ? and related_id = ? and module_name = ? and api_name = ? and search_field = ?;', [related_module, related_id, module, apiName, search_field]);
                if (searchRelatedModule.length === 0) {
                    await connection.execute('INSERT INTO modulos_relacionados (related_module, related_id, module_name, api_name, search_field) VALUES (?, ?, ?, ?, ?);', [related_module, related_id, module, apiName, search_field]);
                } else {
                    await connection.execute(`
                    INSERT INTO modulos_relacionados 
                    (id, related_module, related_id, module_name, api_name, search_field) VALUES (?, ?, ?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE 
                    related_module = VALUES(related_module),
                    related_id = VALUES(related_id),
                    module_name = VALUES(module_name),
                    api_name = VALUES(api_name),
                    search_field = VALUES(search_field);;`,
                        [searchRelatedModule[0].id, related_module, related_id, module, apiName, search_field]);
                }
            }

            const [table] = await connection.execute(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = ?
                AND table_name = ?
                AND column_name = ?;
            `, [orgId, fieldType == "subform" ? moduleNameSubform : module, uniqueApiName]);

            if (table.length === 0) {
                await connection.execute(`ALTER TABLE ${fieldType == "subform" ? moduleNameSubform : module} ADD ${uniqueApiName} ${type};`);
            }
            results.push({ idField, id })

        } catch (error) {
            console.error(error.message);
        }
    }

    return results
};
const createSectionFields = async (sections, connection, orgId, moduleName, idPerfil, userId) => {
    try {

        const insertPromises = sections.map(async (section) => {
            const sectionId = section.id
            const sectionName = section.name
            const sort_order = section.sort_order
            const fieldType = section.field_type
            let fields = section.fields

            if (!Array.isArray(fields)) {
                fields = [fields];
            }

            if (!Array.isArray(section)) {
                section = [section];
            }

            // connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();
            const querySections = `CREATE TABLE IF NOT EXISTS sections (
                id VARCHAR(19) NOT NULL PRIMARY KEY,
                name VARCHAR(255),
                module VARCHAR(255),
                field_type VARCHAR(255),
                sort_order VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`;
            await connection.execute(querySections);

            const index = sections.findIndex(section => section.id === sectionId)
            const [result] = await connection.execute(
                'INSERT INTO sections (id, name, module, sort_order, field_type) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);',
                [sectionId, sectionName, moduleName, index, fieldType]
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

            let moduleNameSubform
            if (fieldType == "subform") {
                moduleNameSubform = sectionName.replace(/[^\w\s]|[\sç]/gi, '_')
                const [searchSubform] = await connection.execute('SELECT name FROM modules WHERE name = ? AND api_name = ?;', [sectionName, moduleNameSubform]);
                if (searchSubform.length == 0) {
                    const req = {
                        params: { org: orgId },
                        body: { name: sectionName }
                    }
                    await create(req)
                }
            }

            let createdFieldsLeft = ''
            let createdFieldsRight = ''
            let upsertFieldLeft = []
            let upsertFieldRight = []
            if (fields[0].left.length !== 0) {
                createdFieldsLeft = await createFields2(fields[0].left, connection, orgId, moduleName, idPerfil, userId, fieldType, moduleNameSubform)
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
                createdFieldsRight = await createFields2(fields[0].right, connection, orgId, moduleName, idPerfil, userId)
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

        return insertResults
    } catch (error) {
        console.error(error.message);
    }
};
const sendEmail = async (email, record_id, orgId) => {
    const transporter = nodemailer.createTransport({
        host: process.env.NODEMAILER_SMTP,
        port: process.env.NODEMAILER_PORT,
        secure: true,
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS
        },
        tls: {
            ciphers: 'SSLv3'
        }
    })

    transporter.sendMail({
        from: process.env.NODEMAILER_USER,
        to: email,
        replyTo: process.env.NODEMAILER_USER,
        subject: "Neuttron - Convite",
        text: "Você recebeu um convite para se cadastrar no nosso sistema, por favor crie sua senha clicando no link: " + process.env.FRONT_URL + "/" + orgId + "/cadastro/nova_senha/" + record_id,
    }).then(info => {
        return ({ success: true, message: info })
    }).catch(error => {
        return ({ success: false, message: error })
    })
}

module.exports = { gerarHash, createFields, createSectionFields, sendEmail };
