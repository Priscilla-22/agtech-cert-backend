const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Inspection = sequelize.define('Inspection', {
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
  inspectorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'inspector_id',
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'scheduled_date',
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_date',
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'failed', 'cancelled'),
    defaultValue: 'scheduled',
  },
  checklist: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  complianceScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'compliance_score',
  },
  findings: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recommendations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  nonCompliances: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'non_compliances',
  },
  photos: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  reportPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'report_path',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'inspections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Inspection;