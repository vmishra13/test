#!/bin/bash

# Update system packages
sudo dnf update -y

# Install the Amazon Linux Extras repository
sudo dnf install -y dnf-utils

# Install PostgreSQL Official Repository
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-2023-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL 16
sudo dnf makecache
sudo dnf -qy module disable postgresql
sudo dnf install -y postgresql16-server postgresql16

# Initialize PostgreSQL 16 database
sudo -u postgres initdb -D /var/lib/pgsql/16/data/

sudo /usr/pgsql-16/bin/postgresql-16-setup initdb

# Start and enable PostgreSQL 16 service
sudo systemctl enable postgresql-16
sudo systemctl start postgresql-16

# Backup original PostgreSQL configuration files
sudo cp /var/lib/pgsql/16/data/postgresql.conf /var/lib/pgsql/16/data/postgresql.conf.bak
sudo cp /var/lib/pgsql/16/data/pg_hba.conf /var/lib/pgsql/16/data/pg_hba.conf.bak

# Configure PostgreSQL to accept connections from any IP
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /var/lib/pgsql/16/data/postgresql.conf

# Configure PostgreSQL authentication to allow password authentication from any IP
echo "# Allow connections from any IP with password authentication" | sudo tee -a /var/lib/pgsql/16/data/pg_hba.conf
echo "host    all             all             0.0.0.0/0               scram-sha-256" | sudo tee -a /var/lib/pgsql/16/data/pg_hba.conf

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql-16

# Set a password for postgres user (replace 'your_secure_password' with actual password)
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'hifi4postgres';"
#sudo -u postgres psql -c "ALTER USER reliacare_user WITH PASSWORD 'reliacare4postgres';"
# Create database and user for the application (customize as needed)
sudo -u postgres psql -c "CREATE DATABASE reliacare;"
sudo -u postgres psql -c "CREATE USER reliacare_user WITH ENCRYPTED PASSWORD 'hifi4postgres';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE reliacare TO reliacare_user;"

# Configure firewall to allow PostgreSQL connections
sudo dnf install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload

# Print installation status
echo "PostgreSQL 16 installation completed!"
echo "To connect to PostgreSQL 16:"
echo "Host: <your-ec2-instance-ip>"
echo "Port: 5432"
echo "Default admin user: postgres"
echo "Database: reliacare"
echo "Application user: reliacare_user"

# Print security warning
echo ""
echo "⚠️ SECURITY WARNING ⚠️"
echo "1. Make sure to change the default passwords"
echo "2. Consider restricting IP addresses in pg_hba.conf"
echo "3. Set up SSL certificates for secure connections"
echo "4. Configure AWS Security Groups to restrict access to port 5432"
