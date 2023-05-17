SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

CREATE TABLE IF NOT EXISTS `forms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user` int(10) unsigned NOT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp(),
  `cohorts` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `plain_cohorts` text COLLATE utf8_unicode_ci DEFAULT NULL,
  `type` enum('prelekcja','konkurs','RPG','LARP','inne') COLLATE utf8_unicode_ci NOT NULL,
  `type_others` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `type_contest` enum('indywidualny','druzynowy') COLLATE utf8_unicode_ci DEFAULT NULL,
  `duration` enum('45','105','165+') COLLATE utf8_unicode_ci NOT NULL,
  `track` enum('literacki','popkulturowy','popularnonaukowy','manga_anime','konkursowy','gry_planszowe_karciane','gry_elektroniczne','RPG','LARP') COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `full_description` varchar(600) COLLATE utf8_unicode_ci NOT NULL,
  `system` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `system_knowledge` int(1) unsigned DEFAULT NULL,
  `beginners_friendly` int(1) unsigned DEFAULT NULL,
  `age` enum('*','12-','12-18','18+') COLLATE utf8_unicode_ci DEFAULT NULL,
  `num_players` int(10) unsigned DEFAULT NULL,
  `style` enum('zwyciestwo','historia','świat','emocje','zabawa','inny') COLLATE utf8_unicode_ci DEFAULT NULL,
  `style_description` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  `tech_requirements` text COLLATE utf8_unicode_ci NOT NULL,
  `tech_requirements_others` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `trigger_list` text COLLATE utf8_unicode_ci NOT NULL,
  `accessability` text COLLATE utf8_unicode_ci NOT NULL,
  `preference_time` text COLLATE utf8_unicode_ci NOT NULL,
  `preferences_additional` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `previous_conventions` int(1) unsigned NOT NULL,
  `previous_conventions_which` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `experience` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `organization` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `dis_panel_question` int(1) unsigned NOT NULL,
  `dis_panel_topics` varchar(250) COLLATE utf8_unicode_ci DEFAULT NULL,
  `other_remarks` varchar(250) COLLATE utf8_unicode_ci NOT NULL,
  `status` varchar(128) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'new',
  PRIMARY KEY (`id`),
  KEY `user` (`user`),
  CONSTRAINT `forms_ibfk_2` FOREIGN KEY (`user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;