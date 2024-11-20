const mercadopago = require("mercadopago");

// REPLACE WITH YOUR ACCESS TOKEN AVAILABLE IN: https://developers.mercadopago.com/panel
mercadopago.configure({
    access_token: process.env.ACCESS_TOKEN_MERCADO_PAGO,
});

module.exports = {
    createPreference: (req, res) => {

        // let preference = {
        //     items: [
        //         {
        //             title: req.body.description,
        //             unit_price: Number(req.body.price),
        //             quantity: Number(req.body.quantity),
        //         }
        //     ],
        //     back_urls: {
        //         "success": "https://crm.neuttron.com.br/api/notifications",
        //         "failure": "https://crm.neuttron.com.br/api/notifications",
        //         "pending": "https://crm.neuttron.com.br/api/notifications"
        //     },
        //     auto_return: "approved",
        //     notification_url: "https://crm.neuttron.com.br/api/notifications",
        //     external_reference: "Plano_Profissional_Teste_1_Usuário"
        // };

        let preapproval = {
            "preapproval_plan_id": "2c938084930f52980193476ab08b1155",
            "reason": "Plano Profissional Teste 1 Usuário",
            "external_reference": "Plano_Profissional_Teste_1_Usuário",
            "payer_email": "test_user_732555700@testuser.com",
            "card_token_id": "e3ed6f098462036dd2cbabe314b9de2a",
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "start_date": "2020-06-02T13:07:14.260Z",
                "end_date": "2022-07-20T15:59:52.581Z",
                "transaction_amount": 10,
                "currency_id": "ARS"
            },
            "back_url": "https://crm.neuttron.com.br/login",
            "status": "authorized"
        }

        // mercadopago.preferences.create(preference)
        //     .then(function (response) {
        //         res.json({
        //             id: response.body.id
        //         });
        //     }).catch(function (error) {
        //         console.log(error);
        //     });

        mercadopago.preapproval.create(preapproval)
            .then(function (response) {
                console.log("response preapproval: ", response)
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