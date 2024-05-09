const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const {createFields} = require('./createFields')
const fieldsClientes = require('./fieldsClientes.json')
const fieldsProdutos = require('./fieldsProdutos.json')
const fieldsPedidos = require('./fieldsPedidos.json')
const {insertData} = require('./insertData')
const dataClientes = require('./dataClientes.json')
const dataProdutos = require('./dataProdutos.json')

module.exports = {
    sampleData: async (orgId) => {
        try {
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
            api_name VARCHAR(255),
            perfil VARCHAR(2000),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            await connection.execute(queryModules);
            await connection.execute('INSERT INTO modules (name, api_name) VALUES ("Clientes", "Clientes"), ("Produtos", "Produtos"), ("Pedidos", "Pedidos");');

            const [resultClientes] = await connection.execute(queryClientes);
            const [resultProdutos] = await connection.execute(queryProdutos);
            const [resultPedidos] = await connection.execute(queryPedidos);


            const createFieldsClientes = await createFields(fieldsClientes, connection, orgId, 'Clientes')
            const createFieldsProdutos = await createFields(fieldsProdutos, connection, orgId, 'Produtos')
            const createFieldsPedidos = await createFields(fieldsPedidos, connection, orgId, 'Pedidos')

            const insertDataClientes = await insertData(dataClientes, connection, orgId, 'Clientes')
            const insertDataProdutos = await insertData(dataProdutos, connection, orgId, 'Produtos')

            await connection.end();
        } catch (error) {
            console.error("Erro ao criar tabelas e inserir dados:", error);
            throw error;
        }
    }
}