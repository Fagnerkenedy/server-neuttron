const mysql = require('mysql2/promise')
const path = require('path')
const dbConfig = require('../../database/index')
const crypto = require('crypto');
const mercadopago = require('mercadopago');
const { createPermissions, createProfilesPermissions, deleteProfilesPermissions } = require('../settings data/createPermissions');
const dataPermissionsPlanPro = require('./dataPermissionsPlanPro.json')

mercadopago.configure({
    access_token: process.env.ACCESS_TOKEN_MERCADO_PAGO,
});

module.exports = {
    payment: async (req, res) => {
        let connection
        try {
            console.log("received notifications: ", req)
            console.log("process.env.ACCESS_TOKEN_MERCADO_PAGO: ", process.env.ACCESS_TOKEN_MERCADO_PAGO)

            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });


            const response = await mercadopago.payment.get(req.body.resource);
            console.log("response Payment: ", response.response.payer);

            if (response.hasOwnProperty("response") && response.response.status === "approved") {
                const payer = response.response.payer;

                if (payer.hasOwnProperty("email")) {
                    const email = payer.email;
                    console.log("Email do pagador: ", email);
                }

                if (payer.identification.type === "CPF") {
                    const cpf = payer.identification.number.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4_');
                    console.log("CPF retorno: ", cpf);

                    const sql = `SELECT orgId FROM users WHERE CPF = '${cpf}';`
                    console.log("sql: ", sql)
                    const [orgId] = await connectionNeuttron.execute(sql);
                    console.log("orgID; ", orgId[0].orgId)
                    if (orgId.length > 0) {
                        const connection = await mysql.createConnection({ ...dbConfig, database: `org${orgId[0].orgId}` });
                        const insertDataPermissions = await createPermissions(req = { params: { org: `org${orgId[0].orgId}` }, body: dataPermissionsPlanPro });
                        const [idProfiles] = await connection.execute(`SELECT id FROM profiles;`);

                        for (const profile of idProfiles) {
                            for (const id_permission of insertDataPermissions) {
                                const req = {
                                    params: { org: `org${orgId[0].orgId}` },
                                    body: {
                                        id_profile: profile.id,
                                        id_permission: id_permission
                                    }
                                };
                                await createProfilesPermissions(req);
                            }
                        }
                        const deletePermissions = await deleteProfilesPermissions(req = { params: { org: `org${orgId[0].orgId}` } });

                        const gerarHash = (dados) => {
                            const dadosComTimestamp = dados + Date.now().toString();
                            const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                            return hash.substring(0, 19)
                        }
                        const subscription_id = gerarHash(JSON.stringify({ orgId: orgId[0].orgId }));
                        
                        const plans = {
                            // "Plano_Profissional_Teste_1_Usuário": 2,
                            "Plano_Profissional_Anual_1_Usuario": 1,
                            "PROFISSIONAL_MENSAL": 1,
                            "PROFISSIONAL_MENSAL_2_USUARIOS": 2,
                            "PROFISSIONAL_MENSAL_3_USUARIOS": 3,
                            "PROFISSIONAL_MENSAL_4_USUARIOS": 4,
                            "PROFISSIONAL_MENSAL_5_USUARIOS": 5,
                            "PROFISSIONAL_MENSAL_6_USUARIOS": 6,
                            "PROFISSIONAL_MENSAL_7_USUARIOS": 7,
                            "PROFISSIONAL_MENSAL_8_USUARIOS": 8,
                            "PROFISSIONAL_MENSAL_9_USUARIOS": 9,
                            "PROFISSIONAL_MENSAL_10_USUARIOS": 10,
                        };
                        
                        const users = plans[response.response.external_reference] || 1                        

                        const [subscriptions] = await connectionNeuttron.execute(`SELECT * FROM subscriptions WHERE orgId = ?;`, [ orgId[0].orgId ]);
                        if (subscriptions.length > 0) {
                            const [subscriptions] = await connectionNeuttron.execute(`UPDATE subscriptions SET id = ?, name = ?, external_reference = ?, users = ?, active_users = ? WHERE orgId = ?;`, [subscription_id, response.response.description, response.response.external_reference, users, 1, orgId[0].orgId]);
                        } else {
                            const [subscriptions] = await connectionNeuttron.execute(`INSERT INTO subscriptions SET id = ?, orgId = ?, name = ?, external_reference = ?, users = ?, active_users = ?;`, [subscription_id, orgId[0].orgId, response.response.description, response.response.external_reference, users, 1]);
                        }

                        console.log("deletePermissions: ", deletePermissions);
                        console.log("Permissões atualizadas.");
                    }
                }
            }

            res.status(200).json({ success: true, message: "notification received" });
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