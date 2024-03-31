const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')

module.exports = {
    sampleData: async (orgId) => {
        const connection = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });
        const queryClientes = `CREATE TABLE IF NOT EXISTS Clientes (
            id VARCHAR(19) PRIMARY KEY,
            related_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        const queryProdutos = `CREATE TABLE IF NOT EXISTS Produtos (
            id VARCHAR(19) PRIMARY KEY,
            related_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        const queryPedidos = `CREATE TABLE IF NOT EXISTS Pedidos (
            id VARCHAR(19) PRIMARY KEY,
            related_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        const queryModules = `CREATE TABLE IF NOT EXISTS modules (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255),
            perfil VARCHAR(2000),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await connection.execute(queryModules);
        await connection.execute('INSERT INTO modules (name) VALUES ("Clientes"),("Pedidos");');

        const [resultClientes] = await connection.execute(queryClientes);
        const [resultProdutos] = await connection.execute(queryProdutos);
        const [resultPedidos] = await connection.execute(queryPedidos);

        const query = `CREATE TABLE IF NOT EXISTS fields (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255),
            api_name VARCHAR(255),
            type VARCHAR(255),
            related_module VARCHAR(255),
            related_id VARCHAR(255),
            module VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await connection.execute(query);

    }
}