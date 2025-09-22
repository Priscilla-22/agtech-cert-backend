# AgTech Certification Backend

A comprehensive Node.js backend system for managing organic agriculture certification processes in Kenya. This system handles farmer registration, farm management, inspection scheduling, and certificate generation.

## Overview

The AgTech Certification Backend is designed to digitize and streamline the organic agriculture certification process. It provides APIs for managing farmers, farms, inspectors, inspections, and certificates, enabling a complete certification workflow from registration to certificate issuance.

## Features

- **Farmer Management**: Complete farmer registration and profile management
- **Farm Management**: Farm registration with crop and land details
- **Inspector Management**: Certified inspector registration and assignment
- **Inspection Workflow**: Scheduling, conducting, and completing inspections
- **Certificate Generation**: Automatic PDF certificate generation for qualified farms
- **API Documentation**: Comprehensive Swagger documentation
- **Database Management**: MySQL with proper relations and constraints

## Table of Contents

- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Architecture

### Class Diagram
![Class Diagram](https://ik.imagekit.io/lzdm7pnd7/PR/Class%20Diagram.png?updatedAt=1758582867742)

### Sequence Diagram
![Sequence Diagram](https://ik.imagekit.io/lzdm7pnd7/PR/Sequence%20Diagram.png?updatedAt=1758582867481)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agtech-certification-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   node run-migration.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3001`

## API Documentation

### Swagger Documentation
Access the interactive API documentation at:
- **Local**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **Production**: [https://agtech-cert-backend.onrender.com/api-docs](https://agtech-cert-backend.onrender.com/api-docs)


## Database Schema

### Core Tables

1. **farmers** - Farmer registration and personal information
2. **farms** - Farm details and agricultural information
3. **inspectors** - Certified inspector registry
4. **inspections** - Inspection records and compliance data
5. **certificates** - Generated certificates and status

### Entity Relationships

- One farmer can have multiple farms
- One farm can have multiple inspections
- One inspector can conduct multiple inspections
- One successful inspection can generate one certificate

## Environment Setup

### Environment Variables

```env
# Database Configuration
DB_CONNECTION=mysql
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_DATABASE=your-database-name
DB_SSL=true

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
```

### Production Database (Aiven)

The application is configured to use a hosted MySQL database:
- **Host**: mysql-3240cee4-wakahia6-2bcb.f.aivencloud.com:21493
- **Database**: defaultdb
- **SSL**: Required

## Deployment

### Live Application
- **Backend URL**: [https://agtech-cert-backend.onrender.com](https://agtech-cert-backend.onrender.com)
- **API Documentation**: [https://agtech-cert-backend.onrender.com/api-docs](https://agtech-cert-backend.onrender.com/api-docs)
- **Health Check**: [https://agtech-cert-backend.onrender.com/health](https://agtech-cert-backend.onrender.com/health)

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

1. Set environment variables for production
2. Run database migrations
3. Start the application with PM2 or similar process manager

## Testing

### Testing Endpoints

#### Get All Farmers
```bash
curl -X GET https://agtech-cert-backend.onrender.com/api/farmers
```

## Development

### Project Structure

```
agtech-certification-backend/
├── config/           # Database and configuration files
├── database/         # Database schema and migrations
├── middleware/       # Authentication and validation middleware
├── models/          # Data models and database interactions
├── routes/          # API route definitions
├── services/        # Business logic and PDF generation
├── utils/           # Helper functions and utilities
├── public/          # Static files and assets
├── certificates/    # Generated certificates storage
└── docs/           # Documentation files
```

### Code Style

- Use ES6+ syntax
- Follow RESTful API conventions
- Implement proper error handling
- Include comprehensive logging
- Validate input data
- Use proper HTTP status codes

### Adding New Features

1. Define the database schema in `database/schema.sql`
2. Create the model in `models/`
3. Implement routes in `routes/`
4. Add validation in `utils/validation.js`
5. Update Swagger documentation
6. Test thoroughly

## Monitoring and Logging

### Health Monitoring
- Application health endpoint: `/health`
- Database connectivity checks
- Environment validation

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Proper HTTP status codes
- Debug information in development mode

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Development Guidelines

- Write clear, self-documenting code
- Include proper error handling
- Add unit tests for new features
- Update documentation as needed
- Follow the existing code style

## Security

- Input validation and sanitization
- SQL injection prevention
- Environment variable protection
- HTTPS enforcement in production
- Rate limiting implementation
- Authentication and authorization

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Kenya Organic Agriculture Network (KOAN)
- Agricultural certification standards organizations
- Open source community contributors

---

**Built with care for sustainable agriculture in Kenya**
