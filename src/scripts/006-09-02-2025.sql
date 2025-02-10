
ALTER TABLE conversations ADD COLUMN last_message_time VARCHAR(255);

ALTER TABLE messages ADD COLUMN pathFront TEXT;