const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const dbConfig = require('../../database/index')

module.exports = {
    upload: async (req, res) => {
        try {
            const orgId = req.params.org
            const module = req.params.module
            const api_name = req.body.api_name
            // if (!Array.isArray(body)) {
            //     body = [body];
            // }
            const connection = await mysql.createConnection({ ...dbConfig, database: `${orgId}` });
            const storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, 'uploads/');
                },
                filename: function (req, file, cb) {
                    cb(null, Date.now() + path.extname(file.originalname));
                }
            });
            const upload = multer({ storage: storage });
            upload.single('file'), (req, res) => {
                if (!req.file) {
                    return res.status(400).send('Nenhum arquivo foi enviado.');
                }

                const { filename } = req.file;

                const sql = `INSERT INTO ${module} (${api_name}) VALUES (?);`
                connection.execute(sql, [filename], (err, result) => {
                    if (err) {
                        return res.status(500).send('Erro ao salvar arquivo no banco de dados.');
                    }
                    res.status(200).send('Arquivo enviado e salvo no banco de dados com sucesso.');
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro interno no servidor.');
        }
    }
}