const BaseController = require('./BaseController');
const { Farmer, Farm } = require('../models');
const { Op } = require('sequelize');

class FarmerController extends BaseController {
  constructor() {
    super(Farmer);
  }

  async getAll(req, res) {
    try {
      const {
        search, status, certificationStatus, county, subCounty, farmingType,
        organicExperience, educationLevel, minLandSize, maxLandSize,
        registrationDateFrom, registrationDateTo, limit = 50, offset = 0
      } = req.query;

      const where = { userId: req.user.id };

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { memberNumber: { [Op.like]: `%${search}%` } }
        ];
      }

      if (status) where.status = status;
      if (certificationStatus) where.certificationStatus = certificationStatus;
      if (county) where.county = county;
      if (subCounty) where.subCounty = subCounty;
      if (farmingType) where.farmingType = farmingType;
      if (organicExperience) where.organicExperience = organicExperience;
      if (educationLevel) where.educationLevel = educationLevel;

      if (minLandSize || maxLandSize) {
        where.totalLandSize = {};
        if (minLandSize) where.totalLandSize[Op.gte] = minLandSize;
        if (maxLandSize) where.totalLandSize[Op.lte] = maxLandSize;
      }

      if (registrationDateFrom || registrationDateTo) {
        where.registrationDate = {};
        if (registrationDateFrom) where.registrationDate[Op.gte] = registrationDateFrom;
        if (registrationDateTo) where.registrationDate[Op.lte] = registrationDateTo;
      }

      const farmers = await this.findAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [{ model: Farm, as: 'farms' }]
      });

      this.handleSuccess({
        data: farmers,
        total: farmers.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req, res) {
    try {
      const farmer = await this.findById(req.params.id, {
        include: [{ model: Farm, as: 'farms' }]
      });

      if (!farmer || farmer.userId !== req.user.id) {
        return res.status(404).json({ error: 'Farmer not found' });
      }

      this.handleSuccess(farmer, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async create(req, res) {
    try {
      const memberNumber = await this.generateMemberNumber();
      const farmerData = {
        ...req.body,
        userId: req.user.id,
        memberNumber
      };

      const farmer = await this.createRecord(farmerData);
      this.handleSuccess(farmer, res, 201);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      const farmer = await this.findById(req.params.id);
      if (!farmer || farmer.userId !== req.user.id) {
        return res.status(404).json({ error: 'Farmer not found' });
      }

      const updatedFarmer = await this.updateRecord(req.params.id, req.body);
      this.handleSuccess(updatedFarmer, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async delete(req, res) {
    try {
      const farmer = await this.findById(req.params.id);
      if (!farmer || farmer.userId !== req.user.id) {
        return res.status(404).json({ error: 'Farmer not found' });
      }

      const deleted = await this.deleteRecord(req.params.id);
      if (deleted) {
        this.handleSuccess({ message: 'Farmer deleted successfully' }, res);
      } else {
        res.status(404).json({ error: 'Farmer not found' });
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async generateMemberNumber() {
    const currentYear = new Date().getFullYear();
    const count = await Farmer.count({
      where: {
        memberNumber: { [Op.like]: `MEMBER-${currentYear}-%` }
      }
    });
    const sequentialNumber = String(count + 1).padStart(4, '0');
    return `MEMBER-${currentYear}-${sequentialNumber}`;
  }
}

module.exports = new FarmerController();