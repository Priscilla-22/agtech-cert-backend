const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Field = sequelize.define('Field', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  farmId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'farm_id',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cropType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'crop_type',
  },
  plantingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'planting_date',
  },
  harvestDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'harvest_date',
  },
  soilType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'soil_type',
  },
  fertilizers: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  pesticides: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  seeds: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'fallow', 'harvested'),
    defaultValue: 'active',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'fields',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Field;