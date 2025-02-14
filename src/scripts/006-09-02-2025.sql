
ALTER TABLE conversations ADD COLUMN last_message_time VARCHAR(255);

ALTER TABLE messages ADD COLUMN pathFront TEXT;

describe leads;

ALTER TABLE Leads MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


#####

select * from conversations;
select * from messages;
select * from contacts;
select * from bots;
select * from flows;
select * from steps;
SELECT * FROM bots JOIN flows ON flows.bot_id = bots.id JOIN steps ON steps.flow_id = flows.id WHERE steps.step = 1;

INSERT INTO steps (id, flow_id, name, type, content, step, next_step) 
VALUES (
    '545164d8sdbhg45sf21', 
    'f4sd8f6edgeioitgyjçolç', 
    'NFPe 1', 
    'text', 
    '{"type": "text","text": {"body": {"text": "Seja bem vindo a ABIGS Soluções para o Agronegócio, \\nPara seguir com a emissão da Nota Fiscal De Produtor Eletrônica digite: \\n\\n1 - Para quem vou Vender:"}}}', 
    1, 
    'data'
);

INSERT INTO steps (id, flow_id, name, type, content, step, next_step) 
VALUES ('54516sdfgsdgdsv8g45sf21', 'f4sd8f6edgeioitgyjçolç', 'NFPe 2', 'text', '{"type": "text","text": {"body": {"text": "2 - DATA:"}}}', 'data', 'operacao');

INSERT INTO steps (id, flow_id, name, type, content, step, next_step) 
VALUES ('545fvbdjfgasdffg45sf21', 'f4sd8f6edgeioitgyjçolç', 'NFPe 3', 'text', '{"type": "text","text": {"body": {"text": "3 - Evento/Operação:"}}}', 'operacao', 'produto');

INSERT INTO steps (id, flow_id, name, type, content, step, next_step) 
VALUES ('545fvbdjfgasdfghdfg21', 'f4sd8f6edgeioitgyjçolç', 'NFPe 4', 'text', '{"type": "text","text": {"body": {"text": "4 - Produto :"}}}', 'produto', 'quantidade');

INSERT INTO steps (id, flow_id, name, type, content, step, next_step) 
VALUES ('sdfsdffvbdjfgasdfghdfg21', 'f4sd8f6edgeioitgyjçolç', 'NFPe 5', 'text', '{"type": "text","text": {"body": {"text": "5 - Quantidade :"}}}', 'quantidade', 'valor');

INSERT INTO steps (id, flow_id, name, type, content, step, next_step) 
VALUES ('ssdasasdafghdfg21', 'f4sd8f6edgeioitgyjçolç', 'NFPe 6', 'text', '{"type": "text","text": {"body": {"text": "6 - Valor Unitário:"}}}', 'valor', 'nota');

INSERT INTO steps (id, flow_id, name, type, content, step, next_step) 
VALUES ('5sdfsdfsdngsd5fv456521', 'f4sd8f6edgeioitgyjçolç', 'NFPe 7', 'media', NULL, 'nota', 1);

delete from bots;
delete from flows;
delete from steps;
delete from contacts;


INSERT INTO bots SET id = 'dgddfghnmfhmdfgsdfasd', name = 'Nota Fiscal Produtor Eletrônica';

INSERT INTO flows SET id = 'f4sd8f6edgeioitgyjçolç', name = 'Nota Fiscal Produtor Eletrônica flow', bot_id = 'dgddfghnmfhmdfgsdfasd';

SELECT * FROM bots;
SELECT * FROM flows;
SELECT * FROM steps;

SELECT bots.id, bots.name, bots.description, bots.created_at, bots.updated_at, flows.id, flows.name, flows.bot_id, flows.created_at, flows.updated_at, steps.id, steps.flow_id, steps.name, steps.type, steps.content, steps.step, steps.created_at, steps.updated_at, steps.next_step FROM bots LEFT JOIN flows ON flows.bot_id = bots.id LEFT JOIN steps ON steps.flow_id = flows.id WHERE bots.id = 'dgddfghnmfhmdfgsdfasd';
SELECT * FROM bots WHERE id = 'dgddfghnmfhmdfgsdfasd';

SELECT * FROM bots JOIN flows ON flows.bot_id = bots.id JOIN steps ON steps.flow_id = flows.id WHERE bots.id = 'dgddfghnmfhmdfgsdfasd';

SELECT * FROM bots JOIN flows ON flows.bot_id = bots.id JOIN steps ON steps.flow_id = flows.id WHERE bots.id = 'dgddfghnmfhmdfgsdfasd' and steps.step = 1;


