module.exports = {
    createFields: async (fields, connection, orgId, module) => {
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
        return insertResults
    }
}