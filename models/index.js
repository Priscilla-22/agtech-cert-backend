const Certificate = require('./Certificate');
const Farm = require('./Farm');
const Farmer = require('./Farmer');
const Inspection = require('./Inspection');
const db = require('../config/database');

const models = {
  Certificate,
  Farm,
  Farmer,
  Inspection,

  // Legacy support for direct database operations
  async findById(table, id) {
    try {
      return await db.findById(table, id);
    } catch (error) {
      console.error(`Error finding ${table} by ID ${id}:`, error.message);
      return null;
    }
  },

  async findAll(table, conditions = '', params = []) {
    try {
      return await db.findAll(table, conditions, params);
    } catch (error) {
      console.error(`Error finding all ${table}:`, error.message);
      return [];
    }
  },

  async findBy(table, whereConditions, params = []) {
    try {
      let conditions = '';
      let queryParams = [];

      if (typeof whereConditions === 'object' && whereConditions !== null) {
        const clauses = [];
        const values = [];

        Object.entries(whereConditions).forEach(([key, value]) => {
          let dbField = key;
          if (key === 'farmerId') dbField = 'farmer_id';
          if (key === 'farmId') dbField = 'farm_id';

          clauses.push(`${dbField} = ?`);
          values.push(value);
        });

        conditions = clauses.join(' AND ');
        queryParams = values;
      } else {
        conditions = whereConditions;
        queryParams = params;
      }

      return await db.findAll(table, conditions, queryParams);
    } catch (error) {
      console.error(`Error finding ${table} by condition:`, error.message);
      return [];
    }
  },

  async create(table, data) {
    try {
      return await db.create(table, data);
    } catch (error) {
      console.error(`Error creating ${table}:`, error.message);
      throw error;
    }
  },

  async update(table, id, data) {
    try {
      return await db.update(table, id, data);
    } catch (error) {
      console.error(`Error updating ${table}:`, error.message);
      return null;
    }
  },

  async delete(table, id) {
    try {
      return await db.delete(table, id);
    } catch (error) {
      console.error(`Error deleting ${table}:`, error.message);
      return false;
    }
  },

  async query(sql, params = []) {
    try {
      return await db.executeQuery(sql, params);
    } catch (error) {
      console.error('Error executing custom query:', error.message);
      throw error;
    }
  },

  // Convert database field names (snake_case) to JavaScript object properties (camelCase)
  mapFieldsFromDatabase(record) {
    if (!record || typeof record !== 'object') {
      return record;
    }

    const mapped = {};

    for (const [key, value] of Object.entries(record)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

      // Parse JSON strings for specific fields that store arrays/objects
      if ((key === 'crop_types' || key === 'primary_crops' || key === 'water_sources' || key === 'checklist') &&
          typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
        try {
          mapped[camelKey] = JSON.parse(value);
        } catch (error) {
          console.warn(`Failed to parse JSON for field ${key}:`, error.message);
          mapped[camelKey] = value;
        }
      } else {
        mapped[camelKey] = value;
      }
    }

    return mapped;
  }
};

module.exports = models;