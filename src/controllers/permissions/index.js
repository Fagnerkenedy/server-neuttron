const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')

module.exports = {
    // create: async (req, res) => {
    //     let connection
    //     try {
    //         const orgId = req.params.org
    //         const name = req.body.name
    //         const query = req.body.query
    //         const xField = req.body.xField
    //         const yField = req.body.yField
    //         const type = req.body.type

    //         connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
    //         await connection.beginTransaction();
    //         const queryCharts = `CREATE TABLE IF NOT EXISTS charts (
    //             id INT PRIMARY KEY AUTO_INCREMENT,
    //             name VARCHAR(255),
    //             query VARCHAR(2000),
    //             xField VARCHAR(255),
    //             yField VARCHAR(255),
    //             type VARCHAR(255)
    //         )`;
    //         await connection.execute(queryCharts);
    //         const [result] = await connection.execute(
    //             'INSERT INTO charts (name, query, xField, yField, type) VALUES (?, ?, ?, ?, ?);',
    //             [name, query, xField, yField, type]
    //         );

    //         await connection.commit();

    //         res.json({ success: true, message: "Table charts created successfully", result });
    //     } catch (error) {
    //         if (connection) {
    //             await connection.rollback();
    //         }
    //         res.status(500).json({ error: error.message });
    //     } finally {
    //         if (connection) {
    //             await connection.end();
    //         }
    //     }
    // },
    read: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const userId = req.params.userId
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const permissions = await connection.execute(
                `SELECT 
                    permissions.id as id,
                    permissions.action as action, 
                    permissions.subject as subject
                    FROM users
                    JOIN modulos_relacionados on modulos_relacionados.module_id = users.id
                    JOIN profiles_permissions on profiles_permissions.id_profile = modulos_relacionados.related_id
                    JOIN permissions on permissions.id = profiles_permissions.id_permission
                    WHERE users.id = ?;`,
                [userId]
            )

            await connection.commit();
            res.status(200).json({ success: true, message: "Permissions", permissions });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },
    readPermissions: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const profileId = req.params.profileId
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const permissions = await connection.execute(
                `SELECT 
                    permissions.id as id,
                    permissions.action as action, 
                    permissions.subject as subject
                    FROM profiles_permissions
                    JOIN permissions on permissions.id = profiles_permissions.id_permission
                    WHERE profiles_permissions.id_profile = ?;`,
                [profileId]
            )

            await connection.commit();
            res.status(200).json({ success: true, message: "Permissions", permissions });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },
    createPermissions: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const { action, subject } = req.body
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const createTable = await connection.execute(
                `CREATE TABLE IF NOT EXISTS permissions (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    action VARCHAR(255),
                    subject VARCHAR(255)
                );`
            )

            const [searchPermissions] = await connection.execute(
                'SELECT * FROM permissions WHERE action = ? AND subject = ?;',
                [action, subject]
            );

            let insertId
            if (searchPermissions.length === 0) {
                const [insertPermission] = await connection.execute(
                    'INSERT INTO permissions (action, subject) VALUES (?, ?);',
                    [action, subject]
                );
                insertId = insertPermission.insertId
            } else {
                insertId = searchPermissions[0].id
            }
            insertId = searchPermissions[0].id

            await connection.commit();
            res.status(200).json({ success: true, message: "Permissions", insertId });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },
    createProfilesPermissions: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const { id_profile, id_permission } = req.body
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const createTable = await connection.execute(
                `CREATE TABLE IF NOT EXISTS profiles_permissions (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    id_profile VARCHAR(255),
                    id_permission VARCHAR(255)
                );`
            )

            const insertPermission = await connection.execute(
                'INSERT INTO profiles_permissions (id_profile, id_permission) VALUES (?, ?);',
                [id_profile, id_permission]
            );
            const insertId = insertPermission[0].insertId

            await connection.commit();
            res.status(200).json({ success: true, message: "Permissions", insertId });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },
    deleteProfilesPermissions: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            const id_profile = req.params.id_profile
            const id_permission = req.params.id_permission
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const [fetchProfilePermission] = await connection.execute(
                'DELETE FROM profiles_permissions WHERE id_profile = ? AND id_permission = ?;',
                [id_profile, id_permission]
            );

            await connection.commit();
            res.status(200).json({ success: true, message: "Profiles Permissions", fetchProfilePermission });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}