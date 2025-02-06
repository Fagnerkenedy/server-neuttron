# SELECT * FROM contacts;

# SELECT * FROM flows;
# SELECT * FROM steps;

# UPDATE contacts SET bot_step = null;

alter table steps add column next_step VARCHAR(255);

# describe contacts;

# UPDATE steps SET next_step = '1' where id = '545164d8g54656486746456';

ALTER TABLE contacts MODIFY COLUMN bot_step VARCHAR(255);


# select * from users;
# UPDATE users SET phone_number_id = null where id = '15faad59003cd21b26b';

# UPDATE contacts SET bot_step = null, record_id = null where id = '0c2897ad7d5b5e9b313';

# SELECT * FROM Leads;

###################################


# select * from options where module = 'functions';
insert into options (id, name, field_api_name, module, option_order) values('asuig12jkrwe78rtywuirw','Interagir com o Chatbot', 'executar_quando', 'functions', 4);

# SELECT * FROM functions WHERE executar_quando LIKE '%Interagir com o Chatbot%' AND modulo = 'Leads';

# SELECT DISTINCT name FROM modules WHERE api_name = 'Leads';

ALTER TABLE contacts ADD COLUMN record_id VARCHAR(255);

# describe Leads;

