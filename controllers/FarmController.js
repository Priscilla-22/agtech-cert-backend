const BaseController = require('./BaseController');
const { Farm, Farmer, Field } = require('../models');
const { Op } = require('sequelize');

class FarmController extends BaseController {
  constructor() {
    super(Farm);
  }

  async getAll(req, res) {
    try {
      const farms = await this.findAll({
        include: [
          {
            model: Farmer,
            as: 'farmer',
            where: { userId: req.user.id }
          },
          { model: Field, as: 'fields' }
        ]
      });

      this.handleSuccess({ data: farms }, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req, res) {
    try {
      const farm = await this.findById(req.params.id, {
        include: [
          {
            model: Farmer,
            as: 'farmer',
            where: { userId: req.user.id }
          },
          { model: Field, as: 'fields' }
        ]
      });

      if (!farm) {
        return res.status(404).json({ error: 'Farm not found' });
      }

      this.handleSuccess(farm, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getByFarmerId(req, res) {
    try {
      const farmer = await Farmer.findOne({
        where: { id: req.params.farmerId, userId: req.user.id }
      });

      if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
      }

      const farms = await this.findAll({
        where: { farmerId: req.params.farmerId },
        include: [{ model: Field, as: 'fields' }]
      });

      this.handleSuccess({ data: farms }, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async create(req, res) {
    try {
      const farmer = await Farmer.findOne({
        where: { id: req.body.farmerId, userId: req.user.id }
      });

      if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
      }

      const farmData = {
        ...req.body,
        totalArea: req.body.totalArea || req.body.size,
        organicArea: req.body.organicArea || req.body.cultivatedSize
      };

      const farm = await this.createRecord(farmData);
      this.handleSuccess(farm, res, 201);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      const farm = await this.findById(req.params.id, {
        include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
      });

      if (!farm) {
        return res.status(404).json({ error: 'Farm not found' });
      }

      const updatedFarm = await this.updateRecord(req.params.id, req.body);
      this.handleSuccess(updatedFarm, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async delete(req, res) {
    try {
      const farm = await this.findById(req.params.id, {
        include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
      });

      if (!farm) {
        return res.status(404).json({ error: 'Farm not found' });
      }

      const deleted = await this.deleteRecord(req.params.id);
      if (deleted) {
        this.handleSuccess({ message: 'Farm deleted successfully' }, res);
      } else {
        res.status(404).json({ error: 'Farm not found' });
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }
}

module.exports = new FarmController();