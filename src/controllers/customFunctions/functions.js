const mysql = require('mysql2/promise');
const dbConfig = require('../../database/index')
const crypto = require('crypto');
const nodemailer = require('nodemailer')
const PDFDocument = require('pdfkit');
const fs = require('fs');

module.exports = {
    getRecordById: async (module, id, connection) => {
        try {
            const [row] = await connection.execute(`SELECT * FROM ${module} WHERE id = ?;`, [id])

            return row[0]
        } catch (error) {
            console.log("Erro ao buscar o registro:", error);
            throw error; // Rejeita a promessa com o erro
        }
    },
    updateRecord: async (module, id, map, connection) => {
        try {
            // if (!Array.isArray(map)) {
            //     map = [map];
            // }

            // for (const obj in map) {
            //     const columns = Object.keys(obj).map(key => `${key} = ?`).join(', ');
            //     const values = Object.values(obj);
            //     console.log(`UPDATE ${module} SET ${columns} WHERE id = ?;`, [...values, id]);
            //     const [row] = await connection.execute(`UPDATE ${module} SET ${columns} WHERE id = ?;`, [...values, id]);
            //     console.log("Resultado da query:", row);
            // }

            for (const key in map) {
                console.log("Map: ",map)
                console.log("Key: ",key)
                console.log("id: ",id)
                if (map.hasOwnProperty(key)) {
                    const columns = `${key} = ?`;
                    const values = [map[key]];
                    console.log(`UPDATE ${module} SET ${columns} WHERE id = ?;`, [...values, id]);
                    const [row] = await connection.execute(`UPDATE ${module} SET ${columns} WHERE id = ?;`, [...values, id]);
                    console.log("Resultado da query:", row);
                }
            }
            

            return map;
        } catch (error) {
            console.log("Erro ao atualizar o registro:", error);
            throw error; // Rejeita a promessa com o erro
        }
    },

    createRecord: async (module, map, orgId, connection) => {
        try {

            const gerarHash = (dados) => {
                const dadosComTimestamp = dados + Date.now().toString();
                const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
                return hash.substring(0, 19)
            }
            const record_id = gerarHash(JSON.stringify({ orgId, module, map }));
            const columns = Object.keys(map).join(', ');
            const placeholders = Object.keys(map).map(() => '?').join(', ');
            const values = Object.values(map).map(value => value === undefined ? null : value);
            console.log(`INSERT INTO ${module} (id, ${columns}) VALUES (?, ${placeholders});`);
            const [row] = await connection.execute(`INSERT INTO ${module} (id, ${columns}) VALUES (?, ${placeholders});`,[record_id, ...values] );
            console.log("Resultado da query:", row);
            // map.push(record_id)
            return { record_id }
        } catch (error) {
            console.log("Erro ao criar o registro:", error);
            throw error;
        }
    },

    get: (obj, path, defaultValue = "") => {
        if (!obj || typeof path !== 'string') {
            return defaultValue;
        }

        const pathArray = path.split(/[\.\[\]\'\"]/).filter(Boolean);

        return pathArray.reduce((acc, key) => {
            if (acc && acc[key] !== undefined) {
                return acc[key];
            }
            return defaultValue;
        }, obj);
    },

    today: () => {
        return new Date()
    },

    sendEmail: async (emailHeader) => {
        const transporter = nodemailer.createTransport({
            host: process.env.NODEMAILER_SMTP,
            port: process.env.NODEMAILER_PORT,
            secure: true,
            auth: {
                user: process.env.NODEMAILER_USER,
                pass: process.env.NODEMAILER_PASS
            },
            tls: {
                ciphers: 'SSLv3'
            }
        })
    
        transporter.sendMail(emailHeader)
        .then(info => {
            return({ success: true, message: info })
        }).catch(error => {
            return({ success: false, message: error })
        })
    },

    generatePDF: (text) => {
        const filePath = `./pdfs/${text.substring(0, 10)}.pdf`
        const pdf = new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);
    
            doc.pipe(stream);
    
            doc.fontSize(12).text(text, { align: 'left' });
    
            doc.end();
    
            stream.on('finish', () => resolve(filePath));
            stream.on('error', (err) => reject(err));
        });
        return { pdf, filePath }
    }
    

    // updateRecordById: async (module, id, map, connection) => {
    //     map.forEach(async obj => {
    //         const [row] = await connection.execute(`UPDATE ${module} SET ${Object.keys(obj)} = ? WHERE id = ?;`, [Object.values(obj), id])
    //         return row
    //     });
    //     return map
    // }
}