# Database Schema

This directory contains the database schema and migration files for the AgTech Certification System.

## Files

- `schema.sql` - Initial database schema
- `schema-fixed.sql` - Updated schema with fixes
- `add_*.sql` - Migration files for schema changes

## Setup

1. Create a MySQL/MariaDB database named `pesira_db`
2. Run the latest schema file: `schema-fixed.sql`
3. Apply any additional migrations as needed

## Security Note

The schema includes sample test data for development purposes only. No production or sensitive data is stored in these files.