SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

INSERT INTO permissions (module, name, global) VALUES ('core', 'projects/list', 1) ON DUPLICATE KEY UPDATE id = id;
SET @permissions.projects.list = (SELECT id FROM permissions WHERE module = 'core' AND name = 'projects/list' AND global = 1 LIMIT 1);

INSERT INTO permissions (module, name, global) VALUES ('core', 'projects/add', 1) ON DUPLICATE KEY UPDATE id = id;
SET @permissions.projects.add = (SELECT id FROM permissions WHERE module = 'core' AND name = 'projects/add' AND global = 1 LIMIT 1);

INSERT INTO permissions (module, name, global) VALUES ('core', 'projects/edit', 1) ON DUPLICATE KEY UPDATE id = id;
SET @permissions.projects.edit = (SELECT id FROM permissions WHERE module = 'core' AND name = 'projects/edit' AND global = 1 LIMIT 1);

INSERT INTO roles (project, name) VALUES (NULL, 'admin') ON DUPLICATE KEY UPDATE id = id;
SET @roles.admin = (SELECT id FROM roles WHERE project IS NULL AND name = 'admin' LIMIT 1);

INSERT INTO roles (project, name) VALUES (NULL, 'projects/manager') ON DUPLICATE KEY UPDATE id = id;
SET @roles.projects.manager = (SELECT id FROM roles WHERE project IS NULL AND name = 'projects/manager' LIMIT 1);

INSERT INTO roles_permissions (role, permission) VALUES
	(@roles.projects.manager, @permissions.projects.list),
	(@roles.projects.manager, @permissions.projects.add),
	(@roles.projects.manager, @permissions.projects.edit)
	ON DUPLICATE KEY UPDATE role = role;

INSERT INTO roles_roles (role, subrole) VALUES (@roles.admin, @roles.projects.manager) ON DUPLICATE KEY UPDATE role = role;
INSERT INTO users_roles (user, project, role) VALUES (0, NULL, @roles.admin) ON DUPLICATE KEY UPDATE user = user;