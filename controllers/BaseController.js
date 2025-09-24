class BaseController {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  async createRecord(data) {
    return await this.model.create(data);
  }

  async updateRecord(id, data) {
    const [updatedRowsCount] = await this.model.update(data, { where: { id } });
    if (updatedRowsCount === 0) return null;
    return await this.findById(id);
  }

  async deleteRecord(id) {
    const deletedRowsCount = await this.model.destroy({ where: { id } });
    return deletedRowsCount > 0;
  }

  handleError(error, res) {
    console.error('Controller error:', error);
    const status = error.name === 'SequelizeValidationError' ? 400 : 500;
    res.status(status).json({
      error: error.message || 'Internal server error'
    });
  }

  handleSuccess(data, res, status = 200) {
    res.status(status).json(data);
  }
}

module.exports = BaseController;