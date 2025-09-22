# Live Backend Configuration

## Current Setup
- **Live Backend URL**: https://agtech-cert-backend.onrender.com
- **Database**: Hosted MySQL on Aiven Cloud
- **Status**: Production Ready

## API Endpoints
- **Base URL**: https://agtech-cert-backend.onrender.com
- **Health Check**: https://agtech-cert-backend.onrender.com/health
- **API Documentation**: https://agtech-cert-backend.onrender.com/api-docs

## Test Creating a Farmer

### Endpoint
```
POST https://agtech-cert-backend.onrender.com/api/farmers
```

### Sample Request Body
```json
{
  "name": "Test Farmer",
  "email": "testfarmer@example.com",
  "phone": "+254712345678",
  "id_number": "12345678",
  "date_of_birth": "1985-03-15",
  "county": "Kiambu",
  "sub_county": "Thika",
  "ward": "Thika Town",
  "village": "Kamenu",
  "address": "P.O Box 456, Thika",
  "farming_experience": "6-10",
  "education_level": "secondary",
  "farming_type": "mixed",
  "total_land_size": 5.5,
  "cultivated_size": 4.0,
  "land_tenure": "owned",
  "soil_type": "volcanic",
  "previous_certification": "no",
  "organic_experience": "2-3",
  "registration_date": "2025-09-22",
  "primary_crops": ["Coffee", "Maize", "Beans"],
  "water_sources": ["River", "Borehole"]
}
```

### cURL Command
```bash
curl -X POST https://agtech-cert-backend.onrender.com/api/farmers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farmer",
    "email": "testfarmer@example.com",
    "phone": "+254712345678",
    "id_number": "12345678",
    "date_of_birth": "1985-03-15",
    "county": "Kiambu",
    "sub_county": "Thika",
    "ward": "Thika Town",
    "village": "Kamenu",
    "address": "P.O Box 456, Thika",
    "farming_experience": "6-10",
    "education_level": "secondary",
    "farming_type": "mixed",
    "total_land_size": 5.5,
    "cultivated_size": 4.0,
    "land_tenure": "owned",
    "soil_type": "volcanic",
    "previous_certification": "no",
    "organic_experience": "2-3",
    "registration_date": "2025-09-22",
    "primary_crops": ["Coffee", "Maize", "Beans"],
    "water_sources": ["River", "Borehole"]
  }'
```

## Database Configuration
The live backend connects to:
- **Host**: mysql-3240cee4-wakahia6-2bcb.f.aivencloud.com:21493
- **Database**: defaultdb
- **User**: avnadmin
- **SSL**: Required

## Local Development
To run locally instead of using the live backend:
1. Uncomment the services in `docker-compose.yml`
2. Run `docker compose up -d`
3. Use `http://localhost:3001` as base URL