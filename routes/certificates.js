const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');
const { Certificate, Farm, Farmer, Inspection } = require('../models');



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
    const inspections = await Inspection.findByFarmId(certificate.farm_id);
    const approvedInspection = inspections.find(i => i.status === 'Approved');

    if (!farm || !farmer) {
      return res.status(404).json({ error: 'Associated farm or farmer not found' });
    }

    const pdfFileName = `certificate-${certificate.certificate_number || certificate.certificateNumber}.pdf`;
    const pdfPath = path.join(__dirname, '../certificates', pdfFileName);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));

    await generateCertificatePDF(doc, certificate, farm, farmer);
    doc.end();

    doc.on('end', async () => {
      const pdfUrl = `/certificates/${pdfFileName}`;
      await Certificate.update(certificate.id, { pdfUrl });

      res.download(pdfPath, pdfFileName, (err) => {
        if (err) {
          console.error('Error sending PDF:', err);
          res.status(500).json({ error: 'Failed to download certificate' });
        }
      });
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate certificate PDF' });
  }
});

// Helper function to generate PDF content
async function generateCertificatePDF(doc, certificate, farm, farmer) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Professional color scheme matching the report
  const headerBlue = '#e6f2ff'; // Light blue header background
  const pesiraBlue = '#1e40af'; // Dark blue for PESIRA text
  const leafGreen = '#22c55e'; // Green for logo elements
  const textDark = '#374151'; // Dark gray for main text
  const borderGray = '#d1d5db'; // Light gray for borders
  const tableHeaderBlue = '#cbd5e1'; // Table header background

  // Header section with light blue background
  doc.rect(0, 0, pageWidth, 120)
     .fillAndStroke(headerBlue, headerBlue);

  // Pesira logo area (left side)
  doc.fillColor(leafGreen)
     .circle(60, 60, 25)
     .fill();

  // Simple leaf shape in logo
  doc.fillColor('#ffffff')
     .fontSize(8)
     .text('🌿', 52, 54);

  // PESIRA title
  doc.fillColor(pesiraBlue)
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('PESIRA', 110, 35);

  // Subtitle
  doc.fillColor(textDark)
     .fontSize(12)
     .font('Helvetica')
     .text('PESIRA - Agricultural Technology Certification Platform', 110, 65);

  // Certificate title
  doc.fillColor(textDark)
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('Organic Certification Certificate', 50, 160, { align: 'center' });

  // Certificate number and generation info
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Certificate Number: ${certificate.certificate_number || certificate.certificateNumber}`, 50, 190);

  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 210);
  doc.text(`Valid until: ${new Date(certificate.expiry_date || certificate.expiryDate).toLocaleDateString()}`, 50, 230);

  // Main content table structure
  const tableStartY = 270;
  const rowHeight = 25;
  const colWidths = [120, 200, 120, 200]; // Four columns
  let currentY = tableStartY;

  // Table header
  doc.rect(50, currentY, pageWidth - 100, rowHeight)
     .fillAndStroke(tableHeaderBlue, borderGray);

  doc.fillColor(textDark)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Field', 60, currentY + 8)
     .text('Value', 180, currentY + 8)
     .text('Field', 310, currentY + 8)
     .text('Value', 430, currentY + 8);

  currentY += rowHeight;

  // Helper function to add table row
  function addTableRow(label1, value1, label2 = '', value2 = '') {
    // Alternating row colors
    const fillColor = (currentY - tableStartY - rowHeight) % (rowHeight * 2) === 0 ? '#ffffff' : '#f9fafb';

    doc.rect(50, currentY, pageWidth - 100, rowHeight)
       .fillAndStroke(fillColor, borderGray);

    doc.fillColor(textDark)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(label1, 60, currentY + 8);

    doc.font('Helvetica')
       .text(value1, 180, currentY + 8, { width: 120 });

    if (label2) {
      doc.font('Helvetica-Bold')
         .text(label2, 310, currentY + 8);

      doc.font('Helvetica')
         .text(value2, 430, currentY + 8, { width: 120 });
    }

    currentY += rowHeight;
  }

  // Certificate information
  addTableRow('Issue Date', new Date(certificate.issue_date || certificate.issueDate).toLocaleDateString(),
             'Status', 'ACTIVE');

  addTableRow('Expiry Date', new Date(certificate.expiry_date || certificate.expiryDate).toLocaleDateString(),
             'Certification Body', 'KOAN');

  // Farmer information
  addTableRow('Farmer Name', farmer.name, 'Phone', farmer.phone);
  addTableRow('Email', farmer.email, 'ID Number', farmer.id_number || 'N/A');
  addTableRow('County', farmer.county || 'N/A', 'Sub County', farmer.sub_county || 'N/A');

  // Farm information
  addTableRow('Farm Name', farm.farm_name || farm.name, 'Location', farm.location);
  addTableRow('Total Area', `${farm.total_area || farm.size || 'N/A'} hectares`,
             'Organic Since', farm.organic_since ? new Date(farm.organic_since).toLocaleDateString() : 'N/A');

  // Certified crops
  const cropTypes = certificate.crop_types || farm.crop_types;
  let displayCrops = 'No crops specified';
  if (cropTypes) {
    try {
      const crops = typeof cropTypes === 'string' ? JSON.parse(cropTypes) : cropTypes;
      displayCrops = Array.isArray(crops) && crops.length > 0 ? crops.join(', ') : 'No crops specified';
    } catch (e) {
      displayCrops = 'No crops specified';
    }
  }

  addTableRow('Certified Crops', displayCrops, 'Farming Type', farm.farming_type || 'N/A');

  // Certification statement
  currentY += 20;
  doc.rect(50, currentY, pageWidth - 100, 60)
     .fillAndStroke('#f0f9ff', pesiraBlue);

  doc.fillColor(pesiraBlue)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('CERTIFICATION STATEMENT', 60, currentY + 10);

  doc.fillColor(textDark)
     .fontSize(11)
     .font('Helvetica')
     .text('This certificate confirms that the above farm and farmer meet the organic', 60, currentY + 30)
     .text('certification standards as set by the Kenya Organic Agriculture Network (KOAN).', 60, currentY + 45);

  // Footer
  const footerY = pageHeight - 80;
  doc.rect(0, footerY, pageWidth, 80)
     .fillAndStroke(headerBlue, headerBlue);

  doc.fillColor(textDark)
     .fontSize(10)
     .font('Helvetica')
     .text('PESIRA - Agricultural Technology Certification', 50, footerY + 20, { align: 'center' });

  // Signature area
  doc.strokeColor(textDark)
     .lineWidth(1)
     .moveTo(400, footerY + 40)
     .lineTo(550, footerY + 40)
     .stroke();

  doc.text('Authorized Signature', 400, footerY + 50);
  doc.text('Certification Officer', 400, footerY + 65);

  // Page number
  doc.fontSize(8)
     .text('Page 1', pageWidth - 100, footerY + 65);
}

/**
 * @swagger
 * /api/certificates/{id}:
 *   delete:
 *     summary: Delete certificate
 *     description: Delete a certificate and its associated PDF file
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
 *         description: Certificate deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(parseInt(req.params.id));
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (certificate.pdf_url || certificate.pdfUrl) {
      const pdfUrl = certificate.pdf_url || certificate.pdfUrl;
      const pdfFileName = path.basename(pdfUrl);
      const pdfPath = path.join(__dirname, '../certificates', pdfFileName);
      try {
        await fs.remove(pdfPath);
      } catch (err) {
        console.error('Error removing PDF file:', err);
      }
    }

    await Certificate.delete(parseInt(req.params.id));
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

/**
 * @swagger
 * /api/certificates/{id}/renew:
 *   post:
 *     summary: Submit certificate renewal request
 *     description: Submit a request to renew an existing certificate
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
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for renewal request
 *                 example: "Certificate expiring soon"
 *               notes:
 *                 type: string
 *                 description: Additional notes for the renewal request
 *                 example: "Farm has maintained organic standards"
 *               requestedExpiryDate:
 *                 type: string
 *                 format: date
 *                 description: Requested new expiry date
 *                 example: "2027-01-15"
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
 *                   example: "Renewal request submitted successfully"
 *                 renewalData:
 *                   type: object
 *                   properties:
 *                     certificateId:
 *                       type: integer
 *                       description: ID of the certificate being renewed
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     requestDate:
 *                       type: string
 *                       format: date
 *                       description: Date the renewal was requested
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Reason for renewal is required"
 *       404:
 *         description: Certificate not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Certificate not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to submit renewal request"
 */
router.post('/:id/renew', async (req, res) => {
  try {
    const certificate = await Certificate.findById(parseInt(req.params.id));
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const { reason, notes, requestedExpiryDate } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason for renewal is required' });
    }

    const renewalData = {
      certificateId: certificate.id,
      farmId: certificate.farm_id,
      reason,
      notes: notes || '',
      requestedExpiryDate: requestedExpiryDate || null,
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0]
    };

    // Set certificate status to renewal_pending to indicate awaiting approval
    await Certificate.update(certificate.id, {
      status: 'renewal_pending'
    });

    res.json({
      message: 'Renewal request submitted successfully',
      renewalData: {
        certificateId: certificate.id,
        status: 'pending',
        requestDate: renewalData.requestDate
      }
    });
  } catch (error) {
    console.error('Error submitting renewal request:', error);
    res.status(500).json({ error: 'Failed to submit renewal request' });
  }
});

module.exports = router;