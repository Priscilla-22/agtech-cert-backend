const express = require('express');
const router = express.Router();
const { Certificate, Farm, Farmer, Inspection } = require('../models');
const PDFService = require('../services/pdfService');



/**
 * @swagger
 * components:
 *   schemas:
 *     Certificate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique certificate identifier
 *         certificateNumber:
 *           type: string
 *           description: Unique certificate number
 *           example: "ORG-2023-001"
 *         farmId:
 *           type: string
 *           description: ID of the certified farm
 *         issueDate:
 *           type: string
 *           format: date
 *           description: Certificate issue date
 *           example: "2023-01-15"
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Certificate expiry date
 *           example: "2026-01-15"
 *         status:
 *           type: string
 *           enum: ["active", "expired", "revoked", "suspended"]
 *           description: Certificate status
 *           example: "active"
 *         certificationBody:
 *           type: string
 *           description: Name of the certification body
 *           example: "Kenya Organic Agriculture Network"
 *         scope:
 *           type: string
 *           description: Certification scope
 *           example: "Organic crop production"
 *         pdfUrl:
 *           type: string
 *           description: URL to download the PDF certificate
 *           example: "/certificates/ORG-2023-001.pdf"
 *         farm:
 *           $ref: '#/components/schemas/Farm'
 *         farmer:
 *           $ref: '#/components/schemas/Farmer'
 *         inspections:
 *           type: array
 *           description: Associated inspections
 */

/**
 * @swagger
 * /api/certificates:
 *   get:
 *     summary: Get all certificates
 *     description: Retrieve a list of all organic certificates
 *     tags: [Certificates]
 *     responses:
 *       200:
 *         description: List of certificates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Certificate'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req, res) => {
  try {
    const certificates = await Certificate.findAll();

    const enrichedCertificates = await Promise.all(certificates.map(async (certificate) => {
      const farm = await Farm.findById(certificate.farm_id);
      const farmer = farm ? await Farmer.findById(farm.farmer_id) : null;
      const mappedCertificate = Certificate.mapFromDatabase(certificate);

      let cropTypes = mappedCertificate.cropTypes;
      if ((!cropTypes || (Array.isArray(cropTypes) && cropTypes.length === 0)) && farm && farm.crop_types) {
        try {
          cropTypes = typeof farm.crop_types === 'string' ? JSON.parse(farm.crop_types) : farm.crop_types;
        } catch (e) {
          cropTypes = null;
        }
      }

      return {
        ...mappedCertificate,
        cropTypes: cropTypes,
        farmName: farm ? farm.farm_name : 'Unknown',
        farmerName: farmer ? farmer.name : 'Unknown'
      };
    }));

    res.json(enrichedCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get certificate by ID
 *     description: Retrieve detailed information for a specific certificate including farm, farmer, and inspection details
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique certificate identifier
 *     responses:
 *       200:
 *         description: Certificate details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Certificate'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(parseInt(req.params.id));
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const farm = await Farm.findById(certificate.farm_id);
    const farmer = farm ? await Farmer.findById(farm.farmer_id) : null;
    const inspections = await Inspection.findByFarmId(certificate.farm_id);

    const mappedCertificate = Certificate.mapFromDatabase(certificate);
    const mappedFarm = farm ? Farm.mapFromDatabase(farm) : null;
    const mappedFarmer = farmer ? Farmer.mapFromDatabase(farmer) : null;
    const mappedInspections = inspections.map(inspection => Inspection.mapFromDatabase(inspection));

    res.json({
      ...mappedCertificate,
      farm: mappedFarm,
      farmer: mappedFarmer,
      inspections: mappedInspections
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

/**
 * @swagger
 * /api/certificates:
 *   post:
 *     summary: Create a new certificate
 *     description: Issue a new organic certificate for a farm
 *     tags: [Certificates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmId
 *               - issueDate
 *               - expiryDate
 *               - cropTypes
 *             properties:
 *               farmId:
 *                 type: string
 *                 description: ID of the farm to certify
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Certificate issue date
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 description: Certificate expiry date
 *               cropTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of certified crop types
 *     responses:
 *       201:
 *         description: Certificate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Certificate'
 *       400:
 *         description: Bad request - invalid data
 *       404:
 *         description: Farm not found
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  try {
    const { farmId, issueDate, expiryDate, cropTypes } = req.body;

    if (!farmId || !issueDate || !expiryDate) {
      return res.status(400).json({ error: 'farmId, issueDate, and expiryDate are required' });
    }

    const farm = await Farm.findById(parseInt(farmId));
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const certificate = await Certificate.create({
      farmId: parseInt(farmId),
      issueDate,
      expiryDate,
      cropTypes
    });

    if (!certificate) {
      return res.status(500).json({ error: 'Failed to create certificate' });
    }

    const farmer = await Farmer.findById(farm.farmer_id);
    const mappedCertificate = Certificate.mapFromDatabase(certificate);

    res.status(201).json({
      ...mappedCertificate,
      farmName: farm.farm_name,
      farmerName: farmer ? farmer.name : 'Unknown'
    });

  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}/pdf:
 *   get:
 *     summary: Download certificate PDF
 *     description: Generate and download the PDF version of the certificate
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique certificate identifier
 *     responses:
 *       200:
 *         description: PDF certificate downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const certificate = await Certificate.findById(parseInt(req.params.id));
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const farm = await Farm.findById(certificate.farm_id);
    const farmer = farm ? await Farmer.findById(farm.farmer_id) : null;

    if (!farm || !farmer) {
      return res.status(404).json({ error: 'Associated farm or farmer not found' });
    }

    // Use PDFService to generate certificate PDF (same as inspections route)
    const certificateData = {
      farmId: certificate.farm_id,
      issueDate: certificate.issue_date,
      expiryDate: certificate.expiry_date,
      status: certificate.status,
      certificationBody: certificate.certification_body,
      scope: certificate.scope
    };

    const pdfBuffer = await PDFService.generateCertificatePDF(certificateData, farm, farmer);

    const pdfFileName = `certificate-${certificate.certificate_number || certificate.certificateNumber}.pdf`;

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF buffer directly
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate certificate PDF' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}/renew:
 *   post:
 *     summary: Renew certificate
 *     description: Create a renewal request for an existing certificate
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique certificate identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for renewal
 *               requestedExpiryDate:
 *                 type: string
 *                 format: date
 *                 description: Requested new expiry date
 *     responses:
 *       200:
 *         description: Renewal request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 renewalId:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/renew', async (req, res) => {
  try {
    const certificate = await Certificate.findById(parseInt(req.params.id));
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const { reason, requestedExpiryDate } = req.body;

    // Update certificate status to renewal_pending
    await Certificate.update(parseInt(req.params.id), {
      status: 'renewal_pending'
    });

    // For now, just return success. In a real system, you'd create a renewal request record
    res.json({
      message: 'Renewal request submitted successfully',
      renewalId: `renewal-${certificate.id}-${Date.now()}`,
      status: 'renewal_pending'
    });

  } catch (error) {
    console.error('Renewal request error:', error);
    res.status(500).json({ error: 'Failed to submit renewal request' });
  }
});

module.exports = router;
