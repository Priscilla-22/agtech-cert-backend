const db = require('../config/database');

class Farm {
  static async findAll() {
    return await db.findAll('farms');
  }

  static async findById(id) {
    return await db.findById('farms', id);
  }

  static async findByFarmerId(farmerId) {
    return await db.findAll('farms', 'farmer_id = ?', [farmerId]);
  }

  static async create(data) {
    const farmData = {
      farmer_id: data.farmerId,
      farm_name: data.farmName,
      location: data.location,
      total_area: data.totalArea || data.size,
      organic_area: data.organicArea,
      crop_types: data.cropTypes ? JSON.stringify(data.cropTypes) : null,
      farming_type: data.farmingType,
      organic_since: data.organicSince,
      created_at: new Date(),
      updated_at: new Date()
    };

    return await db.create('farms', farmData);
  }

  static async update(id, data) {
    const updateData = {};

    if (data.farmName) updateData.farm_name = data.farmName;
    if (data.location) updateData.location = data.location;
    if (data.totalArea || data.size) updateData.total_area = data.totalArea || data.size;
    if (data.organicArea) updateData.organic_area = data.organicArea;
    if (data.cropTypes) updateData.crop_types = JSON.stringify(data.cropTypes);
    if (data.farmingType) updateData.farming_type = data.farmingType;
    if (data.organicSince) updateData.organic_since = data.organicSince;
    if (data.certificationStatus) updateData.certification_status = data.certificationStatus;

    updateData.updated_at = new Date();

    return await db.update('farms', id, updateData);
  }

  static async delete(id) {
    return await db.delete('farms', id);
  }

  static mapFromDatabase(data) {
    if (!data) return null;

    const mapped = {
      id: data.id,
      farmerId: data.farmer_id,
      farmName: data.farm_name,
      location: data.location,
      totalArea: data.total_area,
      organicArea: data.organic_area,
      farmingType: data.farming_type,
      organicSince: data.organic_since,
      certificationStatus: data.certification_status || 'pending',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    if (data.crop_types) {
      try {
        mapped.cropTypes = typeof data.crop_types === 'string'
          ? JSON.parse(data.crop_types)
          : data.crop_types;
      } catch (e) {
        mapped.cropTypes = [];
      }
    }

    return mapped;
  }
}

module.exports = Farm;