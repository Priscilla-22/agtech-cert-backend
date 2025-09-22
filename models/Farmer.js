const db = require('../config/database');

class Farmer {
  static async findAll() {
    return await db.findAll('farmers');
  }

  static async findById(id) {
    return await db.findById('farmers', id);
  }

  static async create(data) {
    const farmerData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      alternate_phone: data.alternatePhone,
      id_number: data.idNumber,
      date_of_birth: data.dateOfBirth,
      county: data.county,
      sub_county: data.subCounty,
      farming_experience: data.farmingExperience,
      education_level: data.educationLevel,
      agricultural_training: data.agriculturalTraining,
      primary_crops: data.primaryCrops ? JSON.stringify(data.primaryCrops) : null,
      farming_type: data.farmingType,
      total_land_size: data.totalLandSize,
      cultivated_size: data.cultivatedSize,
      land_tenure: data.landTenure,
      soil_type: data.soilType,
      water_sources: data.waterSources ? JSON.stringify(data.waterSources) : null,
      irrigation_system: data.irrigationSystem,
      previous_certification: data.previousCertification,
      certifying_body: data.certifyingBody,
      certification_expiry: data.certificationExpiry,
      organic_experience: data.organicExperience,
      registration_date: data.registrationDate || new Date(),
      certification_status: data.certificationStatus || 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    return await db.create('farmers', farmerData);
  }

  static async update(id, data) {
    const updateData = {};

    Object.entries(data).forEach(([key, value]) => {
      switch (key) {
        case 'alternatePhone':
          updateData.alternate_phone = value;
          break;
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

  static mapFromDatabase(data) {
    if (!data) return null;

    const mapped = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      alternatePhone: data.alternate_phone,
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