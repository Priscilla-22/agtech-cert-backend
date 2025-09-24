const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Farm = sequelize.define('Farm', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  farmerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'farmer_id',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  county: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  subCounty: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'sub_county',
  },
  ward: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  village: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  totalArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_area',
  },
  organicArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'organic_area',
  },
  soilType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'soil_type',
  },
  cropTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'crop_types',
  },
  farmingSystem: {
    type: DataTypes.ENUM('organic', 'conventional', 'transitioning'),
    allowNull: true,
    field: 'farming_system',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  waterSource: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'water_source',
  },
  irrigationSystem: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'irrigation_system',
  },
  organicPracticesStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'organic_practices_start_date',
  },
  lastChemicalApplication: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_chemical_application',
  },
  bufferZone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'buffer_zone',
  },
  bufferZoneDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'buffer_zone_description',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'under_inspection'),
    defaultValue: 'active',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'farms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Farm;