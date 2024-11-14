const crypto = require('crypto')

module.exports = {
    sectionLogs: () => {
        const gerarHash = (dados) => {
            const dadosComTimestamp = dados + Date.now().toString();
            const hash = crypto.createHash('sha256').update(dadosComTimestamp).digest('hex')
            return hash.substring(0, 19)
        }
        const id = gerarHash(JSON.stringify({ section: "Logs" }));
        const id2 = gerarHash(JSON.stringify({ section: "Informações" }));
        return [
            {
                "id": id2,
                "name": "Informações",
                "fields": {
                    "left": [],
                    "right": []
                }
            },
            {
                id: id,
                name: "Logs",
                fields: {
                    left: [
                        {
                            name: "Criado Por",
                            type: "VARCHAR(255)",
                            field_type: "loockup",
                            api_name: "created_by",
                            related_module: "users",
                            search_field: "name",
                            required: false,
                            disabled: true
                        },
                        {
                            name: "Hora da Criação",
                            type: "VARCHAR(255)",
                            field_type: "date_time",
                            api_name: "created_time",
                            required: false,
                            disabled: true
                        }
                    ],
                    right: [
                        {
                            name: "Modificado Por",
                            type: "VARCHAR(255)",
                            field_type: "loockup",
                            api_name: "modified_by",
                            related_module: "users",
                            search_field: "name",
                            required: false,
                            disabled: true
                        },
                        {
                            name: "Hora da Modificação",
                            type: "VARCHAR(255)",
                            field_type: "date_time",
                            api_name: "modified_time",
                            required: false,
                            disabled: true
                        }
                    ]
                }
            }
        ]
    }
}