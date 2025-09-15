# AgTech Certification System - API Documentation

## Swagger/OpenAPI Documentation

The API documentation is automatically generated using Swagger/OpenAPI 3.0 specifications and is accessible via a user-friendly web interface.

### Access Swagger Documentation

**URL:** [http://localhost:3002/api-docs](http://localhost:3002/api-docs)

The Swagger UI provides:
- Interactive API documentation
- Request/response schemas
- Example requests and responses
- Authentication requirements
- Ability to test endpoints directly from the browser

### API Overview

The AgTech Certification System provides RESTful APIs for managing:

#### 🔐 Authentication (`/api/auth`)
- User registration and profile management
- JWT token verification
- Account management

#### 👨‍🌾 Farmers (`/api/farmers`)
- Farmer registration with comprehensive profile data
- CRUD operations for farmer records
- Multi-step registration process support

#### 🏡 Farms (`/api/farms`)
- **GET** `/api/farms` - Get all farms with farmer and field information
- **GET** `/api/farms/{id}` - Get detailed farm information
- **POST** `/api/farms` - Create new farm for an existing farmer
- **PUT** `/api/farms/{id}` - Update farm information
- **DELETE** `/api/farms/{id}` - Delete farm and associated data

#### 🌾 Fields (`/api/fields`)
- **GET** `/api/fields` - Get all fields (with optional farmId filter)
- **GET** `/api/fields/{id}` - Get detailed field information
- **POST** `/api/fields` - Create new field within a farm
- **PUT** `/api/fields/{id}` - Update field information
- **DELETE** `/api/fields/{id}` - Delete field

#### 🔍 Inspections (`/api/inspections`)
- **GET** `/api/inspections/checklist` - Get inspection checklist questions
- **GET** `/api/inspections` - Get all inspections with farm and farmer details
- **GET** `/api/inspections/{id}` - Get detailed inspection information
- **POST** `/api/inspections` - Schedule new inspection
- **PUT** `/api/inspections/{id}` - Update inspection details

#### 📜 Certificates (`/api/certificates`)
- **GET** `/api/certificates` - Get all organic certificates
- **GET** `/api/certificates/{id}` - Get detailed certificate information
- **GET** `/api/certificates/{id}/pdf` - Download PDF certificate
- **POST** `/api/certificates` - Issue new certificate
- **PUT** `/api/certificates/{id}` - Update certificate information
- **DELETE** `/api/certificates/{id}` - Delete certificate and PDF file

#### ❤️ Health (`/health`)
- System health monitoring
- API status checks

### Authentication

Most endpoints require Firebase JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <firebase-jwt-token>
```

### Example API Calls

#### Get all farmers
```bash
curl http://localhost:3002/api/farmers
```

#### Create new farmer
```bash
curl -X POST http://localhost:3002/api/farmers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+254712345678",
    "idNumber": "12345678",
    "county": "Kiambu"
  }'
```

#### Check API health
```bash
curl http://localhost:3002/health
```

### Server Configuration

- **Development Server:** http://localhost:3002
- **Alternative Port:** http://localhost:5000 (if PORT not set)
- **Documentation Path:** `/api-docs`

### API Features

- **Comprehensive Validation:** All endpoints include input validation
- **Error Handling:** Standardized error responses
- **CORS Enabled:** Cross-origin requests supported
- **Security Headers:** Helmet.js security middleware
- **Request Logging:** Morgan HTTP request logger
- **Static File Serving:** Certificate PDF serving

### Development

To regenerate documentation after API changes:
1. Update Swagger annotations in route files
2. Restart the server: `npm start` or `PORT=3002 node server.js`
3. Visit http://localhost:3002/api-docs to see updated documentation

### Schema Validation

The API includes detailed schema validation for:
- Farmer registration data (5-step process)
- User authentication and profiles
- Inspection checklists and scoring
- Certificate generation parameters

Visit the Swagger UI for complete schema definitions and examples.