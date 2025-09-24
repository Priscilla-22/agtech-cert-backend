const sequelize = require('../../config/sequelize');

const User = require('./User');
const Farmer = require('./Farmer');
const Farm = require('./Farm');
const Field = require('./Field');
const Inspector = require('./Inspector');
const Inspection = require('./Inspection');
const Certificate = require('./Certificate');

User.hasMany(Farmer, { foreignKey: 'userId', as: 'farmers' });
Farmer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Farmer.hasMany(Farm, { foreignKey: 'farmerId', as: 'farms' });
Farm.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });

Farm.hasMany(Field, { foreignKey: 'farmId', as: 'fields' });
Field.belongsTo(Farm, { foreignKey: 'farmId', as: 'farm' });

Farm.hasMany(Inspection, { foreignKey: 'farmId', as: 'inspections' });
Inspection.belongsTo(Farm, { foreignKey: 'farmId', as: 'farm' });

Inspector.hasMany(Inspection, { foreignKey: 'inspectorId', as: 'inspections' });
Inspection.belongsTo(Inspector, { foreignKey: 'inspectorId', as: 'inspector' });

Farm.hasMany(Certificate, { foreignKey: 'farmId', as: 'certificates' });
Certificate.belongsTo(Farm, { foreignKey: 'farmId', as: 'farm' });

Inspection.hasOne(Certificate, { foreignKey: 'inspectionId', as: 'certificate' });
Certificate.belongsTo(Inspection, { foreignKey: 'inspectionId', as: 'inspection' });

module.exports = {
  sequelize,
  User,
  Farmer,
  Farm,
  Field,
  Inspector,
  Inspection,
  Certificate,
};