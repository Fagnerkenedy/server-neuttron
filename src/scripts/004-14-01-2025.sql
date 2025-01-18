CREATE TABLE IF NOT EXISTS conversations (
	id VARCHAR(255) PRIMARY KEY,
	name VARCHAR(255),
    wa_id_contact VARCHAR(255),
    unread INT(20),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO conversations SET name = 'Teste 2', id = 'sdfghusdfgdfghfjnwsjlen';
SELECT * FROM conversations;


CREATE TABLE IF NOT EXISTS messages (
	id VARCHAR(255) PRIMARY KEY,
	conversationId VARCHAR(255),
    senderId VARCHAR(255),
	name VARCHAR(255),
    body TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO messages SET name = 'nome teste da mensagem', body = 'Esta é a SEGUNDA mensagem', conversationId = 'sdfghuiskfjnwsjlen', id = '8348313SDF1843521354', senderId = 'sdlfvsndvvklsdfmk';
select * from contacts; delete from messages where id = '8348313SDF1843521354'; UPDATE messages SET senderId = 'sdjyhgsdfbhn' WHERE id = '83483131843521354';
ALTER TABLE contacts MODIFY COLUMN wa_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS contacts (
	id VARCHAR(255) PRIMARY KEY,
	name VARCHAR(255),
    wa_id VARCHAR(255),
    bot_step INT(20),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO contacts SET name = 'Michael', id = 'sdlfvsndvvklsdfmk';
INSERT INTO contacts SET name = 'Marcia', id = 'sdjyhgsdfbhn';

SELECT 
	messages.*, 
	contacts.name 
FROM messages 
JOIN contacts ON contacts.id = messages.senderId 
WHERE conversationId = 'sdfghuiskfjnwsjlen' 
ORDER BY created_at ASC;

UPDATE contacts SET wa_id = '554599792202' WHERE id = 'sdlfvsndvvklsdfmk';

SELECT * FROM users;

ALTER TABLE users ADD COLUMN phone_number_id VARCHAR(255);

UPDATE users SET phone_number_id = '537389792787824' WHERE orgId = '35788897';

ALTER TABLE conversations ADD COLUMN wa_id_contact VARCHAR(255);

SELECT * FROM contacts;

UPDATE conversations SET wa_id_contact = '' WHERE id = 'sdfghuiskfjnwsjlen';

delete from messages;
delete from contacts;
delete from conversations;

ALTER TABLE conversations ADD COLUMN unread INT(20);

INSERT INTO contacts SET name = 'Neuttron CRM', id = '0d0fb5074df90c051f6';
DELETE FROM contacts where id = '0d0fb5074df90c051f6';


SELECT * FROM conversations ORDER BY updated_at DESC;
ALTER TABLE messages
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

SELECT * FROM contacts;

ALTER TABLE contacts ADD COLUMN bot_step INT(20);
UPDATE contacts SET wa_id = '554599750447' WHERE id = '0d0fb5074df90c051f6';

## Bots
CREATE TABLE IF NOT EXISTS bots (
	id VARCHAR(255) PRIMARY KEY,
	name VARCHAR(255),
    description VARCHAR(255),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flows (
	id VARCHAR(255) PRIMARY KEY,
    bot_id VARCHAR(255),
	name VARCHAR(255),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS steps (
	id VARCHAR(255) PRIMARY KEY,
    flow_id VARCHAR(255),
	name VARCHAR(255),
    type VARCHAR(255),
    content JSON,
    step VARCHAR(255),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO bots SET id = 'ss61df8s4fs1d36g465ds1', name = 'Atendimento';

INSERT INTO flows SET id = 'f4sd8f6sd51f8thd345gf3', name = 'Atendimento flow', bot_id = 'ss61df8s4fs1d36g465ds1';

INSERT INTO steps SET id = 'sdf164d8g45sf213g6584h', flow_id = 'f4sd8f6sd51f8thd345gf3', name = 'Teste de steps', type = 'text', content = '{body: "Olá, seja bem vindo! Em que posso ajudar?"}', step = 1;
INSERT INTO steps (id, flow_id, name, type, content, step) 
VALUES ('sdf164d8g45sf213g6584h', 'f4sd8f6sd51f8thd345gf3', 'Teste de steps', 'interactive', '{"type": "button","body": {"text": "Olá! Escolha uma das opções abaixo para continuar:"},"action": {"buttons": [{"type": "reply","reply": {"id": "option_1","title": "Nota Fiscal"}},{"type": "reply","reply": {"id": "option_2","title": "Boleto"}},{"type": "reply","reply": {"id": "option_3","title": "Falar com uma pessoa"}}]}}', 'inicio');

SELECT * FROM bots JOIN flows ON flows.bot_id = bots.id JOIN steps ON steps.flow_id = flows.id;

UPDATE contacts SET bot_step = 1 WHERE id = 'f1029490699ad9c5820';

INSERT INTO steps (id, flow_id, name, type, content, step) 
VALUES ('sdf164d8g45sf213g6584h', 'f4sd8f6sd51f8thd345gf3', 'Teste de steps', 'text', '{"body": "Olá, seja bem vindo! Em que posso ajudar?"}', 1);

DELETE FROM steps;

ALTER TABLE steps MODIFY COLUMN step VARCHAR(255);

INSERT INTO steps (id, flow_id, name, type, content, step) 
VALUES ('545164d8g45sf213g658735', 'f4sd8f6sd51f8thd345gf3', 'Teste de steps 2', 'text', '{"type": "text","text": {"body": {"text": "Certo. Digite o CNPJ"}}}', 'cnpj');

INSERT INTO steps (id, flow_id, name, type, content, step) 
VALUES ('545164d8g546564f213g658735', 'f4sd8f6sd51f8thd345gf3', 'Teste de steps 3', 'text', '{"type": "text","text": {"body": {"text": "Ótimo, aguarde enquanto busco sua Nota Fiscal no sistema..."}}}', 'notafiscal');

INSERT INTO steps (id, flow_id, name, type, content, step) 
VALUES ('545164d8g54656486746456', 'f4sd8f6sd51f8thd345gf3', 'Teste de steps 5', 'text', '{"type": "text","text": {"body": {"text": "Aqui está, se precisar de mais alguma coisa é só escolher no menu novamente. Tenha um ótimo dia!"}}}', 'final');








