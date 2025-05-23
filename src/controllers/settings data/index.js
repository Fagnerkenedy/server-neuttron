const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const {createFields} = require('../settings data/createFields')
const {createFieldsProfiles} = require('../settings data/createFieldsProfiles')
const fieldsUsers = require('./fieldsUsers.json')
const fieldsProfiles = require('./fieldsProfiles.json')
const fieldsKanban = require('./fieldsKanban.json')
const fieldsFunctions = require('./fieldsFunctions.json')
const fieldsCharts = require('./fieldsCharts.json')
const {insertData} = require('./insertData')
const dataProfiles = require('./dataProfiles.json')
const dataPermissions = require('./dataPermissions.json');
const dataFunctions = require('./dataFunctions.json')
const dataCharts = require('./dataCharts.json')
const dataKanban = require('./dataKanban.json')
const { createProfilesPermissions, createPermissions } = require('./createPermissions');
const { createSectionFields } = require('../../utility/functions');

module.exports = {
    settingsData: async (orgId, userId) => {
        let connection
        try {
            connection = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });

            await connection.beginTransaction();
            const queryCharts = `CREATE TABLE IF NOT EXISTS charts (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                query VARCHAR(2000),
                xField VARCHAR(255),
                yField VARCHAR(255),
                type VARCHAR(255)
            )`;
            await connection.execute(queryCharts);
            const queryKanban = `CREATE TABLE IF NOT EXISTS kanban (
                id VARCHAR(19) PRIMARY KEY,
                name VARCHAR(255),
                field VARCHAR(255),
                module VARCHAR(255)
            )`;
            await connection.execute(queryKanban);
            await connection.execute(`CREATE TABLE IF NOT EXISTS profiles (
                id VARCHAR(19) PRIMARY KEY,
                orgId VARCHAR(255),
                perfil VARCHAR(255),
                descri__o TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orgId) REFERENCES organizations(orgId)
            );`);

            // await createFieldsProfiles(fieldsProfiles, connection, `org${orgId}`, 'profiles')
            const insertDataProfiles = await insertData(dataProfiles, connection, `org${orgId}`, 'profiles')
            // await createFields(fieldsUsers, connection, `org${orgId}`, 'users', insertDataProfiles[0].record_id, userId)
            
            await createSectionFields(fieldsKanban, connection, `org${orgId}`, 'kanban')
            await createSectionFields(fieldsProfiles, connection, `org${orgId}`, 'profiles')
            await createSectionFields(fieldsUsers, connection, `org${orgId}`, 'users', insertDataProfiles[0].record_id, userId)

            await connection.execute(`CREATE TABLE IF NOT EXISTS permissions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                action VARCHAR(255),
                subject VARCHAR(255)
            );`);
            const org = orgId

            const insertDataPermissions = await createPermissions(req={ params: { org: `org${org}`}, body: dataPermissions })

            await connection.execute(`CREATE TABLE IF NOT EXISTS profiles_permissions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                id_profile VARCHAR(255),
                id_permission VARCHAR(255)
            );`)

            for(const id_permission of insertDataPermissions) {
                const req = {
                    params: { org: `org${org}`},
                    body: {
                        id_profile: insertDataProfiles[0].record_id,
                        id_permission: id_permission
                    }
                }
                createProfilesPermissions(req)
            }
            await connection.execute(`CREATE TABLE IF NOT EXISTS functions (
                id VARCHAR(255) PRIMARY KEY
            );`)
            // const functionss = await createFieldsProfiles(fieldsFunctions, connection, `org${orgId}`, 'functions')
            const functionss = await createSectionFields(fieldsFunctions, connection, `org${orgId}`, 'functions')
            await createSectionFields(fieldsCharts, connection, `org${orgId}`, 'charts')
            const insertDataFunctions = await insertData(dataFunctions, connection, `org${orgId}`, 'functions')
            const insertDataCharts = await insertData(dataCharts, connection, `org${orgId}`, 'charts')
            const insertDataKanban = await insertData(dataKanban, connection, `org${orgId}`, 'kanban')

            await connection.end();
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            // res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}