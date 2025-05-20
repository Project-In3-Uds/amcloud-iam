-- Création d'un utilisateur admin
INSERT INTO users (id, username, password, enabled) VALUES 
(1, 'admin', '$2a$12$9opD.AOnMCjrZLuhSDCsOuIBuwFU8FCKTVJSWTXIB5CxR5C5it6o2', true);

-- Création d'un rôle admin
INSERT INTO roles (id, name) VALUES (1, 'ROLE_ADMIN');

-- Association admin -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

-- Création d'un utilisateur admin
INSERT INTO users (id, username, password, enabled) VALUES 
(2, 'metsa', '$2a$12$9opD.AOnMCjrZLuhSDCsOuIBuwFU8FCKTVJSWTXIB5CxR5C5it6o2', true);

-- Création d'un rôle admin
INSERT INTO roles (id, name) VALUES (2, 'ROLE_ADMIN');

-- Association admin -> ROLE_ADMIN
INSERT INTO user_roles (user_id, role_id) VALUES (2, 2);

