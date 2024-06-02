
const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')

const forof = async (map) => {
    const connection = await mysql.createConnection({ ...dbConfig, database: 'org41451399' });
    const module = 'Pedidos'
    const id = '25959ac491e6aba5e27'
    for (const obj of map) {
        const columns = Object.keys(obj).map(key => `${key} = ?`).join(', ');
        const values = Object.values(obj);
        console.log("columns",columns)
        console.log("values",values)
        const [row] = await connection.execute(`UPDATE ${module} SET ${columns} WHERE id = ?;`, [...values, id]);
    }
}
map = [{ valor_unit_rio: 80 }, { valor_total: 160 }]

forof(map)