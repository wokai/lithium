
-- -----------------------------------------------------------------------------
-- Dump:  mysqldump --databases sciencedb > science.sql
-- Restore: mysql sciencedb < science.sql
-- -----------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `sciencedb`;

USE `sciencedb`;

--
-- Table structure for table `scvna`
--

DROP TABLE IF EXISTS `scvna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scvna` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `createtime` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(255) NOT NULL DEFAULT 'create',
  `subject` int(11) NOT NULL,
  `mrn` int(10) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `weight` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `gestage` int(11) DEFAULT NULL,
  `preecl` int(11) DEFAULT NULL,
  `opcase` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `annam` varchar(255) DEFAULT NULL,
  `injection` datetime DEFAULT NULL,
  `beginop` datetime DEFAULT NULL,
  `birth` datetime DEFAULT NULL,
  `endop` datetime DEFAULT NULL,
  `spseg` varchar(255) DEFAULT NULL,
  `lasub` varchar(255) DEFAULT NULL,
  `ladose` int(11) DEFAULT NULL,
  `opsub` varchar(255) DEFAULT NULL,
  `opdose` int(11) DEFAULT NULL,
  `spalch` int(11) DEFAULT NULL,
  `splat` varchar(255) DEFAULT NULL,
  `spq` varchar(255) DEFAULT NULL,
  `ltilt` int(11) DEFAULT NULL,
  `rrsyspreop` int(11) DEFAULT NULL,
  `rrmeanpreop` int(11) DEFAULT NULL,
  `rrdiapreop` int(11) DEFAULT NULL,
  `rrsysmin` int(11) DEFAULT NULL,
  `rrmeanmin` int(11) DEFAULT NULL,
  `rrdiamin` int(11) DEFAULT NULL,
  `rrsysmax` int(11) DEFAULT NULL,
  `rrmeanmax` int(11) DEFAULT NULL,
  `rrdiamax` int(11) DEFAULT NULL,
  `nausea` int(11) DEFAULT NULL,
  `vomit` int(11) DEFAULT NULL,
  `dizziness` int(11) DEFAULT NULL,
  `doseonda` int(11) DEFAULT NULL,
  `doseakri` int(11) DEFAULT NULL,
  `namin` int(11) DEFAULT NULL,
  `namax` int(11) DEFAULT NULL,
  `natot` int(11) DEFAULT NULL,
  `naend` int(11) DEFAULT NULL,
  `antihtn` int(11) DEFAULT NULL,
  `apgar1` int(11) DEFAULT NULL,
  `apgar2` int(11) DEFAULT NULL,
  `apgar3` int(11) DEFAULT NULL,
  `nbweight` int(11) DEFAULT NULL,
  `iobl` int(11) DEFAULT NULL,
  `ioblv` int(11) DEFAULT NULL,
  `pobl` int(11) DEFAULT NULL,
  `poblv` int(11) DEFAULT NULL,
  `diiop` int(11) DEFAULT NULL,
  `dipinf` int(11) DEFAULT NULL,
  `popiri` int(11) DEFAULT NULL,
  `anlevel` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Table structure for table `subject`
--

DROP TABLE IF EXISTS `subject`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subject` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `createtime` datetime DEFAULT CURRENT_TIMESTAMP,
  `mrn` int(10) NOT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `gender` varchar(16) DEFAULT NULL,
  `birthdate` datetime DEFAULT NULL,
  `opcase` varchar(255) DEFAULT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `table_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;


