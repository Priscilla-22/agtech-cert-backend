const express = require('express');
const router = express.Router();
const db = require('../models');
const Inspection = require('../models/Inspection');
const { validateInspection } = require('../utils/validation');
const { CHECKLIST_QUESTIONS, createChecklist, calculateComplianceScore, isEligibleForCertification, validateChecklist, isChecklistComplete } = require('../utils/inspection');
const { generateCertificateNumber, calculateExpiryDate, generateCertificatePDF } = require('../utils/pdfGenerator');
const PDFService = require('../services/pdfService');

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
 * /api/inspections/status-distribution:
 *   get:
 *     summary: Get inspection status distribution
 *     description: Get the distribution of inspections by status for analytics and debugging
 *     tags: [Inspections]
 *     responses:
 *       200:
 *         description: Status distribution retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distribution:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   example:
 *                     "scheduled": 5
 *                     "in_progress": 3
 *                     "completed": 12
 *                     "cancelled": 1
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/status-distribution', async (req, res) => {
  try {
    const inspections = await db.findAll('inspections');
    const statusCounts = {};
    const allStatuses = inspections.map(i => i.status);

    allStatuses.forEach(status => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    res.json({
      total: inspections.length,
      statusCounts,
      allStatuses,
      validStatuses: ['scheduled', 'in_progress', 'completed', 'failed', 'cancelled']
    });
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({ error: 'Failed to fetch status distribution' });
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

/**
 * @swagger
 * /api/inspections:
 *   post:
 *     summary: Create a new inspection
 *     description: Schedule a new farm inspection
 *     tags: [Inspections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmId
 *               - inspectorId
 *               - scheduledDate
 *             properties:
 *               farmId:
 *                 type: integer
 *                 description: ID of the farm to inspect
 *                 example: 1
 *               inspectorId:
 *                 type: integer
 *                 description: ID of the assigned inspector
 *                 example: 1
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *                 description: Scheduled inspection date
 *                 example: "2025-02-01"
 *               notes:
 *                 type: string
 *                 description: Additional notes for the inspection
 *                 example: "Initial organic certification inspection"
 *               checklist:
 *                 type: object
 *                 description: Inspection checklist items
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Inspection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inspection'
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["farmId is required", "scheduledDate must be a valid date"]
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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
      status: req.body.status || 'scheduled',
      complianceScore,
      checklist: req.body.checklist || {
        syntheticInputs: null,
        bufferZones: null,
        organicSeed: null,
        compostManagement: null,
        recordKeeping: null
      }
    };

    const inspection = await db.Inspection.create(inspectionData);
    const mappedInspection = db.Inspection.mapFromDatabase(inspection);
    res.status(201).json(mappedInspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

/**
 * @swagger
 * /api/inspections/{id}:
 *   put:
 *     summary: Update an inspection
 *     description: Update inspection details and status
 *     tags: [Inspections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inspection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["scheduled", "in_progress", "completed", "cancelled"]
 *                 description: Inspection status
 *               inspectionDate:
 *                 type: string
 *                 format: date
 *                 description: Actual inspection date
 *               notes:
 *                 type: string
 *                 description: Inspection notes
 *               checklist:
 *                 type: object
 *                 description: Updated checklist items
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Compliance score
 *     responses:
 *       200:
 *         description: Inspection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inspection'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', async (req, res) => {
  try {
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    let updateData = { ...req.body };
    const oldStatus = inspection.status;
    const newStatus = req.body.status;

    // Recalculate compliance score if checklist is updated
    if (req.body.checklist) {
      updateData.complianceScore = calculateComplianceScore(req.body.checklist);
    }

    // Handle score field from frontend
    if (req.body.score !== undefined) {
      updateData.complianceScore = req.body.score;
    }

    // Set completion date when submitting
    if (req.body.status === 'Submitted') {
      updateData.completedDate = new Date().toISOString().split('T')[0];
    }

    const updatedInspection = await Inspection.update(parseInt(req.params.id), updateData);

    // Automatic certificate generation for high-scoring completed inspections
    let certificateGenerated = false;
    let generatedCertificate = null;

    if (req.body.status === 'completed' && (req.body.score >= 80 || updateData.complianceScore >= 80)) {
      try {
        // Check if certificate already exists for this farm
        const existingCertificates = await db.query('SELECT * FROM certificates WHERE farm_id = ? AND status = "active"', [inspection.farm_id]);

        if (existingCertificates.length === 0) {
          // Get farm and farmer data
          const farm = await db.findById('farms', inspection.farm_id);
          const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;

          if (farm && farmer) {
            const certificateNo = generateCertificateNumber();
            const issueDate = new Date().toISOString().split('T')[0];
            const expiryDate = calculateExpiryDate(issueDate);

            // Generate PDF certificate
            const pdfResult = await generateCertificatePDF({
              farmer,
              farm,
              inspection: updatedInspection,
              certificateNo,
              issueDate,
              expiryDate
            });

            const certificateData = {
              farm_id: inspection.farm_id,
              certificate_number: certificateNo,
              issue_date: issueDate,
              expiry_date: expiryDate,
              status: 'active',
              certification_body: 'Kenya Organic Agriculture Network',
              scope: 'Organic crop production',
              crop_types: farm.crop_types || JSON.stringify([]),
              pdf_url: pdfResult.pdfUrl,
              issued_by: null,
              created_at: new Date(),
              updated_at: new Date()
            };

            generatedCertificate = await db.create('certificates', certificateData);
            certificateGenerated = true;

            console.log(`Certificate automatically generated for inspection ${req.params.id} with score ${req.body.score || updateData.complianceScore}`);
          }
        }
      } catch (certError) {
        console.warn('Failed to auto-generate certificate:', certError);
        // Don't fail the inspection update if certificate generation fails
      }
    }

    // Track status history if status changed
    if (newStatus && oldStatus !== newStatus) {
      try {
        await db.query(`
          INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          'inspections',
          parseInt(req.params.id),
          'UPDATE',
          JSON.stringify({ status: oldStatus }),
          JSON.stringify({ status: newStatus, reason: req.body.reason || 'Status change via system' }),
          new Date()
        ]);
      } catch (auditError) {
        console.warn('Failed to log status change:', auditError);
      }
    }

    const mappedInspection = db.mapFieldsFromDatabase(updatedInspection);

    // Include certificate information in response if one was generated
    const response = {
      ...mappedInspection,
      ...(certificateGenerated && {
        certificateGenerated: true,
        certificate: db.mapFieldsFromDatabase(generatedCertificate),
        message: 'Inspection completed and certificate automatically generated!'
      })
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({ error: 'Failed to update inspection' });
  }
});

/**
 * @swagger
 * /api/inspections/{id}/approve:
 *   post:
 *     summary: Approve inspection and generate certificate
 *     description: Approve a submitted inspection and automatically generate a certificate
 *     tags: [Inspections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inspection ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for approval
 *                 example: "Farm meets all organic certification standards"
 *     responses:
 *       200:
 *         description: Inspection approved and certificate generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inspection approved and certificate generated"
 *                 certificate:
 *                   $ref: '#/components/schemas/Certificate'
 *       400:
 *         description: Bad request - inspection cannot be approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Only submitted inspections can be approved"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    if (inspection.status.toLowerCase() !== 'completed') {
      return res.status(400).json({ error: 'Only completed inspections can be approved for certification' });
    }

    const score = inspection.score || inspection.compliance_score;
    if (!isEligibleForCertification(score)) {
      return res.status(400).json({
        error: `Cannot approve: Compliance score is ${score}%. Minimum required is 80%`
      });
    }

    // Keep the inspection status as 'completed' - no need to change it
    // await db.update('inspections', parseInt(req.params.id), { status: 'approved' });

    // Get farm and farmer data
    const farm = await db.findById('farms', inspection.farm_id);
    const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;

    if (!farm || !farmer) {
      return res.status(400).json({ error: 'Farm or farmer data not found' });
    }

    const certificateNo = generateCertificateNumber();
    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDate = calculateExpiryDate(issueDate);

    const certificateData = {
      farm_id: inspection.farm_id,
      certificate_number: certificateNo,
      issue_date: issueDate,
      expiry_date: expiryDate,
      status: 'active',
      certification_body: 'Kenya Organic Agriculture Network',
      scope: 'Organic crop production',
      crop_types: farm.crop_types || JSON.stringify([]),
      pdf_url: null, // Will be set after PDF generation
      issued_by: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Generate PDF certificate using PDFService
    const pdfBuffer = await PDFService.generateCertificatePDF(certificateData, farm, farmer);

    // Save certificate to database
    const certificate = await db.create('certificates', certificateData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateNo}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF buffer directly
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Failed to approve inspection and generate certificate' });
  }
});

/**
 * @swagger
 * /api/inspections/{id}/reject:
 *   post:
 *     summary: Reject inspection
 *     description: Reject a submitted inspection with a reason
 *     tags: [Inspections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inspection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: "Farm does not meet organic certification standards"
 *     responses:
 *       200:
 *         description: Inspection rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inspection rejected successfully"
 *                 inspection:
 *                   $ref: '#/components/schemas/Inspection'
 *       400:
 *         description: Bad request - inspection cannot be rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Only submitted inspections can be rejected"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/reject', async (req, res) => {
  try {
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    if (inspection.status.toLowerCase() !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted inspections can be rejected' });
    }

    const updatedInspection = await db.update('inspections', parseInt(req.params.id), {
      status: 'rejected',
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

/**
 * @swagger
 * /api/inspections/{id}/history:
 *   get:
 *     summary: Get inspection status history
 *     description: Retrieve the complete status change history for an inspection
 *     tags: [Inspections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inspection ID
 *     responses:
 *       200:
 *         description: Inspection history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inspection:
 *                   $ref: '#/components/schemas/Inspection'
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: When the change occurred
 *                       oldStatus:
 *                         type: string
 *                         description: Previous status
 *                       newStatus:
 *                         type: string
 *                         description: New status
 *                       reason:
 *                         type: string
 *                         description: Reason for the change
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/history', async (req, res) => {
  try {
    const inspection = await db.findById('inspections', parseInt(req.params.id));
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    // Get status history from audit logs
    const history = await db.query(`
      SELECT
        id,
        old_values,
        new_values,
        timestamp
      FROM audit_logs
      WHERE table_name = 'inspections'
        AND record_id = ?
        AND action = 'UPDATE'
        AND JSON_EXTRACT(new_values, '$.status') IS NOT NULL
      ORDER BY timestamp DESC
    `, [parseInt(req.params.id)]);

    // Format the history data
    const formattedHistory = history.map(entry => {
      const oldValues = JSON.parse(entry.old_values || '{}');
      const newValues = JSON.parse(entry.new_values || '{}');
      return {
        id: entry.id,
        oldStatus: oldValues.status,
        newStatus: newValues.status,
        reason: newValues.reason || 'Status change',
        timestamp: entry.timestamp
      };
    });

    res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching inspection history:', error);
    res.status(500).json({ error: 'Failed to fetch inspection history' });
  }
});

/**
 * @swagger
 * /api/inspections/{id}:
 *   delete:
 *     summary: Delete inspection
 *     description: Delete an inspection and any associated certificates
 *     tags: [Inspections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inspection ID
 *     responses:
 *       200:
 *         description: Inspection deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inspection deleted successfully"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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