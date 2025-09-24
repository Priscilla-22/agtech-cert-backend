const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Certificate = sequelize.define('Certificate', {
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
  inspectionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'inspection_id',
  },
  certificateNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    field: 'certificate_number',
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'issue_date',
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expiry_date',
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'revoked', 'renewal_pending'),
    defaultValue: 'active',
  },
  certificationBody: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'certification_body',
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  pdfPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'pdf_path',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'certificates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Certificate;