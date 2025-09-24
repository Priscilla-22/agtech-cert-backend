const BaseController = require('./BaseController');
const { Field, Farm, Farmer } = require('../models');

class FieldController extends BaseController {
  constructor() {
    super(Field);
  }

  async getAll(req, res) {
    try {
      const { farmId } = req.query;
      const whereClause = {};

      if (farmId) {
        const farm = await Farm.findOne({
          where: { id: farmId },
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        });

        if (!farm) {
          return res.status(404).json({ error: 'Farm not found' });
        }

        whereClause.farmId = farmId;
      }

      const fields = await this.findAll({
        where: whereClause,
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      this.handleSuccess({ data: fields }, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req, res) {
    try {
      const field = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!field) {
        return res.status(404).json({ error: 'Field not found' });
      }

      this.handleSuccess(field, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getByFarmId(req, res) {
    try {
      const farm = await Farm.findOne({
        where: { id: req.params.farmId },
        include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
      });

      if (!farm) {
        return res.status(404).json({ error: 'Farm not found' });
      }

      const fields = await this.findAll({
        where: { farmId: req.params.farmId }
      });

      this.handleSuccess({ data: fields }, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async create(req, res) {
    try {
      const farm = await Farm.findOne({
        where: { id: req.body.farmId },
        include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
      });

      if (!farm) {
        return res.status(404).json({ error: 'Farm not found' });
      }

      const field = await this.createRecord(req.body);
      this.handleSuccess(field, res, 201);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      const field = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!field) {
        return res.status(404).json({ error: 'Field not found' });
      }

      const updatedField = await this.updateRecord(req.params.id, req.body);
      this.handleSuccess(updatedField, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async delete(req, res) {
    try {
      const field = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!field) {
        return res.status(404).json({ error: 'Field not found' });
      }

      const deleted = await this.deleteRecord(req.params.id);
      if (deleted) {
        this.handleSuccess({ message: 'Field deleted successfully' }, res);
      } else {
        res.status(404).json({ error: 'Field not found' });
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }
}

module.exports = new FieldController();