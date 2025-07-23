-- Ensure the public schema is selected for operations
SET search_path TO public;

-- Création d'un Realm par défaut
INSERT INTO realms (id, name, description, created_at, updated_at) VALUES
(1, 'master', 'Realm principal pour l''administration du système IAM.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = EXCLUDED.updated_at;

-- Création d'un utilisateur admin
INSERT INTO users (
    id, username, email, password_hash, status, created_at, updated_at, last_login_at, enabled, realm_id
) VALUES
(1, 'admin', 'admin@example.com', '$2a$12$9opD.AOnMCjrZLuhSDCsOuIBuwFU8FCKTVJSWTXIB5CxR5C5it6o2', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, true, 1)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at, enabled = EXCLUDED.enabled, realm_id = EXCLUDED.realm_id;

-- Création d'un rôle admin - AJOUT DE description et realm_id
INSERT INTO roles (id, name, description, realm_id) VALUES (1, 'ROLE_ADMIN', 'Rôle administrateur avec tous les privilèges.', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, realm_id = EXCLUDED.realm_id;
-- Création d'un rôle utilisateur par défaut (nécessaire pour les nouvelles inscriptions) - AJOUT DE description et realm_id
INSERT INTO roles (id, name, description, realm_id) VALUES (2, 'ROLE_USER', 'Rôle utilisateur standard avec accès de base.', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, realm_id = EXCLUDED.realm_id;


-- Association admin -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Création d'un utilisateur metsa
INSERT INTO users (
    id, username, email, password_hash, status, created_at, updated_at, last_login_at, enabled, realm_id
) VALUES
(2, 'metsa', 'metsa@example.com', '$2a$12$9opD.AOnMCjrZLuhSDCsOuIBuwFU8FCKTVJSWTXIB5CxR5C5it6o2', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, true, 1)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at, enabled = EXCLUDED.enabled, realm_id = EXCLUDED.realm_id;

-- Association metsa -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (2, 1)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Initialisation de la table permissions - AJOUT DE description et realm_id
INSERT INTO permissions (id, name, scope_value, description, realm_id) VALUES
(1, 'PERM_READ', 'read', 'Permet la lecture des ressources.', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, scope_value = EXCLUDED.scope_value, description = EXCLUDED.description, realm_id = EXCLUDED.realm_id;
INSERT INTO permissions (id, name, scope_value, description, realm_id) VALUES
(2, 'PERM_WRITE', 'write', 'Permet l''écriture et la modification des ressources.', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, scope_value = EXCLUDED.scope_value, description = EXCLUDED.description, realm_id = EXCLUDED.realm_id;
INSERT INTO permissions (id, name, scope_value, description, realm_id) VALUES
(3, 'PERM_DELETE', 'delete', 'Permet la suppression des ressources.', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, scope_value = EXCLUDED.scope_value, description = EXCLUDED.description, realm_id = EXCLUDED.realm_id;

-- Initialisation de la table role_permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1),
(1, 2),
(1, 3)
ON CONFLICT (role_id, permission_id) DO NOTHING;
-- Assurez-vous que ROLE_USER a aussi des permissions si vous en avez besoin, par exemple:
-- INSERT INTO role_permissions (role_id, permission_id) VALUES (2, 1); -- ROLE_USER a PERM_READ

-- Reset the sequence for the realms table's ID column
SELECT setval('realms_id_seq', (SELECT MAX(id) FROM realms), true);
-- Reset the sequence for the users table's ID column
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
-- Reset the sequence for the roles table's ID column
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles), true);
-- Reset the sequence for the permissions table's ID column
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions), true);
