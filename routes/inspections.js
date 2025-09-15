const express = require('express');
const router = express.Router();
const db = require('../models');
const { validateInspection } = require('../utils/validation');
const { CHECKLIST_QUESTIONS, createChecklist, calculateComplianceScore, isEligibleForCertification, validateChecklist, isChecklistComplete } = require('../utils/inspection');
const { generateCertificateNumber, calculateExpiryDate, generateCertificatePDF } = require('../utils/pdfGenerator');

/**
 * @swagger
 * /api/inspections/checklist:
 *   get:
 *     summary: Get inspection checklist questions
 *     description: Retrieve the standard inspection checklist questions
 *     tags: [Inspections]
 *     responses:
 *       200:
 *         description: Checklist questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       question:
 *                         type: string
 *                       category:
 *                         type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/checklist', async (req, res) => {
  try {
    res.json({ questions: CHECKLIST_QUESTIONS });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

/**
 * @swagger
 * /api/inspections:
 *   get:
 *     summary: Get all inspections
 *     description: Retrieve a list of all inspections with farm and farmer details
 *     tags: [Inspections]
 *     responses:
 *       200:
 *         description: List of inspections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   farmId:
 *                     type: string
 *                   farmName:
 *                     type: string
 *                   farmerName:
 *                     type: string
 *                   inspectionDate:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                     enum: [scheduled, in_progress, completed, failed]
 *                   score:
 *                     type: number
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req, res) => {
  try {
    const inspections = await db.findAll('inspections');

    // Enrich with farm and farmer data
    const enrichedInspections = await Promise.all(inspections.map(async (inspection) => {
      const farm = await db.findById('farms', inspection.farm_id);
      const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;
      const mappedInspection = db.mapFieldsFromDatabase(inspection);

      return {
        ...mappedInspection,
        farmName: farm ? farm.farm_name : 'Unknown',
        farmerName: farmer ? farmer.name : 'Unknown'
      };
    }));

    res.json(enrichedInspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
});

/**
 * @swagger
 * /api/inspections/{id}:
 *   get:
 *     summary: Get inspection by ID
 *     description: Retrieve detailed information for a specific inspection
 *     tags: [Inspections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique inspection identifier
 *     responses:
 *       200:
 *         description: Inspection details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 farmId:
 *                   type: string
 *                 farmName:
 *                   type: string
 *                 farmerName:
 *                   type: string
 *                 inspectionDate:
 *                   type: string
 *                   format: date
 *                 status:
 *                   type: string
 *                 checklist:
 *                   type: object
 *                 notes:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const farm = await db.findById('farms', inspection.farm_id);
    const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;

    const mappedInspection = db.mapFieldsFromDatabase(inspection);
    const mappedFarm = farm ? db.mapFieldsFromDatabase(farm) : null;
    const mappedFarmer = farmer ? db.mapFieldsFromDatabase(farmer) : null;

    res.json({
      ...mappedInspection,
      farm: mappedFarm,
      farmer: mappedFarmer
    });
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ error: 'Failed to fetch inspection' });
  }
});

// POST /api/inspections - Create new inspection
router.post('/', async (req, res) => {
  try {
    const errors = validateInspection(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Verify farm exists
    const farm = await db.findById('farms', parseInt(req.body.farmId));
    if (!farm) {
      return res.status(400).json({ error: 'Farm not found' });
    }

    const farmer = await db.findById('farmers', farm.farmer_id);
    if (!farmer) {
      return res.status(400).json({ error: 'Farmer not found' });
    }

    const checklist = req.body.checklist || createChecklist();
    const complianceScore = calculateComplianceScore(checklist);

    const inspectionData = {
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0],
      status: req.body.status || 'Draft',
      complianceScore,
      checklist: req.body.checklist || {
        syntheticInputs: null,
        bufferZones: null,
        organicSeed: null,
        compostManagement: null,
        recordKeeping: null
      }
    };

    const inspection = await db.create('inspections', inspectionData);
    const mappedInspection = db.mapFieldsFromDatabase(inspection);
    res.status(201).json(mappedInspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

// PUT /api/inspections/:id - Update inspection
router.put('/:id', async (req, res) => {
  try {
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    let updateData = { ...req.body };

    // Recalculate compliance score if checklist is updated
    if (req.body.checklist) {
      updateData.complianceScore = calculateComplianceScore(req.body.checklist);
    }

    // Set completion date when submitting
    if (req.body.status === 'Submitted') {
      updateData.completedDate = new Date().toISOString().split('T')[0];
    }

    const updatedInspection = await db.update('inspections', parseInt(req.params.id), updateData);
    const mappedInspection = db.mapFieldsFromDatabase(updatedInspection);
    res.json(mappedInspection);
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({ error: 'Failed to update inspection' });
  }
});

// POST /api/inspections/:id/approve - Approve inspection and generate certificate
router.post('/:id/approve', async (req, res) => {
  try {
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    if (inspection.status !== 'Submitted') {
      return res.status(400).json({ error: 'Only submitted inspections can be approved' });
    }

    if (!isEligibleForCertification(inspection.compliance_score)) {
      return res.status(400).json({
        error: `Cannot approve: Compliance score is ${inspection.compliance_score}%. Minimum required is 80%`
      });
    }

    // Update inspection status
    await db.update('inspections', parseInt(req.params.id), { status: 'Approved' });

    // Get farm and farmer data
    const farm = await db.findById('farms', inspection.farm_id);
    const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;

    if (!farm || !farmer) {
      return res.status(400).json({ error: 'Farm or farmer data not found' });
    }

    const certificateNo = generateCertificateNumber();
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate = calculateExpiryDate(issueDate);

    // Generate PDF certificate
    const pdfResult = await generateCertificatePDF({
      farmer,
      farm,
      inspection,
      certificateNo,
      issueDate,
      expiryDate
    });

    const certificateData = {
      ...req.body,
      certificateNo,
      issueDate,
      expiryDate,
      pdfUrl: pdfResult.pdfUrl
    };

    const certificate = await db.create('certificates', certificateData);
    const updatedInspection = await db.findById('inspections', parseInt(req.params.id));

    const mappedInspection = db.mapFieldsFromDatabase(updatedInspection);
    const mappedCertificate = db.mapFieldsFromDatabase(certificate);

    res.json({
      message: 'Inspection approved and certificate generated successfully',
      inspection: mappedInspection,
      certificate: mappedCertificate
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Failed to approve inspection and generate certificate' });
  }
});

// POST /api/inspections/:id/reject - Reject inspection
router.post('/:id/reject', async (req, res) => {
  try {
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    if (inspection.status !== 'Submitted') {
      return res.status(400).json({ error: 'Only submitted inspections can be rejected' });
    }

    const updatedInspection = await db.update('inspections', parseInt(req.params.id), {
      status: 'Rejected',
      notes: req.body.reason || inspection.notes
    });

    const mappedInspection = db.mapFieldsFromDatabase(updatedInspection);

    res.json({
      message: 'Inspection rejected',
      inspection: mappedInspection
    });
  } catch (error) {
    console.error('Error rejecting inspection:', error);
    res.status(500).json({ error: 'Failed to reject inspection' });
  }
});

// DELETE /api/inspections/:id - Delete inspection
router.delete('/:id', async (req, res) => {
  try {
    // Check if inspection exists first
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    // Delete any associated certificates
    const certificates = await db.findBy('certificates', { farm_id: inspection.farm_id });
    for (const certificate of certificates) {
      await db.delete('certificates', certificate.id);
    }

    await db.delete('inspections', parseInt(req.params.id));
    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    res.status(500).json({ error: 'Failed to delete inspection' });
  }
});

module.exports = router;