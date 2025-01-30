const { gerarHash } = require("../../utility/functions");

module.exports = {
    createFieldsProfiles: async (fields, connection, orgId, module) => {
        const insertPromises = fields.map(async (field) => {
            const { name, type } = field;
            let { related_module } = field
            let { related_id } = field
            let { field_type } = field
            let { options } = field
            // let { apiName } = field
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
            // if (!field.hasOwnProperty("apiName")) {
            //     apiName = null
            // }
            let apiName = name.replace(/[^\w\s]|[\sç]/gi, '_').toLowerCase();
            const query = `CREATE TABLE IF NOT EXISTS fields (
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
            visible_rows VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
            await connection.execute(query);

            const queryOptions = `CREATE TABLE IF NOT EXISTS options (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                field_api_name VARCHAR(255),
                module VARCHAR(255),
                option_order VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            await connection.execute(queryOptions);

            if (options) {
                for (let index = 0; index < options.length; index++) {
                    const option = options[index];
                    const id = option.id;
                    const name = option.label || option

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
            //         await connection.execute(`INSERT INTO options (name, field_api_name, module, option_order) VALUES (?, ?, ?, ?);`, [options[index], apiName, module, index]);
            //     })
            //     // for (const option of options) {
            //     //     const id = option.id
            //     //     const index = options.findIndex(option => option.id === id)
            //     //     console.log("iindex: ", index)
            //     //     await connection.execute(`INSERT INTO options (name, field_api_name, module, option_order) VALUES (?, ?, ?, ?);`, [option, apiName, module, index]);
            //     // }
            // }

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
        return insertResults
    }
}