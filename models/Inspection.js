const db = require('../config/database');

class Inspection {
  static async findAll() {
    return await db.findAll('inspections');
  }

  static async findById(id) {
    return await db.findById('inspections', id);
  }

  static async findByFarmId(farmId) {
    return await db.findAll('inspections', 'farm_id = ?', [farmId]);
  }

  static async create(data) {
    const inspectionData = {
      farm_id: data.farmId,
      inspector_id: data.inspectorId || null,
      inspector_name: data.inspectorName || null,
      scheduled_date: data.scheduledDate || null,
      inspection_date: data.inspectionDate || null,
      status: data.status || 'scheduled',
      score: data.score || data.complianceScore || null,
      notes: data.notes || null,
      checklist: data.checklist ? JSON.stringify(data.checklist) : null,
      is_eligible_for_certification: data.isEligibleForCertification || false,
      created_at: new Date(),
      updated_at: new Date()
    };

    return await db.create('inspections', inspectionData);
  }

  static async update(id, data) {
    const updateData = {};

    if (data.inspectorId) updateData.inspector_id = data.inspectorId;
    if (data.inspectorName) updateData.inspector_name = data.inspectorName;
    if (data.scheduledDate) updateData.scheduled_date = data.scheduledDate;
    if (data.inspectionDate) updateData.inspection_date = data.inspectionDate;
    if (data.status) updateData.status = data.status;
    if (data.score !== undefined || data.complianceScore !== undefined) {
      updateData.score = data.score !== undefined ? data.score : data.complianceScore;
    }
    if (data.notes) updateData.notes = data.notes;
    if (data.checklist) updateData.checklist = JSON.stringify(data.checklist);
    if (data.isEligibleForCertification !== undefined) {
      updateData.is_eligible_for_certification = data.isEligibleForCertification;
    }
    if (data.violations) updateData.violations = JSON.stringify(data.violations);

    updateData.updated_at = new Date();

    return await db.update('inspections', id, updateData);
  }

  static async delete(id) {
    return await db.delete('inspections', id);
  }

  static mapFromDatabase(data) {
    if (!data) return null;

    const mapped = {
      id: data.id,
      farmId: data.farm_id,
      inspectorId: data.inspector_id,
      inspectorName: data.inspector_name,
      scheduledDate: data.scheduled_date,
      inspectionDate: data.inspection_date,
      status: data.status,
      score: data.score,
      notes: data.notes,
      isEligibleForCertification: data.is_eligible_for_certification,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    if (data.checklist) {
      try {
        mapped.checklist = typeof data.checklist === 'string'
          ? JSON.parse(data.checklist)
          : data.checklist;
      } catch (e) {
        mapped.checklist = {};
      }
    }

    return mapped;
  }
}

module.exports = Inspection;