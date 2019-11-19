

--------------------------------------------------------------------------------
-- Setup Database
--------------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `auth`;
USE `auth`;
GRANT ALL ON auth.* TO 'authroot'@'localhost' IDENTIFIED BY 'gxCqAqSxqm';

--------------------------------------------------------------------------------
-- Table `login`
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS `login`;

CREATE TABLE `login` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `userid` int(10) unsigned NOT NULL,
  `roleid` int(10) unsigned NOT NULL,
  `sessionid` varchar(255) DEFAULT NULL,
  `ipaddress` varchar(39) DEFAULT NULL,
  `token` varchar(23) DEFAULT NULL,
  `logout` TINYINT DEFAULT 0,
  `expiration` datetime DEFAULT CURRENT_TIMESTAMP,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  INDEX (sessionid, token),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=latin1;

--------------------------------------------------------------------------------
-- Table `php_session`
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS `php_session`;

CREATE TABLE `php_session` (
  `id` varchar(32) NOT NULL,
  `data` text,
  `timestamp` int(10) unsigned NOT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--------------------------------------------------------------------------------
-- Table  `role`
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS `role`;

CREATE TABLE `role` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(127) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;


LOCK TABLES `role` WRITE;
INSERT INTO `role` VALUES (1,'sys_admin'),(2,'user_manager'),(3,'anonymous'),(4,'scvna_admin'),(5,'scvna_read'),(6, 'scvna_write');
UNLOCK TABLES;

--------------------------------------------------------------------------------
-- Table `user`
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `role` int(11) DEFAULT '5',
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `externalid` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `createtime` datetime DEFAULT CURRENT_TIMESTAMP,
  `expirdate` datetime DEFAULT '2099-12-31 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;


LOCK TABLES `user` WRITE;
INSERT INTO `user` VALUES 
(1,'root',1,'first name','last name','0001','$2y$10$9GUzyCvjuAsKkyoiD2iE5.lptM8R6IkuxBMLAr/.8fNfQxr1ZtFTq','2019-05-09 08:16:20','2099-12-31 00:00:00'),(2,'anonymous',5,'first name','last name','0003','$2y$10$38.cblQNeqoTrhSjvvBp0.UGIiBeAl4ocAL/1WG1vwH51ZEXA5JhW','2019-05-09 08:16:32','2099-12-31 00:00:00'),(3,'admin',1,'first name','last name','0002','$2y$10$oNvhsqKY5vFjLfgbI1Y3ROmCPF5SvPc9hVAxhsnMT6x9WPqQOyGhe','2019-05-09 08:17:20','2060-10-10 00:00:00');
UNLOCK TABLES;

--------------------------------------------------------------------------------
-- END OF FILE
--------------------------------------------------------------------------------
