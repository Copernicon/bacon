CREATE DATABASE IF NOT EXISTS bacon CHARACTER SET utf8 COLLATE utf8_unicode_ci;
CREATE USER 'bacon'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
GRANT ALL PRIVILEGES ON bacon.* TO 'bacon'@'%';
SET GLOBAL event_scheduler = ON;