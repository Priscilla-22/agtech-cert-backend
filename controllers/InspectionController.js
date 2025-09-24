const BaseController = require('./BaseController');
const { Inspection, Farm, Farmer, Inspector, Certificate } = require('../models');
const PDFService = require('../utils/pdfGenerator');

class InspectionController extends BaseController {
  constructor() {
    super(Inspection);
  }

  async getAll(req, res) {
    try {
      const inspections = await this.findAll({
        include: [
          {
            model: Farm,
            as: 'farm',
            include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
          },
          { model: Inspector, as: 'inspector' }
        ]
      });

      const transformedInspections = inspections.map(inspection => ({
        id: inspection.id,
        farmId: inspection.farmId,
        farmName: inspection.farm?.name,
        farmerName: inspection.farm?.farmer?.name,
        inspectorId: inspection.inspectorId,
        inspectorName: inspection.inspector?.name,
        scheduledDate: inspection.scheduledDate,
        completedDate: inspection.completedDate,
        status: inspection.status,
        score: inspection.score || inspection.complianceScore,
        findings: inspection.findings,
        recommendations: inspection.recommendations,
        createdAt: inspection.createdAt,
        updatedAt: inspection.updatedAt
      }));

      this.handleSuccess({ data: transformedInspections }, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getById(req, res) {
    try {
      const inspection = await this.findById(req.params.id, {
        include: [
          {
            model: Farm,
            as: 'farm',
            include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
          },
          { model: Inspector, as: 'inspector' }
        ]
      });

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' });
      }

      this.handleSuccess(inspection, res);
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

      const inspection = await this.createRecord(req.body);
      this.handleSuccess(inspection, res, 201);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async update(req, res) {
    try {
      const inspection = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' });
      }

      const updatedInspection = await this.updateRecord(req.params.id, req.body);
      this.handleSuccess(updatedInspection, res);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async approve(req, res) {
    try {
      const inspection = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' });
      }

      if (inspection.status.toLowerCase() !== 'completed') {
        return res.status(400).json({ error: 'Only completed inspections can be approved for certification' });
      }

      const score = inspection.score || inspection.complianceScore;
      if (!this.isEligibleForCertification(score)) {
        return res.status(400).json({
          error: `Cannot approve: Compliance score is ${score}%. Minimum required is 80%`
        });
      }

      const certificateNo = this.generateCertificateNumber();
      const issueDate = new Date().toISOString().split('T')[0];
      const expiryDate = this.calculateExpiryDate(issueDate);

      const certificateData = {
        farmId: inspection.farmId,
        inspectionId: inspection.id,
        certificateNumber: certificateNo,
        issueDate: issueDate,
        expiryDate: expiryDate,
        status: 'active',
        certificationBody: 'Kenya Organic Agriculture Network',
        scope: 'Organic crop production'
      };

      const pdfBuffer = await PDFService.generateCertificatePDF(
        certificateData,
        inspection.farm,
        inspection.farm.farmer
      );

      await Certificate.create(certificateData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateNo}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  isEligibleForCertification(score) {
    return score >= 80;
  }

  generateCertificateNumber() {
    const timestamp = Date.now();
    return `CERT-${timestamp}`;
  }

  calculateExpiryDate(issueDate) {
    const date = new Date(issueDate);
    date.setFullYear(date.getFullYear() + 3);
    return date.toISOString().split('T')[0];
  }

  async delete(req, res) {
    try {
      const inspection = await this.findById(req.params.id, {
        include: [{
          model: Farm,
          as: 'farm',
          include: [{ model: Farmer, as: 'farmer', where: { userId: req.user.id } }]
        }]
      });

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' });
      }

      const deleted = await this.deleteRecord(req.params.id);
      if (deleted) {
        this.handleSuccess({ message: 'Inspection deleted successfully' }, res);
      } else {
        res.status(404).json({ error: 'Inspection not found' });
      }
    } catch (error) {
      this.handleError(error, res);
    }
  }
}

module.exports = new InspectionController();