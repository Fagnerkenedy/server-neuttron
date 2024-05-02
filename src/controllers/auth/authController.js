require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const authConfig = require('../../config/auth.json')
const {sampleData} = require('../sample data/index')

module.exports = {
    registerOrg: async (req, res) => {
        console.log("Registrando organização e usuário administrador")
        const { empresa, email, name, phone, password } = req.body
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
            const orgId = gerarHashOrg(JSON.stringify({ empresa }));

            await connection.execute(`CREATE DATABASE IF NOT EXISTS org${orgId};`);
            await connection.end();
            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });

            await connectionNeuttron.execute(`INSERT INTO users SET name = ?, email = ?, phone = ?, organization = ?, orgId = ?;`, [name, email, phone, empresa, orgId]);
            await connectionNeuttron.end();

            const connection2 = await mysql.createConnection({ ...dbConfig, database: `org${orgId}` });
            const organizationTable = await connection2.execute(`CREATE TABLE IF NOT EXISTS organizations (
                orgId VARCHAR(8) PRIMARY KEY,
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
                orgId VARCHAR(8),
                dark_mode BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orgId) REFERENCES organizations(orgId)
            );`);

            await sampleData(orgId)

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }

            const user_id = gerarHash(JSON.stringify({ empresa, name, email, phone }));
            const hashedPassword = await bcrypt.hash(password, 10);

            const org = await connection2.execute(`INSERT INTO organizations SET orgId = ?, name = ?, email = ?, phone = ?;`, [orgId, empresa, email, phone]);
            const user = await connection2.execute(`INSERT INTO users SET id = ?, orgId = ?, name = ?, email = ?, phone = ?, password = ?, dark_mode = ?;`, [user_id, orgId, name, email, phone, hashedPassword, false]);

            await connection2.end();
            user.password = undefined

            return res.status(200).json({ success: true, message: 'User and Organization Created Successfuly!', organizationTable, userTable, org, user })

        } catch (err) {
            console.log('Error Creating User or Organization', err)
            return res.status(400).json({ success: false, message: 'Error Creating User or Organization', error: err })
        }
    },

    registerUser: async (req, res) => {
        console.log("Registrando usuário")
        const orgId = req.params.orgId
        const { empresa, email, name, phone, password } = req.body
        try {
            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: process.env.DB_NAME });

            await connectionNeuttron.execute(`INSERT INTO users SET name = ?, email = ?, phone = ?, organization = ?, orgId = ?;`, [name, email, phone, empresa, orgId]);
            await connectionNeuttron.end();

            const connection2 = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const organizationTable = await connection2.execute(`CREATE TABLE IF NOT EXISTS organizations (
                orgId VARCHAR(8) PRIMARY KEY,
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
                orgId VARCHAR(8),
                dark_mode BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orgId) REFERENCES organizations(orgId)
            );`);

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }

            const user_id = gerarHash(JSON.stringify({ empresa, name, email, phone }));
            const hashedPassword = await bcrypt.hash(password, 10);

            const org = await connection2.execute(`INSERT INTO organizations SET orgId = ?, name = ?, email = ?, phone = ?;`, [orgId, empresa, email, phone]);
            const user = await connection2.execute(`INSERT INTO users SET id = ?, orgId = ?, name = ?, email = ?, phone = ?, password = ?, dark_mode = ?;`, [user_id, orgId, name, email, phone, hashedPassword, false]);

            await connection2.end();
            user.password = undefined

            return res.status(200).json({ success: true, message: 'User Created Successfuly!', organizationTable, userTable, org, user })

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

            const connectionNeuttron = await mysql.createConnection({ ...dbConfig, database: "neuttron_v2" });
            const [rows] = await connectionNeuttron.execute('SELECT orgId FROM users WHERE email = ?;', [email])
            await connectionNeuttron.end();

            const userNeuttron = rows[0];

            if (!userNeuttron)
                return res.status(200).json({ success: false, message: 'user_not_found' })

            const connection = await mysql.createConnection({ ...dbConfig, database: `org${userNeuttron.orgId}` });
            const [row] = await connection.execute('SELECT email, password, dark_mode, name FROM users WHERE email = ?;', [email])
            await connection.end();

            const user = row[0];

            if (!user)
                return res.status(200).json({ success: false, message: 'user_not_found' })

            const match = await bcrypt.compare(password, user.password);
            const org = `org${userNeuttron.orgId}`
            if (match) {
                user.password = undefined;
                const token = jwt.sign({ orgId: user.orgId }, authConfig.secret, {
                    expiresIn: 604800,
                });

                // user.orgId = undefined
                return res.status(200).json({ success: true, message: 'Sucesso ao fazer login', user, token, org })
            } else {
                return res.status(200).json({ success: false, message: "invalid_password" })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    },

    //
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








    /*checkSiteName: async (req, res) => {
        const { sitename } = req.body
        try {
            if( await User.findOne({ sitename }))
                return res.status(200).json({ success: true, message: 'Sitename Already Exists!' })
            
            return res.status(400).json({ success: false, message: 'Sitename Not Found!' })
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Error Searching Sitename', error: err })
        }
    },

    checkEmail: async (req, res) => {
        const { email } = req.body
        try {
            if(await User.findOne({ email }))
                return res.status(200).json({ success: false, message: 'Email Already Exists!' })
            
            return res.status(200).json({ success: true, message: 'E-mail Not Found!' })
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Error Searching E-mail', error: err })
        }
    },

    sendMailConfirmation: async (req, res) => {
        console.log(req)
        const transporter = nodemailer.createTransport({
            host: process.env.NODEMAILER_SMTP,
            port: process.env.NODEMAILER_PORT,
            secure: false,
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
            subject: "Photos2You - Confirmação de cadastro",
            text: "Obrigado por se cadastrar no nosso sistema, por favor confirme seu email clicando no link: "+process.env.FRONT_URL+"/cadastro/confirmacao/" + req.body.uuid,
        }).then(info => {
            res.status(200).json({ success: true, message: info })
        }).catch(error => {
            res.status(400).json({ success: false, message: error })
        })

    },

    confirmation: async (req, res) => {
        console.log(req.body)
        const { uuid } = req.body;

        try {

            const user = await User.findOne({ uuid });
            if(!user)
                return res.status(200).json({ success: false, message: 'user_not_found' })

            if(user.verificado)
                return res.status(200).json({ success: false, message: 'user_already_confirmed' })

            user.verificado = true
            await user.save()
            res.status(200).json({ success:true, message: 'user_confirmed' })
            
        } catch (error) {
            res.status(400).json({ error })
        }

    },

    getUser: async (req, res) => {
        const { uuid } = req.params
        try {
            
            const user = await User.findOne({ uuid });

            if(user){
                user.password = undefined
                return res.status(200).json({ success: true, message: 'usuario_encontrado', data: user })
            }

        }catch (err) {
            console.log('Error Creating User', err)
            return res.status(400).json({ success: false, message: 'Error Creating User', error: err })
        }
    },*/

}