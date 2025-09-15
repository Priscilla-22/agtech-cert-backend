const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');
const db = require('../models');

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
    const certificates = await db.findAll('certificates');

    // Enrich with farm and farmer data
    const enrichedCertificates = await Promise.all(certificates.map(async (certificate) => {
      const farm = await db.findById('farms', certificate.farm_id);
      const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;
      const mappedCertificate = db.mapFieldsFromDatabase(certificate);

      return {
        ...mappedCertificate,
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
    const certificate = await db.findById('certificates', parseInt(req.params.id));
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const farm = await db.findById('farms', certificate.farm_id);
    const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;
    const inspections = await db.findBy('inspections', { farm_id: certificate.farm_id });

    const mappedCertificate = db.mapFieldsFromDatabase(certificate);
    const mappedFarm = farm ? db.mapFieldsFromDatabase(farm) : null;
    const mappedFarmer = farmer ? db.mapFieldsFromDatabase(farmer) : null;
    const mappedInspections = inspections.map(inspection => db.mapFieldsFromDatabase(inspection));

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
    const certificate = await db.findById('certificates', parseInt(req.params.id));
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const farm = await db.findById('farms', certificate.farm_id);
    const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;
    const inspections = await db.findBy('inspections', { farm_id: certificate.farm_id });
    const approvedInspection = inspections.find(i => i.status === 'Approved');

    if (!farm || !farmer) {
      return res.status(404).json({ error: 'Associated farm or farmer not found' });
    }

    const pdfFileName = `certificate-${certificate.certificate_number || certificate.certificateNumber}.pdf`;
    const pdfPath = path.join(__dirname, '../certificates', pdfFileName);

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(pdfPath));

    // Add content to PDF
    await generateCertificatePDF(doc, certificate, farm, farmer, approvedInspection);

    doc.end();

    // Wait for PDF to be written
    doc.on('end', async () => {
      // Update certificate with PDF URL
      const pdfUrl = `/certificates/${pdfFileName}`;
      await db.update('certificates', certificate.id, { pdfUrl });

      // Send PDF as response
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
async function generateCertificatePDF(doc, certificate, farm, farmer, inspection) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Header
  doc.fillColor('#2E7D32')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('ORGANIC CERTIFICATION', 50, 80, { align: 'center' });

  // Certificate badge
  doc.fillColor('#4CAF50')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('CERTIFIED ORGANIC', 50, 120, { align: 'center' });

  // Certificate details box
  const boxY = 180;
  doc.rect(50, boxY, pageWidth - 100, 300)
     .stroke('#E0E0E0');

  // Certificate info
  doc.fillColor('#000000')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('Certificate Number:', 70, boxY + 30)
     .font('Helvetica')
     .text(certificate.certificate_number || certificate.certificateNumber, 220, boxY + 30);

  doc.font('Helvetica-Bold')
     .text('Issue Date:', 70, boxY + 55)
     .font('Helvetica')
     .text(new Date(certificate.issue_date || certificate.issueDate).toLocaleDateString(), 220, boxY + 55);

  doc.font('Helvetica-Bold')
     .text('Expiry Date:', 70, boxY + 80)
     .font('Helvetica')
     .text(new Date(certificate.expiry_date || certificate.expiryDate).toLocaleDateString(), 220, boxY + 80);

  // Farmer details
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('FARMER DETAILS', 70, boxY + 120);

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Name:', 70, boxY + 150)
     .font('Helvetica')
     .text(farmer.name, 150, boxY + 150);

  doc.font('Helvetica-Bold')
     .text('Email:', 70, boxY + 170)
     .font('Helvetica')
     .text(farmer.email, 150, boxY + 170);

  doc.font('Helvetica-Bold')
     .text('Phone:', 70, boxY + 190)
     .font('Helvetica')
     .text(farmer.phone, 150, boxY + 190);

  doc.font('Helvetica-Bold')
     .text('Address:', 70, boxY + 210)
     .font('Helvetica')
     .text(farmer.address, 150, boxY + 210);

  // Farm details
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('FARM DETAILS', 300, boxY + 120);

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Farm Name:', 300, boxY + 150)
     .font('Helvetica')
     .text(farm.farm_name || farm.name, 380, boxY + 150);

  doc.font('Helvetica-Bold')
     .text('Location:', 300, boxY + 170)
     .font('Helvetica')
     .text(farm.location, 380, boxY + 170);

  doc.font('Helvetica-Bold')
     .text('Size:', 300, boxY + 190)
     .font('Helvetica')
     .text(`${farm.total_area || farm.size} hectares`, 380, boxY + 190);

  doc.font('Helvetica-Bold')
     .text('Crop Types:', 300, boxY + 210)
     .font('Helvetica')
     .text(Array.isArray(farm.crop_types || farm.cropTypes) ? (farm.crop_types || farm.cropTypes).join(', ') : (farm.crop_types || farm.cropTypes || ''), 380, boxY + 210);

  // Inspection details
  if (inspection) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('INSPECTION DETAILS', 70, boxY + 250);

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Inspector:', 70, boxY + 275)
       .font('Helvetica')
       .text(inspection.inspector_name || inspection.inspectorName, 150, boxY + 275);

    doc.font('Helvetica-Bold')
       .text('Compliance Score:', 300, boxY + 275)
       .font('Helvetica')
       .text(`${inspection.compliance_score || inspection.complianceScore}%`, 420, boxY + 275);
  }

  // Footer
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666666')
     .text('This certificate confirms that the above farm meets organic certification standards.', 50, pageHeight - 100, { align: 'center' });

  doc.text('Inspector Signature: _____________________________', 50, pageHeight - 70);

  doc.fontSize(8)
     .text(`Generated on ${new Date().toLocaleDateString()} | Certificate ID: ${certificate.id}`, 50, pageHeight - 30, { align: 'center' });
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
    const certificate = await db.findById('certificates', parseInt(req.params.id));
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Delete PDF file if it exists
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

    await db.delete('certificates', parseInt(req.params.id));
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

module.exports = router;