const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const { createFields } = require('./createFields')
const fieldsLeads = require('./fieldsLeads.json')
const fieldsEmpresas = require('./fieldsEmpresas.json')
const fieldsContatos = require('./fieldsContatos.json')
const fieldsNegocios = require('./fieldsNegocios.json')
const fieldsClientes = require('./fieldsClientes.json')
const fieldsProdutos = require('./fieldsProdutos.json')
const fieldsPedidos = require('./fieldsPedidos.json')
const { insertData } = require('./insertData')
const dataClientes = require('./dataClientes.json')
const dataProdutos = require('./dataProdutos.json');
const { createSectionFields } = require('../../utility/functions');

module.exports = {
    sampleData: async (orgId) => {
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });
            const queryLeads = `CREATE TABLE IF NOT EXISTS Leads (
                id VARCHAR(19) PRIMARY KEY,
                related_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            const queryEmpresas = `CREATE TABLE IF NOT EXISTS Empresas (
                id VARCHAR(19) PRIMARY KEY,
                related_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            const queryContatos = `CREATE TABLE IF NOT EXISTS Contatos (
                id VARCHAR(19) PRIMARY KEY,
                related_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            const queryNegocios = `CREATE TABLE IF NOT EXISTS Negocios (
                id VARCHAR(19) PRIMARY KEY,
                related_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            // const queryClientes = `CREATE TABLE IF NOT EXISTS Clientes (
            // id VARCHAR(19) PRIMARY KEY,
            // related_id VARCHAR(255),
            // created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            // updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            // )`;
            // const queryProdutos = `CREATE TABLE IF NOT EXISTS Produtos (
            // id VARCHAR(19) PRIMARY KEY,
            // related_id VARCHAR(255),
            // created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            // updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            // )`;
            // const queryPedidos = `CREATE TABLE IF NOT EXISTS Pedidos (
            // id VARCHAR(19) PRIMARY KEY,
            // related_id VARCHAR(255),
            // created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            // updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            // )`;
            const queryModules = `CREATE TABLE IF NOT EXISTS modules (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255),
            api_name VARCHAR(255),
            perfil VARCHAR(2000),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            await connection.execute(queryModules);
            await connection.execute('INSERT INTO modules (name, api_name) VALUES ("Leads", "Leads"), ("Empresas", "Empresas"), ("Contatos", "Contatos"), ("Negocios", "Negocios");');

            const [resultLeads] = await connection.execute(queryLeads);
            const [resultEmpresas] = await connection.execute(queryEmpresas);
            const [resultContatos] = await connection.execute(queryContatos);
            const [resultNegocios] = await connection.execute(queryNegocios);
            // const [resultClientes] = await connection.execute(queryClientes);
            // const [resultProdutos] = await connection.execute(queryProdutos);
            // const [resultPedidos] = await connection.execute(queryPedidos);


            // const createFieldsClientes = await createFields(fieldsClientes, connection, orgId, 'Clientes')
            // const createFieldsProdutos = await createFields(fieldsProdutos, connection, orgId, 'Produtos')
            // const createFieldsPedidos = await createFields(fieldsPedidos, connection, orgId, 'Pedidos')

            const createFieldsLeads = await createSectionFields(fieldsLeads, connection, orgId, 'Leads')
            const createFieldsEmpresas = await createSectionFields(fieldsEmpresas, connection, orgId, 'Empresas')
            const createFieldsContatos = await createSectionFields(fieldsContatos, connection, orgId, 'Contatos')
            const createFieldsNegocios = await createSectionFields(fieldsNegocios, connection, orgId, 'Negocios')
            // const createFieldsClientes = await createSectionFields(fieldsClientes, connection, orgId, 'Clientes')
            // const createFieldsProdutos = await createSectionFields(fieldsProdutos, connection, orgId, 'Produtos')
            // const createFieldsPedidos = await createSectionFields(fieldsPedidos, connection, orgId, 'Pedidos')

            // const insertDataClientes = await insertData(dataClientes, connection, orgId, 'Clientes')
            // const insertDataProdutos = await insertData(dataProdutos, connection, orgId, 'Produtos')

            await connection.end();
        } catch (error) {
            console.error("Erro ao criar tabelas e inserir dados:", error);
            throw error;
        }
    }
}