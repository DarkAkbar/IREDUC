-- Exécuter en tant que superutilisateur PostgreSQL (ex. postgres) :
--   psql -U postgres -f prisma/setup-db.sql
-- Puis mettez à jour DATABASE_URL dans api/.env

CREATE USER ireduc WITH PASSWORD 'ireduc_dev';
CREATE DATABASE ireduc OWNER ireduc;
GRANT ALL PRIVILEGES ON DATABASE ireduc TO ireduc;

\c ireduc
GRANT ALL ON SCHEMA public TO ireduc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ireduc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ireduc;
