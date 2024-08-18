const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')

module.exports = {
    getRecordById: async (module, id, connection) => {
        try {
            const [row] = await connection.execute(`SELECT * FROM ${module} WHERE id = ?;`, [id])

            return row[0]
        } catch (error) {
            console.log("Erro ao buscar o registro:", error);
            throw error; // Rejeita a promessa com o erro
        }
    },
    updateRecord: async (module, id, map, connection) => {
        try {
            if (!Array.isArray(map)) {
                map = [map];
            }

            for (const obj of map) {
                const columns = Object.keys(obj).map(key => `${key} = ?`).join(', ');
                const values = Object.values(obj);
                console.log(`UPDATE ${module} SET ${columns} WHERE id = ?;`, [...values, id]);
                const [row] = await connection.execute(`UPDATE ${module} SET ${columns} WHERE id = ?;`, [...values, id]);
                console.log("Resultado da query:", row);
            }

            return map;
        } catch (error) {
            console.log("Erro ao atualizar o registro:", error);
            throw error; // Rejeita a promessa com o erro
        }
    },
    get: (obj, path, defaultValue = "") => {
        if (!obj || typeof path !== 'string') {
            return defaultValue;
        }

        const pathArray = path.split(/[\.\[\]\'\"]/).filter(Boolean);

        return pathArray.reduce((acc, key) => {
            if (acc && acc[key] !== undefined) {
                return acc[key];
            }
            return defaultValue;
        }, obj);
    },

    today: () => {
        return new Date()
    }

    // updateRecordById: async (module, id, map, connection) => {
    //     map.forEach(async obj => {
    //         const [row] = await connection.execute(`UPDATE ${module} SET ${Object.keys(obj)} = ? WHERE id = ?;`, [Object.values(obj), id])
    //         return row
    //     });
    //     return map
    // }
}