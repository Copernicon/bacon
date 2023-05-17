SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

INSERT IGNORE INTO permissions (module, name, global) VALUES ('core', 'projects/list', 1) ;
SELECT @permissions_projects_list := (SELECT id FROM permissions WHERE module = 'core' AND name = 'projects/list' AND global = 1 LIMIT 1);

INSERT IGNORE INTO permissions (module, name, global) VALUES ('core', 'projects/add', 1);
SELECT @permissions_projects_add := (SELECT id FROM permissions WHERE module = 'core' AND name = 'projects/add' AND global = 1 LIMIT 1);

INSERT IGNORE INTO permissions (module, name, global) VALUES ('core', 'projects/edit', 1);
SELECT @permissions_projects_edit := (SELECT id FROM permissions WHERE module = 'core' AND name = 'projects/edit' AND global = 1 LIMIT 1);

INSERT IGNORE INTO roles (project, name) VALUES (NULL, 'admin');
SELECT @roles_admin := (SELECT id FROM roles WHERE project IS NULL AND name = 'admin' LIMIT 1);

INSERT IGNORE INTO roles (project, name) VALUES (NULL, 'projects/manager');
SELECT @roles_projects_manager := (SELECT id FROM roles WHERE project IS NULL AND name = 'projects/manager' LIMIT 1);

INSERT IGNORE INTO roles_permissions (role, permission) VALUES
	(@roles_projects_manager, @permissions_projects_list),
	(@roles_projects_manager, @permissions_projects_add),
	(@roles_projects_manager, @permissions_projects_edit);

INSERT IGNORE INTO roles_roles (role, subrole) VALUES (@roles_admin, @roles_projects_manager);
INSERT IGNORE INTO users_roles (user, project, role) VALUES (0, NULL, @roles.admin);