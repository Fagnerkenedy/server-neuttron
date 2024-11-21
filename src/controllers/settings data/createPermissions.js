const mysql = require('mysql2/promise')
const dbConfig = require('../../database/index')

module.exports = {
    createPermissions: async (req, res) => {
        let connection
        try {
            const orgId = req.params.org
            let permissions = req.body
            if (!Array.isArray(permissions)) {
                permissions = [permissions]
            }
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const insertPromises = permissions.map(async (permission) => {
                const { action, subject } = permission
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
                return insertId
            })
            const insertResults = await Promise.all(insertPromises);

            await connection.commit();
            return insertResults

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
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
            return insertId

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
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
            // const id_profile = req.params.id_profile
            // const id_permission = req.params.id_permission
            connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            await connection.beginTransaction();

            const [idPermissionCheckout] = await connection.execute(
                "SELECT id FROM permissions WHERE action = 'read' AND subject = 'checkout';"
            );

            const [fetchProfilePermission] = await connection.execute(
                'DELETE FROM profiles_permissions WHERE id_permission = ?;',
                [idPermissionCheckout[0].id]
            );

            await connection.commit();
            return fetchProfilePermission

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}