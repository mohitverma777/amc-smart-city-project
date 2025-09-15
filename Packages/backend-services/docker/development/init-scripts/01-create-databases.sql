-- Create additional databases for different services
-- Note: POSTGRES_MULTIPLE_DATABASES is handled by a custom script

-- Create roles
CREATE ROLE amc_app_user WITH LOGIN PASSWORD 'amc_app_password';
CREATE ROLE amc_readonly WITH LOGIN PASSWORD 'amc_readonly_password';

-- Grant permissions to app user
GRANT CONNECT ON DATABASE amc_smart_city TO amc_app_user;
GRANT USAGE, CREATE ON SCHEMA public TO amc_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO amc_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO amc_app_user;

-- Grant readonly permissions
GRANT CONNECT ON DATABASE amc_smart_city TO amc_readonly;
GRANT USAGE ON SCHEMA public TO amc_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO amc_readonly;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO amc_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO amc_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO amc_readonly;