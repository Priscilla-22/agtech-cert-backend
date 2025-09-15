const db = require('../config/database');

// MySQL-based database operations
const models = {
  // Find record by ID
  async findById(table, id) {
    try {
      return await db.findById(table, id);
    } catch (error) {
      console.error(`Error finding ${table} by ID ${id}:`, error.message);
      return null;
    }
  },

  // Find all records
  async findAll(table, conditions = '', params = []) {
    try {
      return await db.findAll(table, conditions, params);
    } catch (error) {
      console.error(`Error finding all ${table}:`, error.message);
      return [];
    }
  },

  // Find records by condition
  async findBy(table, whereConditions, params = []) {
    try {
      let conditions = '';
      let queryParams = [];

      // If whereConditions is an object, convert to SQL WHERE clause
      if (typeof whereConditions === 'object' && whereConditions !== null) {
        const clauses = [];
        const values = [];

        Object.entries(whereConditions).forEach(([key, value]) => {
          // Handle different field name mappings
          let dbField = key;
          if (key === 'farmerId') dbField = 'farmer_id';
          if (key === 'farmId') dbField = 'farm_id';

          clauses.push(`${dbField} = ?`);
          values.push(value);
        });

        conditions = clauses.join(' AND ');
        queryParams = values;
      } else {
        // If it's a string condition, use as is
        conditions = whereConditions;
        queryParams = params;
      }

      return await db.findAll(table, conditions, queryParams);
    } catch (error) {
      console.error(`Error finding ${table} by condition:`, error.message);
      return [];
    }
  },

  // Create new record
  async create(table, data) {
    try {
      // Handle field name mappings for database columns
      const dbData = this.mapFieldsToDatabase(data);
      return await db.create(table, dbData);
    } catch (error) {
      console.error(`Error creating ${table}:`, error.message);
      throw error;
    }
  },

  // Update record
  async update(table, id, data) {
    try {
      // Handle field name mappings for database columns
      const dbData = this.mapFieldsToDatabase(data);
      return await db.update(table, id, dbData);
    } catch (error) {
      console.error(`Error updating ${table}:`, error.message);
      return null;
    }
  },

  // Delete record
  async delete(table, id) {
    try {
      return await db.delete(table, id);
    } catch (error) {
      console.error(`Error deleting ${table}:`, error.message);
      return false;
    }
  },

  // Execute custom query
  async query(sql, params = []) {
    try {
      return await db.executeQuery(sql, params);
    } catch (error) {
      console.error('Error executing custom query:', error.message);
      throw error;
    }
  },

  // Map API field names to database column names
  mapFieldsToDatabase(data) {
    const fieldMap = {
      // Common mappings
      'farmerId': 'farmer_id',
      'farmId': 'farm_id',
      'inspectorId': 'inspector_id',
      'issuedBy': 'issued_by',

      // Farmer-specific mappings
      'alternatePhone': 'alternate_phone',
      'idNumber': 'id_number',
      'dateOfBirth': 'date_of_birth',
      'subCounty': 'sub_county',
      'farmingExperience': 'farming_experience',
      'educationLevel': 'education_level',
      'agriculturalTraining': 'agricultural_training',
      'primaryCrops': 'primary_crops',
      'farmingType': 'farming_type',
      'totalLandSize': 'total_land_size',
      'cultivatedSize': 'cultivated_size',
      'landTenure': 'land_tenure',
      'soilType': 'soil_type',
      'waterSources': 'water_sources',
      'irrigationSystem': 'irrigation_system',
      'previousCertification': 'previous_certification',
      'certifyingBody': 'certifying_body',
      'certificationExpiry': 'certification_expiry',
      'organicExperience': 'organic_experience',
      'registrationDate': 'registration_date',
      'totalFarms': 'total_farms',
      'certificationStatus': 'certification_status',

      // Farm-specific mappings
      'farmName': 'farm_name',
      'totalArea': 'total_area',
      'organicArea': 'organic_area',
      'cropTypes': 'crop_types',
      'organicSince': 'organic_since',

      // Field-specific mappings
      'fieldName': 'field_name',
      'cropType': 'crop_type',
      'plantingDate': 'planting_date',
      'organicStatus': 'organic_status',

      // Inspection-specific mappings
      'inspectorName': 'inspector_name',
      'scheduledDate': 'scheduled_date',
      'inspectionDate': 'inspection_date',
      'isEligibleForCertification': 'is_eligible_for_certification',

      // Certificate-specific mappings
      'certificateNumber': 'certificate_number',
      'issueDate': 'issue_date',
      'expiryDate': 'expiry_date',
      'certificationBody': 'certification_body',
      'pdfUrl': 'pdf_url'
    };

    const mappedData = {};

    Object.entries(data).forEach(([key, value]) => {
      const dbField = fieldMap[key] || key;

      // Handle JSON fields
      if (Array.isArray(value) && (key === 'primaryCrops' || key === 'waterSources' || key === 'cropTypes')) {
        mappedData[dbField] = JSON.stringify(value);
      } else if (typeof value === 'object' && value !== null && key === 'checklist') {
        mappedData[dbField] = JSON.stringify(value);
      } else {
        mappedData[dbField] = value;
      }
    });

    return mappedData;
  },

  // Map database fields back to API format
  mapFieldsFromDatabase(data) {
    if (!data) return null;

    const apiData = { ...data };

    // Convert snake_case to camelCase for API responses
    const fieldMap = {
      'farmer_id': 'farmerId',
      'farm_id': 'farmId',
      'inspector_id': 'inspectorId',
      'issued_by': 'issuedBy',
      'alternate_phone': 'alternatePhone',
      'id_number': 'idNumber',
      'date_of_birth': 'dateOfBirth',
      'sub_county': 'subCounty',
      'farming_experience': 'farmingExperience',
      'education_level': 'educationLevel',
      'agricultural_training': 'agriculturalTraining',
      'primary_crops': 'primaryCrops',
      'farming_type': 'farmingType',
      'total_land_size': 'totalLandSize',
      'cultivated_size': 'cultivatedSize',
      'land_tenure': 'landTenure',
      'soil_type': 'soilType',
      'water_sources': 'waterSources',
      'irrigation_system': 'irrigationSystem',
      'previous_certification': 'previousCertification',
      'certifying_body': 'certifyingBody',
      'certification_expiry': 'certificationExpiry',
      'organic_experience': 'organicExperience',
      'registration_date': 'registrationDate',
      'total_farms': 'totalFarms',
      'certification_status': 'certificationStatus',
      'farm_name': 'farmName',
      'total_area': 'totalArea',
      'organic_area': 'organicArea',
      'crop_types': 'cropTypes',
      'organic_since': 'organicSince',
      'field_name': 'fieldName',
      'crop_type': 'cropType',
      'planting_date': 'plantingDate',
      'organic_status': 'organicStatus',
      'inspector_name': 'inspectorName',
      'scheduled_date': 'scheduledDate',
      'inspection_date': 'inspectionDate',
      'is_eligible_for_certification': 'isEligibleForCertification',
      'certificate_number': 'certificateNumber',
      'issue_date': 'issueDate',
      'expiry_date': 'expiryDate',
      'certification_body': 'certificationBody',
      'pdf_url': 'pdfUrl'
    };

    Object.entries(fieldMap).forEach(([dbField, apiField]) => {
      if (data.hasOwnProperty(dbField)) {
        apiData[apiField] = data[dbField];
        delete apiData[dbField];
      }
    });

    // Parse JSON fields
    ['primaryCrops', 'waterSources', 'cropTypes', 'checklist'].forEach(field => {
      if (apiData[field] && typeof apiData[field] === 'string') {
        try {
          apiData[field] = JSON.parse(apiData[field]);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
    });

    return apiData;
  },

  // Get enriched data with related records
  async getEnrichedFarmers() {
    try {
      const farmers = await this.findAll('farmers');
      const enrichedFarmers = [];

      for (const farmer of farmers) {
        const farms = await this.findBy('farms', { farmer_id: farmer.id });
        const mappedFarmer = this.mapFieldsFromDatabase(farmer);
        mappedFarmer.farms = farms.map(f => this.mapFieldsFromDatabase(f));
        enrichedFarmers.push(mappedFarmer);
      }

      return enrichedFarmers;
    } catch (error) {
      console.error('Error getting enriched farmers:', error.message);
      return [];
    }
  }
};

module.exports = models;