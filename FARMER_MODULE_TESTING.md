# Farmer Module Testing Guide

## Overview
This guide outlines how to test the complete farmer management functionality in the AgTech Certification System.

## Prerequisites
- Node.js (v16+)
- MySQL database running
- Environment variables configured (.env file)

## Backend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (.env):
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_DATABASE=agtech_certification
   PORT=3002
   ```

3. Run the backend:
   ```bash
   npm run dev
   ```

Backend will start on http://localhost:3002

## Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd ../agtech-certification-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the frontend:
   ```bash
   npm run dev
   ```

Frontend will start on http://localhost:3000

## Farmer Module Test Scenarios

### 1. Farmer Registration ✅
- **URL**: http://localhost:3000/farmers/new
- **Test Steps**:
  1. Fill in all 5 steps of the farmer registration form
  2. Test validation by leaving required fields empty
  3. Submit valid farmer data
  4. Verify success message and redirect to farmers list

### 2. Farmer Listing & Search ✅
- **URL**: http://localhost:3000/farmers
- **Test Steps**:
  1. View all registered farmers
  2. Test search functionality (name, email, phone)
  3. Test filters (status, certification, county, etc.)
  4. Test pagination if multiple farmers exist
  5. Test export functionality (PDF, Excel, CSV)

### 3. Farmer Details View ✅
- **URL**: http://localhost:3000/farmers/[id]
- **Test Steps**:
  1. Click on any farmer from the list
  2. Verify all farmer information is displayed correctly
  3. Test tab navigation (Farm Details, Crops, Certifications, History)
  4. Verify contact information and location details

### 4. Farmer Edit ✅
- **URL**: http://localhost:3000/farmers/[id]/edit
- **Test Steps**:
  1. Click "Edit Farmer" from farmer details page
  2. Modify farmer information
  3. Test form validation
  4. Submit changes and verify updates

### 5. Farmer Delete ✅
- **Test Steps**:
  1. From farmers list, click actions menu (three dots)
  2. Click "Delete Farmer"
  3. Confirm deletion in dialog
  4. Verify farmer is removed from list

## API Endpoints Testing

### Backend API Health Check
```bash
curl http://localhost:3002/health
```

### Test Farmer CRUD Operations
```bash
# Get all farmers
curl http://localhost:3002/api/farmers

# Get farmer by ID
curl http://localhost:3002/api/farmers/1

# Create farmer (POST)
curl -X POST http://localhost:3002/api/farmers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Farmer",
    "email": "test@example.com",
    "phone": "+254700000000",
    "idNumber": "12345678",
    "county": "Nakuru"
  }'

# Update farmer (PUT)
curl -X PUT http://localhost:3002/api/farmers/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Farmer Name"}'

# Delete farmer (DELETE)
curl -X DELETE http://localhost:3002/api/farmers/1
```

## Database Schema Verification
Ensure these tables exist in your MySQL database:
- `farmers` (main farmer data)
- `farms` (farmer's farms)
- `fields` (farm fields)
- `inspections` (inspection records)
- `certificates` (certification data)

## Common Issues & Solutions

### 1. Port Conflict
- Backend uses port 3002
- Frontend uses port 3000
- Ensure no other services are using these ports

### 2. Database Connection
- Verify MySQL is running
- Check .env configuration
- Ensure database schema is created

### 3. CORS Issues
- Backend has CORS enabled for all origins
- If issues persist, check browser console

## Expected Behavior
- All farmer CRUD operations should work seamlessly
- Form validation should prevent invalid data submission
- Search and filtering should work in real-time
- Export functionality should generate proper files
- Delete operations should cascade to related data

## Success Criteria ✅
The farmer module is considered complete when:
1. ✅ Farmers can be registered through the 5-step form
2. ✅ All farmers display in a searchable, filterable list
3. ✅ Farmer details can be viewed with comprehensive information
4. ✅ Farmers can be edited with form validation
5. ✅ Farmers can be deleted with confirmation
6. ✅ All API endpoints respond correctly
7. ✅ Database operations work without errors
8. ✅ Frontend and backend communicate properly