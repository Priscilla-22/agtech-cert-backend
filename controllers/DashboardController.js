const { Farmer, Farm, Inspection, Certificate } = require('../models');
const { Op } = require('sequelize');

class DashboardController {
  async getStats(req, res) {
    try {
      const [
        totalFarmers,
        totalFarms,
        totalInspections,
        totalCertificates,
        completedInspections,
        activeCertificates,
        expiredCertificates
      ] = await Promise.all([
        Farmer.count({ where: { userId: req.user.id } }),
        Farm.count({
          include: [{
            model: Farmer,
            as: 'farmer',
            where: { userId: req.user.id }
          }]
        }),
        Inspection.count({
          include: [{
            model: Farm,
            as: 'farm',
            include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
          }]
        }),
        Certificate.count({
          include: [{
            model: Farm,
            as: 'farm',
            include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
          }]
        }),
        Inspection.count({
          where: { status: 'completed' },
          include: [{
            model: Farm,
            as: 'farm',
            include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
          }]
        }),
        Certificate.count({
          where: { status: 'active' },
          include: [{
            model: Farm,
            as: 'farm',
            include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
          }]
        }),
        Certificate.count({
          where: { status: 'expired' },
          include: [{
            model: Farm,
            as: 'farm',
            include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
          }]
        })
      ]);

      res.json({
        totalFarmers,
        totalFarms,
        totalInspections,
        totalCertificates,
        completedInspections,
        activeCertificates,
        expiredCertificates,
        certificationRate: totalInspections > 0 ? ((totalCertificates / totalInspections) * 100).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }
}

module.exports = new DashboardController();