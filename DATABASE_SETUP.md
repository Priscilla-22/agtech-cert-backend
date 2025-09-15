# MySQL Database Setup with phpMyAdmin

## Prerequisites

1. **Install MySQL Server**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server

   # Or using Docker
   docker run --name mysql-agtech -e MYSQL_ROOT_PASSWORD=yourpassword -p 3306:3306 -d mysql:8.0
   ```

2. **Install phpMyAdmin**
   ```bash
   # Ubuntu/Debian
   sudo apt install phpmyadmin

   # Or using Docker
   docker run --name phpmyadmin-agtech --link mysql-agtech:db -p 8080:80 -d phpmyadmin
   ```

## Database Configuration

### 1. Configure Environment Variables

Update the `.env` file in your backend root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=agtech_certification

# Server Configuration
PORT=3002
NODE_ENV=development
```

### 2. Create Database and Tables

**Option A: Using phpMyAdmin (Recommended)**

1. Open phpMyAdmin: http://localhost/phpmyadmin (or http://localhost:8080 if using Docker)
2. Login with your MySQL credentials
3. Click "Import" tab
4. Choose the file: `database/schema.sql`
5. Click "Go" to execute

**Option B: Using MySQL Command Line**

```bash
# Login to MySQL
mysql -u root -p

# Execute the schema file
mysql -u root -p < database/schema.sql
```

**Option C: Using Docker MySQL**

```bash
# Copy schema file to container
docker cp database/schema.sql mysql-agtech:/tmp/schema.sql

# Execute schema
docker exec mysql-agtech mysql -u root -pYOUR_PASSWORD < /tmp/schema.sql
```

### 3. Verify Database Setup

After running the schema, you should see these tables in phpMyAdmin:

- `users` - Agronomists and inspectors
- `farmers` - Farmer profiles with comprehensive data
- `farms` - Farm information linked to farmers
- `fields` - Individual field data within farms
- `inspections` - Inspection records and checklists
- `certificates` - Organic certificates and PDF links
- `audit_logs` - Change tracking (optional)

## Database Schema Overview

### Core Tables

1. **users** - System users (agronomists, inspectors)
   - Firebase integration with `uid` field
   - Role-based access control
   - Profile information

2. **farmers** - Comprehensive farmer profiles
   - 5-step registration data
   - Location details with GPS coordinates
   - Farming background and experience
   - Land details and certification status

3. **farms** - Farm management
   - Linked to farmers via `farmer_id`
   - Crop types as JSON array
   - Organic certification timeline

4. **fields** - Individual field management
   - Linked to farms via `farm_id`
   - Crop-specific information
   - Organic status tracking

5. **inspections** - Inspection workflow
   - Checklist responses as JSON
   - Scoring and eligibility tracking
   - Inspector assignment

6. **certificates** - Certification documents
   - PDF generation and storage
   - Status tracking (active, expired, revoked)
   - Expiry date management

## phpMyAdmin Access

Once phpMyAdmin is installed and configured:

1. **Local Installation**: http://localhost/phpmyadmin
2. **Docker Installation**: http://localhost:8080
3. **Login Credentials**:
   - Username: `root` (or your MySQL user)
   - Password: Your MySQL password

## Database Features

### JSON Field Support
- `primary_crops`, `water_sources`, `crop_types` stored as JSON arrays
- `checklist` inspection responses stored as JSON objects
- Easy querying and updating of complex data

### Indexing Strategy
- Primary keys on all tables
- Foreign key constraints for data integrity
- Composite indexes for common queries
- Full-text search on farmer and farm names

### Sample Data
The schema includes sample data:
- Test agronomist user
- Sample farmer with comprehensive profile
- Ready for testing all API endpoints

## Connection Testing

Start your backend server to test the database connection:

```bash
cd /home/wakahia/DEV/P-R/agtech-certification-backend
npm start
```

You should see:
```
✅ MySQL Database connected successfully
📊 Connected to database: agtech_certification on localhost:3306
🚀 Server running on port 3002
📚 API Documentation: http://localhost:3002/api-docs
```

## Troubleshooting

### Connection Issues

1. **Check MySQL Service**
   ```bash
   sudo systemctl status mysql
   sudo systemctl start mysql  # if not running
   ```

2. **Verify Credentials**
   - Test MySQL login: `mysql -u root -p`
   - Check `.env` file configuration

3. **Check Port Availability**
   ```bash
   netstat -tlnp | grep :3306
   ```

4. **MySQL User Permissions**
   ```sql
   GRANT ALL PRIVILEGES ON agtech_certification.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Common Errors

- **ECONNREFUSED**: MySQL server not running
- **ER_ACCESS_DENIED**: Wrong username/password in `.env`
- **ER_BAD_DB_ERROR**: Database doesn't exist (run schema.sql)

## Backup and Restore

### Backup Database
```bash
mysqldump -u root -p agtech_certification > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u root -p agtech_certification < backup_20231201.sql
```

## Production Considerations

1. **Security**: Create dedicated database user (not root)
2. **SSL**: Enable SSL connections
3. **Backup**: Set up automated backups
4. **Monitoring**: Monitor connection pool and query performance
5. **Environment**: Use different credentials for production

## API Integration

The backend automatically:
- Maps camelCase API fields to snake_case database columns
- Converts JSON arrays for storage
- Handles foreign key relationships
- Provides comprehensive error handling

All API endpoints now use the MySQL database instead of in-memory storage.