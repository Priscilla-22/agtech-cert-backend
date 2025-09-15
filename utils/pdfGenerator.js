const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate certificate number
const generateCertificateNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORG-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
};

// Calculate expiry date (1 year from issue date)
const calculateExpiryDate = (issueDate) => {
  const date = new Date(issueDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
};

// Generate PDF certificate
const generateCertificatePDF = async (certificateData) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        farmer,
        farm,
        inspection,
        certificateNo,
        issueDate,
        expiryDate
      } = certificateData;

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Create certificates directory if it doesn't exist
      const certificatesDir = path.join(__dirname, '..', 'certificates');
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }

      const fileName = `certificate_${certificateNo}.pdf`;
      const filePath = path.join(certificatesDir, fileName);

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24)
         .fillColor('#2D5016')
         .text('ORGANIC CERTIFICATE', 0, 80, { align: 'center' });

      // Certified Organic Badge
      doc.fontSize(16)
         .fillColor('#10B981')
         .text('🌱 CERTIFIED ORGANIC 🌱', 0, 120, { align: 'center' });

      // Certificate details box
      doc.rect(50, 160, 495, 300)
         .stroke('#2D5016');

      // Certificate content
      doc.fontSize(14)
         .fillColor('black')
         .text('Certificate Number:', 70, 180)
         .fontSize(12)
         .text(certificateNo, 200, 180);

      doc.fontSize(14)
         .text('This is to certify that:', 70, 210);

      // Farmer details
      doc.fontSize(16)
         .fillColor('#2D5016')
         .text(`${farmer.name}`, 70, 240)
         .fontSize(12)
         .fillColor('black')
         .text(`Email: ${farmer.email}`, 70, 265)
         .text(`Phone: ${farmer.phone}`, 70, 285)
         .text(`County: ${farmer.county}`, 70, 305);

      // Farm details
      doc.fontSize(14)
         .fillColor('#2D5016')
         .text('Farm Details:', 70, 335)
         .fontSize(12)
         .fillColor('black')
         .text(`Farm Name: ${farm.farmName}`, 70, 355)
         .text(`Location: ${farm.location}`, 70, 375)
         .text(`Area: ${farm.areaHa} hectares`, 70, 395);

      // Compliance score
      doc.fontSize(14)
         .fillColor('#10B981')
         .text(`Compliance Score: ${inspection.complianceScore}%`, 70, 420);

      // Dates
      doc.fontSize(12)
         .fillColor('black')
         .text(`Issue Date: ${issueDate}`, 70, 480)
         .text(`Expiry Date: ${expiryDate}`, 70, 500);

      // Footer
      doc.fontSize(10)
         .fillColor('gray')
         .text('This certificate is issued under organic farming standards', 70, 580)
         .text('Inspector Signature: ________________________', 70, 620)
         .text(`Inspector: ${inspection.inspectorName}`, 70, 640)
         .text('Pesira Organic Certification Authority', 70, 680, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({
          fileName,
          filePath,
          pdfUrl: `/certificates/${fileName}`
        });
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateCertificateNumber,
  calculateExpiryDate,
  generateCertificatePDF
};