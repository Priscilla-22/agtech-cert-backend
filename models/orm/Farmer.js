const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Farmer = sequelize.define('Farmer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  memberNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    field: 'member_number',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  alternatePhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'alternate_phone',
  },
  idNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true,
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
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  farmingExperience: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  educationLevel: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  agriculturalTraining: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  primaryCrops: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  farmingType: {
    type: DataTypes.ENUM('organic', 'conventional', 'transitioning'),
    allowNull: true,
  },
  totalLandSize: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  cultivatedSize: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  landTenure: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  soilType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  waterSources: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  irrigationSystem: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  previousCertification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  certifyingBody: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  certificationExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  organicExperience: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  motivation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  challenges: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expectations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  totalFarms: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  registrationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'registration_date',
  },
  certificationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
    defaultValue: 'pending',
    field: 'certification_status',
  },
}, {
  tableName: 'farmers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Farmer;