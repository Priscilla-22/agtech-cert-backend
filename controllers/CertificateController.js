const BaseController = require('./BaseController');
const { Certificate, Farm, Farmer } = require('../models');

class CertificateController extends BaseController {
  constructor() {
    super(Certificate);
  }

  async getAll(req, res) {
    try {
      const certificates = await this.findAll({
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      const transformedCertificates = certificates.map(cert => ({
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        farmId: cert.farmId,
        farmName: cert.farm?.name,
        farmerName: cert.farm?.farmer?.name,
        cropTypes: cert.farm?.cropTypes || [],
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        status: cert.status,
        certificationBody: cert.certificationBody,
        scope: cert.scope,
        createdAt: cert.createdAt,
        updatedAt: cert.updatedAt
      }));

      this.handleSuccess({ data: transformedCertificates }, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req, res) {
    try {
      const certificate = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      this.handleSuccess(certificate, res);
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

      const certificate = await this.createRecord(req.body);
      this.handleSuccess(certificate, res, 201);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      const certificate = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      const updatedCertificate = await this.updateRecord(req.params.id, req.body);
      this.handleSuccess(updatedCertificate, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async downloadPDF(req, res) {
    try {
      const certificate = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      const PDFService = require('../utils/pdfGenerator');
      const pdfBuffer = await PDFService.generateCertificatePDF(
        certificate,
        certificate.farm,
        certificate.farm.farmer
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async delete(req, res) {
    try {
      const certificate = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      const deleted = await this.deleteRecord(req.params.id);
      if (deleted) {
        this.handleSuccess({ message: 'Certificate deleted successfully' }, res);
      } else {
        res.status(404).json({ error: 'Certificate not found' });
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }
}

module.exports = new CertificateController();