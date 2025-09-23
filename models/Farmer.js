const db = require('../config/database');

class Farmer {
  static async findAll() {
    return await db.findAll('farmers');
  }

  static async findById(id) {
    return await db.findById('farmers', id);
  }

  static async create(data) {
    // Generate member number if not provided
    const memberNumber = data.memberNumber || await this.generateMemberNumber();

    const farmerData = {
      name: data.name,
      member_number: memberNumber,
      email: data.email,
      phone: data.phone,
      idNumber: data.idNumber,
      dateOfBirth: data.dateOfBirth,
      county: data.county,
      sub_county: data.subCounty,
      ward: data.ward,
      village: data.village,
      address: data.address,
      farmingExperience: data.farmingExperience,
      educationLevel: data.educationLevel,
      agriculturalTraining: data.agriculturalTraining,
      primaryCrops: data.primaryCrops ? JSON.stringify(data.primaryCrops) : null,
      farmingType: data.farmingType,
      totalLandSize: data.totalLandSize,
      cultivatedSize: data.cultivatedSize,
      landTenure: data.landTenure,
      soilType: data.soilType,
      waterSources: data.waterSources ? JSON.stringify(data.waterSources) : null,
      irrigationSystem: data.irrigationSystem,
      previousCertification: data.previousCertification,
      certifyingBody: data.certifyingBody,
      certificationExpiry: data.certificationExpiry,
      organicExperience: data.organicExperience,
      motivation: data.motivation,
      challenges: data.challenges,
      expectations: data.expectations,
      status: data.status,
      notes: data.notes,
      totalFarms: data.totalFarms,
      registration_date: data.registrationDate || new Date().toISOString().split('T')[0],
      certification_status: data.certificationStatus || 'pending'
    };

    // Check for undefined values and provide specific error
    const undefinedFields = [];
    Object.entries(farmerData).forEach(([key, value]) => {
      if (value === undefined) {
        undefinedFields.push(key);
      }
    });

    if (undefinedFields.length > 0) {
      throw new Error(`The following fields have undefined values: ${undefinedFields.join(', ')}`);
    }

    return await db.create('farmers', farmerData);
  }

  static async update(id, data) {
    const updateData = {};

    Object.entries(data).forEach(([key, value]) => {
      switch (key) {
        case 'idNumber':
          updateData.id_number = value;
          break;
        case 'dateOfBirth':
          updateData.date_of_birth = value;
          break;
        case 'subCounty':
          updateData.sub_county = value;
          break;
        case 'farmingExperience':
          updateData.farming_experience = value;
          break;
        case 'educationLevel':
          updateData.education_level = value;
          break;
        case 'agriculturalTraining':
          updateData.agricultural_training = value;
          break;
        case 'primaryCrops':
          updateData.primary_crops = JSON.stringify(value);
          break;
        case 'farmingType':
          updateData.farming_type = value;
          break;
        case 'totalLandSize':
          updateData.total_land_size = value;
          break;
        case 'cultivatedSize':
          updateData.cultivated_size = value;
          break;
        case 'landTenure':
          updateData.land_tenure = value;
          break;
        case 'soilType':
          updateData.soil_type = value;
          break;
        case 'waterSources':
          updateData.water_sources = JSON.stringify(value);
          break;
        case 'irrigationSystem':
          updateData.irrigation_system = value;
          break;
        case 'previousCertification':
          updateData.previous_certification = value;
          break;
        case 'certifyingBody':
          updateData.certifying_body = value;
          break;
        case 'certificationExpiry':
          updateData.certification_expiry = value;
          break;
        case 'organicExperience':
          updateData.organic_experience = value;
          break;
        case 'registrationDate':
          updateData.registration_date = value;
          break;
        case 'certificationStatus':
          updateData.certification_status = value;
          break;
        case 'memberNumber':
          updateData.member_number = value;
          break;
        default:
          updateData[key] = value;
      }
    });

    updateData.updated_at = new Date();

    return await db.update('farmers', id, updateData);
  }

  static async delete(id) {
    return await db.delete('farmers', id);
  }

  static async generateMemberNumber() {
    // Get the current year
    const currentYear = new Date().getFullYear();

    // Get the count of farmers created this year to generate sequential number
    const query = `
      SELECT COUNT(*) as count
      FROM farmers
      WHERE member_number LIKE 'MEMBER-${currentYear}-%'
    `;

    const result = await db.query(query);
    const count = result[0].count || 0;

    // Generate member number: MEMBER-YYYY-XXXX (4-digit sequential)
    const sequentialNumber = String(count + 1).padStart(4, '0');
    return `MEMBER-${currentYear}-${sequentialNumber}`;
  }

  static mapFromDatabase(data) {
    if (!data) return null;

    const mapped = {
      id: data.id,
      name: data.name,
      memberNumber: data.member_number,
      email: data.email,
      phone: data.phone,
      idNumber: data.id_number,
      dateOfBirth: data.date_of_birth,
      county: data.county,
      subCounty: data.sub_county,
      farmingExperience: data.farming_experience,
      educationLevel: data.education_level,
      agriculturalTraining: data.agricultural_training,
      farmingType: data.farming_type,
      totalLandSize: data.total_land_size,
      cultivatedSize: data.cultivated_size,
      landTenure: data.land_tenure,
      soilType: data.soil_type,
      irrigationSystem: data.irrigation_system,
      previousCertification: data.previous_certification,
      certifyingBody: data.certifying_body,
      certificationExpiry: data.certification_expiry,
      organicExperience: data.organic_experience,
      registrationDate: data.registration_date,
      certificationStatus: data.certification_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    if (data.primary_crops) {
      try {
        mapped.primaryCrops = typeof data.primary_crops === 'string'
          ? JSON.parse(data.primary_crops)
          : data.primary_crops;
      } catch (e) {
        mapped.primaryCrops = [];
      }
    }

    if (data.water_sources) {
      try {
        mapped.waterSources = typeof data.water_sources === 'string'
          ? JSON.parse(data.water_sources)
          : data.water_sources;
      } catch (e) {
        mapped.waterSources = [];
      }
    }

    return mapped;
  }
}

module.exports = Farmer;