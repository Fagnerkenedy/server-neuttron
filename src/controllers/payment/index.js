const mercadopago = require("mercadopago");

// REPLACE WITH YOUR ACCESS TOKEN AVAILABLE IN: https://developers.mercadopago.com/panel
mercadopago.configure({
	access_token: process.env.ACCESS_TOKEN_MERCADO_PAGO,
});

module.exports = {
    createPreference: (req, res) => {
        
        let preference = {
            items: [
                {
                    title: req.body.description,
                    unit_price: Number(req.body.price),
                    quantity: Number(req.body.quantity),
                }
            ],
            back_urls: {
                "success": "https://crm.neuttron.com.br/api/notifications",
                "failure": "https://crm.neuttron.com.br/api/notifications",
                "pending": "https://crm.neuttron.com.br/api/notifications"
            },
            auto_return: "approved",
            notification_url: "https://crm.neuttron.com.br/api/notifications"
        };

        mercadopago.preferences.create(preference)
            .then(function (response) {
                res.json({
                    id: response.body.id
                });
            }).catch(function (error) {
                console.log(error);
            });
    },
    getFeedback: (req, res) => {
        res.json({
            Payment: req.query.payment_id,
            Status: req.query.status,
            MerchantOrder: req.query.merchant_order_id
        });
    }
}