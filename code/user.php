<?php

////////////////////////////////////////////////////////////////////////////////
// Setup database:
// CREATE TABLE user (id INT UNSIGNED NOT NULL AUTO_INCREMENT KEY, username VARCHAR(255), role INT DEFAULT 5, firstname VARCHAR(255), lastname VARCHAR(255), externalid VARCHAR(255), password VARCHAR(255), createtime DATETIME DEFAULT CURRENT_TIMESTAMP, expirdate DATETIME DEFAULT '2099-12-31');
// CREATE TABLE login (id INT UNSIGNED NOT NULL AUTO_INCREMENT KEY, userid INT UNSIGNED NOT NULL, date DATETIME DEFAULT CURRENT_TIMESTAMP);
// CREATE TABLE session (id INT UNSIGNED NOT NULL AUTO_INCREMENT KEY, userid INT UNSIGNED NOT NULL, sid VARCHAR(255));
// CREATE TABLE role (id INT UNSIGNED NOT NULL AUTO_INCREMENT KEY, name VARCHAR(127));
//
// INSERT INTO user(username, role, password) VALUES('root', 1, '$2y$10$9GUzyCvjuAsKkyoiD2iE5.lptM8R6IkuxBMLAr/.8fNfQxr1ZtFTq');
// INSERT INTO user(username, role, password) VALUES ('anonymous', 5, '$2y$10$38.cblQNeqoTrhSjvvBp0.UGIiBeAl4ocAL/1WG1vwH51ZEXA5JhW');
// INSERT INTO role (name) VALUES ('admin');
// INSERT INTO role (name) VALUES ('user_manager');
// INSERT INTO role (name) VALUES ('write');
// INSERT INTO role (name) VALUES ('read');
// INSERT INTO role (name) VALUES ('anonymous');
////////////////////////////////////////////////////////////////////////////////

class User
{
    public $id;
    public $userName;
    public $userRole;
    public $roleName;
    public $firstName;
    public $lastName;
    public $externalId;
    public $expirDate;
    public $passWord; 
    public $passwordHash;
}

?>
