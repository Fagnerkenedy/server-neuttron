const crypto = require('crypto');

module.exports = {
    insertData: async (data, connection, orgId, module) => {
        try {

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

            const inserts = [];

            for (const obj of data) {
                const record_id = gerarHash(JSON.stringify({ orgId, module, obj }));
                const fieldNames = Object.keys(obj).join(', ');
                const fieldValues = Object.values(obj);
                if (fieldValues.length === 0) {
                    continue;
                }
                const placeholders = fieldValues.map(() => '?').join(', ');
                const query = `INSERT INTO ${module} (id, ${fieldNames}) VALUES (?, ${placeholders})`;
                const [insertRow] = await connection.execute(query, [record_id, ...fieldValues]);
                inserts.push({ record_id, ...insertRow[0] });
            }

            await Promise.all(inserts);

        } catch (error) {
            console.error("Erro ao criar tabelas e inserir dados:", error);
            throw error;
        }
    }
}