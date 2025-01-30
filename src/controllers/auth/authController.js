require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const authConfig = require('../../config/auth.json')
const {sampleData} = require('../sample data/index')
const {settingsData} = require('../settings data/index')
const {chatsData} = require('../chats data/index')
const nodemailer = require('nodemailer')

module.exports = {
    registerOrg: async (req, res) => {
        console.log("Registrando organização e usuário administrador")
        const { empresa, email, CPF, name, phone, password } = req.body

        try {
            const connection = await mysql.createConnection(dbConfig);
            const gerarHashOrg = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                const hashReduzido = hash.substring(0, 8);
                // Convertendo o hash hexadecimal reduzido para um número inteiro
                const numeroInteiro = parseInt(hashReduzido, 16);
                const orgId = numeroInteiro % 100000000;
                return orgId;
            }
            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }
            const orgId = gerarHashOrg(JSON.stringify({ empresa }));
            const uuid = gerarHash(JSON.stringify({ empresa, name, email, phone }));
            const subscription_id = gerarHash(JSON.stringify({ orgId, empresa, name, email, phone }));

            await connection.execute(`CREATE DATABASE IF NOT EXISTS org${orgId};`);
            await connection.end();
            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });

            const subscriptionTable = await connectionNeuttron.execute(`CREATE TABLE IF NOT EXISTS subscriptions (
                id VARCHAR(255) PRIMARY KEY,
                orgId VARCHAR(255),
                name VARCHAR(255),
                external_reference VARCHAR(255),
                users VARCHAR(255),
                active_users VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`);
            
            const connection2 = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });
            const organizationTable = await connection2.execute(`CREATE TABLE IF NOT EXISTS organizations (
                orgId VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`);

            const userTable = await connection2.execute(`CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(19) PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                password VARCHAR(255),
                phone VARCHAR(255),
                orgId VARCHAR(255),
                dark_mode BOOLEAN,
                perfil VARCHAR(255),
                open_tour BOOLEAN DEFAULT true,
                modules_tour BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orgId) REFERENCES organizations(orgId)
            );`);

            await sampleData(orgId)

            const user_id = gerarHash(JSON.stringify({ empresa, name, email, phone }));
            const hashedPassword = await bcrypt.hash(password, 10);

            await settingsData(orgId, user_id)

            await chatsData(orgId)
            
            const org = await connection2.execute(`INSERT INTO organizations SET orgId = ?, name = ?, email = ?, phone = ?;`, [orgId, empresa, email, phone]);
            const user = await connection2.execute(`INSERT INTO users SET id = ?, orgId = ?, name = ?, email = ?, phone = ?, password = ?, dark_mode = ?, perfil = 'Administrador', open_tour = true;`, [user_id, orgId, name, email, phone, hashedPassword, false]);
            
            await connection2.end();
            user.password = undefined
            
            await connectionNeuttron.execute(`INSERT INTO subscriptions SET id = ?, orgId = ?, name = ?, external_reference = ?, users = ?, active_users = ?;`, [subscription_id, orgId, "Free", "free", 2, 1]);
            await connectionNeuttron.execute(`INSERT INTO users SET id = ?, name = ?, email = ?, CPF = ?, phone = ?, organization = ?, orgId = ?;`, [uuid, name, email, CPF, phone, empresa, orgId]);
            await connectionNeuttron.end();
            
            return res.status(200).json({ success: true, message: 'User and Organization Created Successfuly!', organizationTable, userTable, org, user, email, uuid })

        } catch (err) {
            console.log('Error Creating User or Organization', err)
            return res.status(400).json({ success: false, message: 'Error Creating User or Organization', error: err })
        }
    },

    registerPassword: async (req, res) => {
        const orgId = req.params.org
        const id = req.params.id
        const { password } = req.body
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: orgId });
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await connection.execute('UPDATE users SET password = ? WHERE id = ?',
                [ hashedPassword, id]);
            await connection.end();
            return res.status(200).json({ success: true, message: 'User Updated Successfuly', data: user })
        } catch (err) {
            console.log('Error Updating User', err)
            return res.status(400).json({ success: false, message: 'Error Updating User', error: err })
        }
    },

    registerUser: async (req, res) => {
        console.log("Registrando usuário")
        const orgId = req.params.orgId
        const { email, name, phone, password } = req.body
        try {
            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });

            await connectionNeuttron.execute(`INSERT INTO users SET name = ?, email = ?, phone = ?, orgId = ?;`, [name, email, phone, orgId]);
            await connectionNeuttron.end();

            const connection2 = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });

            const userTable = await connection2.execute(`CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(19) PRIMARY KEY,
                name VARCHAR(255),
                last_name VARCHAR(255),
                email VARCHAR(255),
                password VARCHAR(255),
                phone VARCHAR(255),
                orgId VARCHAR(255),
                dark_mode BOOLEAN,
                perfil VARCHAR(255),
                open_tour BOOLEAN DEFAULT true,
                modules_tour BOOLEAN DEFAULT true;
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orgId) REFERENCES organizations(orgId)
            );`);

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }

            const user_id = gerarHash(JSON.stringify({ name, email, phone }));
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await connection2.execute(`INSERT INTO users SET id = ?, orgId = ?, name = ?, email = ?, phone = ?, password = ?, dark_mode = ?, open_tour = true;`, [user_id, orgId, name, email, phone, hashedPassword, false]);

            await connection2.end();
            user.password = undefined

            return res.status(200).json({ success: true, message: 'User Created Successfuly!', user })

        } catch (err) {
            console.log('Error Creating User', err)
            return res.status(400).json({ success: false, message: 'Error Creating User', error: err })
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                return res.status(400).json({ success: false, message: "missing_email_or_password" });
            }

            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
            const [rows] = await connectionNeuttron.execute('SELECT orgId, verificado FROM users WHERE email = ?;', [email])
            await connectionNeuttron.end();

            const userNeuttron = rows[0];

            if (!userNeuttron)
                return res.status(200).json({ success: false, message: 'user_not_found' })

            const connection = await mysql.createConnection({ ...dbConfig, database: `org${userNeuttron.orgId}` });
            
            const [row] = await connection.execute('SELECT email, password, dark_mode, name, id FROM users WHERE email = ?;', [email])
            // await settingsData(userNeuttron.orgId)
            // await settingsData(userNeuttron.orgId, row[0].id)
            await connection.end();

            const user = row[0];

            if (!user)
                return res.status(200).json({ success: false, message: 'user_not_found' })

            if(userNeuttron.verificado != true)
                return res.status(200).json({ success: false, message: 'user_not_verified', user })

            const match = await bcrypt.compare(password, user.password);
            const org = `org${userNeuttron.orgId}`
            if (match) {
                user.password = undefined;
                const token = jwt.sign({ orgId: user.orgId, userId: user.id }, authConfig.secret, {
                    expiresIn: 604800,
                });

                // user.orgId = undefined
                return res.status(200).json({ success: true, message: 'Sucesso ao fazer login', user, token, org })
            } else {
                return res.status(200).json({ success: false, message: "invalid_password" })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: "Internal server error", error });
        }
    },

    update: async (req, res) => {
        const uuid = req.params.uuid
        const { username, password, email } = req.body
        try {
            const connection = await mysql.createConnection(dbConfig);
            const user = await connection.execute('UPDATE users SET username = ?, password = ?, email = ? WHERE uuid = ?',
                [username, password, email, uuid]);
            await connection.end();
            return res.status(200).json({ success: true, message: 'User Updated Successfuly', data: user })
        } catch (err) {
            console.log('Error Updating User', err)
            return res.status(400).json({ success: false, message: 'Error Updating User', error: err })
        }
    },

    updateDarkMode: async (req, res) => {
        const orgId = req.params.org
        const { dark_mode, email } = req.body
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const user = await connection.execute('UPDATE users SET dark_mode = ? WHERE email = ?',
                [dark_mode, email]);
            await connection.end();
            return res.status(200).json({ success: true, message: 'User Dark Mode Updated Successfuly', data: user })
        } catch (err) {
            console.log('Error Updating User', err)
            return res.status(400).json({ success: false, message: 'Error Updating User Dark Mode', error: err })
        }
    },

    getOpenTour: async (req, res) => {
        const orgId = req.params.org
        const userId = req.params.userId
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const [tour] = await connection.execute('SELECT open_tour FROM users WHERE id = ?', [ userId ]);
            await connection.end();
            return res.status(200).json({ success: true, message: 'Tour Successfuly Recovered', data: tour })
        } catch (err) {
            console.log('Error Recovering Tour', err)
            return res.status(400).json({ success: false, message: 'Error Recovering Tour', error: err })
        }
    },

    updateOpenTour: async (req, res) => {
        const orgId = req.params.org
        const userId = req.params.userId
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const [user] = await connection.execute('UPDATE users SET open_tour = false WHERE id = ?', [ userId ]);
            let openTour = ''
            if(user.affectedRows > 0) openTour = false
            await connection.end();
            return res.status(200).json({ success: true, message: 'User Tour Updated Successfuly', openTour: openTour })
        } catch (err) {
            console.log('Error Updating User', err)
            return res.status(400).json({ success: false, message: 'Error Updating User Tour', error: err })
        }
    },

    getModulesTour: async (req, res) => {
        const orgId = req.params.org
        const userId = req.params.userId
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const [tour] = await connection.execute('SELECT modules_tour FROM users WHERE id = ?', [ userId ]);
            await connection.end();
            return res.status(200).json({ success: true, message: 'Tour Successfuly Recovered', data: tour })
        } catch (err) {
            console.log('Error Recovering Tour', err)
            return res.status(400).json({ success: false, message: 'Error Recovering Tour', error: err })
        }
    },

    updateModulesTour: async (req, res) => {
        const orgId = req.params.org
        const userId = req.params.userId
        try {
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const [user] = await connection.execute('UPDATE users SET modules_tour = false WHERE id = ?', [ userId ]);
            let modulesTour = ''
            if(user.affectedRows > 0) modulesTour = false
            await connection.end();
            return res.status(200).json({ success: true, message: 'Modules Tour Updated Successfuly', modulesTour: modulesTour })
        } catch (err) {
            console.log('Error Updating Modules Tour', err)
            return res.status(400).json({ success: false, message: 'Error Updating Modules Tour', error: err })
        }
    },

    checkEmail: async (req, res) => {
        const { email } = req.body
        try {
            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
            const [user] = await connectionNeuttron.execute('SELECT email FROM users WHERE email = ?',
                [ email ]);
            await connectionNeuttron.end();
            if (user.length > 0) {
                return res.status(200).json({ success: false, message: 'Email Already Exists!' })
            }
            
            return res.status(200).json({ success: true, message: 'E-mail Not Found!' })
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Error Searching E-mail', error: error })
        }
    },

    subscriptions: async (req, res) => {
        const orgId = req.params.org
        try {
            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
            const [subscriptions] = await connectionNeuttron.execute('SELECT users, active_users FROM subscriptions WHERE orgId = ?;',[ orgId.slice(3) ]);
            await connectionNeuttron.end();
            
            return res.status(200).json({ success: true, message: 'Subscriptions', subscriptions })
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Error Searching Subscriptions', error: error })
        }
    },

    sendMailConfirmation: async (req, res) => {
        const transporter = nodemailer.createTransport({
            host: process.env.NODEMAILER_SMTP,
            port: process.env.NODEMAILER_PORT,
            secure: true,
            auth: {
                user: process.env.NODEMAILER_USER, 
                pass: process.env.NODEMAILER_PASS
            },
            tls: {
                ciphers:'SSLv3'
            }
        })

        transporter.sendMail({
            from: process.env.NODEMAILER_USER,
            to: req.body.email,
            replyTo: process.env.NODEMAILER_USER,
            subject: "Neuttron - Confirmação de cadastro",
            text: "Obrigado por se cadastrar no nosso sistema, por favor confirme seu email clicando no link: "+process.env.FRONT_URL+"/cadastro/confirmacao/" + req.body.uuid,
        }).then(info => {
            res.status(200).json({ success: true, message: info })
        }).catch(error => {
            res.status(400).json({ success: false, message: error })
        })
    },

    confirmation: async (req, res) => {
        console.log(req.body)
        const { uuid } = req.body
        try {
            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
            const [user] = await connectionNeuttron.execute('SELECT * FROM users WHERE id = ?',[ uuid ])

            if (user.length == 0)
                return res.status(200).json({ success: false, message: 'user_not_found' })

            if(user.verificado)
                return res.status(200).json({ success: false, message: 'user_already_confirmed' })

            const [userConfirmed] = await connectionNeuttron.execute('UPDATE users SET verificado = true WHERE id = ?',[ uuid ])
            
            await connectionNeuttron.end();
            return  res.status(200).json({ success: true, message: 'user_confirmed' })
        } catch (error) {
            res.status(400).json({ error })
        }

    },

    deleteAccount: async (req, res) => {
        const { email, orgId } = req.body
        try {
            const connection = await mysql.createConnection({ ...dbConfig });
            await connection.execute(`DROP DATABASE IF EXISTS ${orgId};`);
            await connection.end();

            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });
            const orgNumber = orgId.slice(3)
            await connectionNeuttron.execute(`DELETE FROM users WHERE orgId = '${orgNumber}';`);
            await connectionNeuttron.end();
            return  res.status(200).json({ success: true, message: 'Conta excluída com sucesso!' })
        } catch (error) {
            res.status(400).json({ error })
        }
    }

    // checkSiteName: async (req, res) => {
    //     const { sitename } = req.body
    //     try {
    //         if( await User.findOne({ sitename }))
    //             return res.status(200).json({ success: true, message: 'Sitename Already Exists!' })
            
    //         return res.status(400).json({ success: false, message: 'Sitename Not Found!' })
    //     } catch (error) {
    //         return res.status(400).json({ success: false, message: 'Error Searching Sitename', error: err })
    //     }
    // },

    

    // getUser: async (req, res) => {
    //     const { uuid } = req.params
    //     try {
            
    //         const user = await User.findOne({ uuid });

    //         if(user){
    //             user.password = undefined
    //             return res.status(200).json({ success: true, message: 'usuario_encontrado', data: user })
    //         }

    //     }catch (err) {
    //         console.log('Error Creating User', err)
    //         return res.status(400).json({ success: false, message: 'Error Creating User', error: err })
    //     }
    // },

}