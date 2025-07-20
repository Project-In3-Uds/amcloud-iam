-- Création d'un utilisateur admin
INSERT INTO users (
    id, username, email, password_hash, status, created_at, updated_at, last_login_at, enabled
) VALUES
(1, 'admin', 'admin@example.com', '$2a$12$9opD.AOnMCjrZLuhSDCsOuIBuwFU8FCKTVJSWTXIB5CxR5C5it6o2', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, true);

-- Création d'un rôle admin
INSERT INTO roles (id, name) VALUES (1, 'ROLE_ADMIN');

-- Association admin -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

-- Création d'un utilisateur metsa
INSERT INTO users (
    id, username, email, password_hash, status, created_at, updated_at, last_login_at, enabled
) VALUES
(2, 'metsa', 'metsa@example.com', '$2a$12$9opD.AOnMCjrZLuhSDCsOuIBuwFU8FCKTVJSWTXIB5CxR5C5it6o2', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, true);

-- Association metsa -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (2, 1);

-- Initialisation de la table permissions
INSERT INTO permissions (id, name) VALUES
(1, 'PERM_READ'),
(2, 'PERM_WRITE'),
(3, 'PERM_DELETE');
-- Initialisation de la table role_permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1),
(1, 2),
(1, 3);

-- Reset the sequence for the users table's ID column
-- This ensures that new auto-generated IDs start after the manually inserted ones.
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
