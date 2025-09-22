const db = require('../config/database');

class Certificate {
  static async findAll() {
    return await db.findAll('certificates');
  }

  static async findById(id) {
    return await db.findById('certificates', id);
  }

  static async findByFarmId(farmId) {
    return await db.findAll('certificates', 'farm_id = ?', [farmId]);
  }

  static async create(data) {
    const certificateData = {
      certificate_number: this.generateCertificateNumber(),
      farm_id: data.farmId,
      issue_date: data.issueDate,
      expiry_date: data.expiryDate,
      status: data.status || 'active',
      certification_body: data.certificationBody || 'Kenya Organic Agriculture Network',
      scope: data.scope || 'Organic crop production',
      crop_types: JSON.stringify(data.cropTypes || []),
      created_at: new Date(),
      updated_at: new Date()
    };

    return await db.create('certificates', certificateData);
  }

  static async update(id, data) {
    const updateData = {};

    if (data.status) updateData.status = data.status;
    if (data.pdfUrl) updateData.pdf_url = data.pdfUrl;
    // Removed notes field since it doesn't exist in the database schema
    if (data.cropTypes) updateData.crop_types = JSON.stringify(data.cropTypes);

    updateData.updated_at = new Date();

    return await db.update('certificates', id, updateData);
  }

  static async delete(id) {
    return await db.delete('certificates', id);
  }

  static generateCertificateNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
    const random = Math.random().toString(36).substr(2, 2).toUpperCase();
    return `ORG-${year}-${timestamp}${random}`;
  }

  static mapFromDatabase(data) {
    if (!data) return null;

    const mapped = {
      id: data.id,
      certificateNumber: data.certificate_number,
      farmId: data.farm_id,
      issueDate: data.issue_date,
      expiryDate: data.expiry_date,
      status: data.status,
      certificationBody: data.certification_body,
      scope: data.scope,
      pdfUrl: data.pdf_url,
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

module.exports = Certificate;