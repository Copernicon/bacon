INSERT IGNORE INTO `permissions` (`id`, `module`, `name`, `global`) VALUES
(0,	'core',	'projects/list',	1),
(1,	'core',	'projects/add',	1),
(2,	'core',	'projects/edit',	1);

INSERT IGNORE INTO `roles` (`id`, `project`, `name`) VALUES
(0,	NULL,	'admin'),
(1,	NULL,	'projects/manager');

INSERT IGNORE INTO `roles_permissions` (`role`, `permission`) VALUES
(1,	0),
(1,	1),
(1,	2);

INSERT IGNORE INTO `roles_roles` (`role`, `subrole`) VALUES
(0,	1);

INSERT IGNORE INTO `users_roles` (`user`, `project`, `role`) VALUES
(0,	NULL,	0);