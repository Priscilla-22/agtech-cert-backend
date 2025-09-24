const BaseController = require('./BaseController');
const { Inspector } = require('../models');

class InspectorController extends BaseController {
  constructor() {
    super(Inspector);
  }

  async getAll(req, res) {
    try {
      const inspectors = await this.findAll({
        where: { userId: req.user.id }
      });

      this.handleSuccess({ data: inspectors }, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req, res) {
    try {
      const inspector = await this.findById(req.params.id);

      if (!inspector || inspector.userId !== req.user.id) {
        return res.status(404).json({ error: 'Inspector not found' });
      }

      this.handleSuccess(inspector, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async create(req, res) {
    try {
      const inspectorData = {
        ...req.body,
        userId: req.user.id
      };

      const inspector = await this.createRecord(inspectorData);
      this.handleSuccess(inspector, res, 201);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      const inspector = await this.findById(req.params.id);
      if (!inspector || inspector.userId !== req.user.id) {
        return res.status(404).json({ error: 'Inspector not found' });
      }

      const updatedInspector = await this.updateRecord(req.params.id, req.body);
      this.handleSuccess(updatedInspector, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async delete(req, res) {
    try {
      const inspector = await this.findById(req.params.id);
      if (!inspector || inspector.userId !== req.user.id) {
        return res.status(404).json({ error: 'Inspector not found' });
      }

      const deleted = await this.deleteRecord(req.params.id);
      if (deleted) {
        this.handleSuccess({ message: 'Inspector deleted successfully' }, res);
      } else {
        res.status(404).json({ error: 'Inspector not found' });
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }
}

module.exports = new InspectorController();