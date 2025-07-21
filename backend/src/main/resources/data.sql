-- Ensure the public schema is selected for operations
SET search_path TO public;

-- Création d'un utilisateur admin
INSERT INTO users (
    id, username, email, password_hash, status, created_at, updated_at, last_login_at, enabled
) VALUES
(1, 'admin', 'admin@example.com', '$2a$12$9opD.AOnMCjrZLuhSDCsOuIBuwFU8FCKTVJSWTXIB5CxR5C5it6o2', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, true);

-- Création d'un rôle admin - AJOUT DE description
INSERT INTO roles (id, name, description) VALUES (1, 'ROLE_ADMIN', 'Rôle administrateur avec tous les privilèges.');
-- Création d'un rôle utilisateur par défaut (nécessaire pour les nouvelles inscriptions) - AJOUT DE description
INSERT INTO roles (id, name, description) VALUES (2, 'ROLE_USER', 'Rôle utilisateur standard avec accès de base.');


-- Association admin -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

-- Création d'un utilisateur metsa
INSERT INTO users (
    id, username, email, password_hash, status, created_at, updated_at, last_login_at, enabled
) VALUES
(2, 'metsa', 'metsa@example.com', '$2a$12$9opD.AOnMCjrZLuhSDCsOuIBuwFU8FCKTVJSWTXIB5CxR5C5it6o2', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, true);

-- Association metsa -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (2, 1);

-- Initialisation de la table permissions - AJOUT DE description
INSERT INTO permissions (id, name, scope_value, description) VALUES
(1, 'PERM_READ', 'read', 'Permet la lecture des ressources.'),
(2, 'PERM_WRITE', 'write', 'Permet l''écriture et la modification des ressources.'),
(3, 'PERM_DELETE', 'delete', 'Permet la suppression des ressources.');
-- Initialisation de la table role_permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1),
(1, 2),
(1, 3);
-- Assurez-vous que ROLE_USER a aussi des permissions si vous en avez besoin, par exemple:
-- INSERT INTO role_permissions (role_id, permission_id) VALUES (2, 1); -- ROLE_USER a PERM_READ

-- Reset the sequence for the users table's ID column
-- This ensures that new auto-generated IDs start after the manually inserted ones.
-- CHANGÉ : Utilisation de 'true' pour que la prochaine valeur générée soit MAX(id) + 1
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true);
-- Reset the sequence for the roles table's ID column
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles), true);
-- Reset the sequence for the permissions table's ID column
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions), true);
