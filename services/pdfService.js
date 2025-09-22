const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

// Simple and clean color scheme
const COLORS = {
    primary: "#10b981", // green-500
    dark: "#374151", // gray-700
    light: "#9ca3af", // gray-400
    white: "#ffffff",
    background: "#f9fafb" // gray-50
}

class PDFService {
    static async generateCertificatePDF(certificateData, farmData, farmerData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: "A4",
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                })

                const buffers = []
                doc.on("data", buffers.push.bind(buffers))
                doc.on("end", () => {
                    const pdfData = Buffer.concat(buffers)
                    resolve(pdfData)
                })

                const pageWidth = doc.page.width
                const margins = doc.page.margins
                const contentWidth = pageWidth - margins.left - margins.right

                // Header with enhanced styling
                this.drawHeader(doc, contentWidth, certificateData)

                // Main certificate content with improved layout
                this.drawCertificateContent(doc, contentWidth, certificateData, farmData, farmerData)

                // Professional footer
                this.drawFooter(doc, contentWidth, certificateData)

                doc.end()
            } catch (error) {
                reject(error)
            }
        })
    }

    static drawHeader(doc, contentWidth, certificateData) {
        // Simple logo placement
        try {
            const logoPath = path.join(__dirname, "../public/pesira-logo-nobg.png")
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 50, { width: 50, height: 50 })
            }
        } catch (error) {
            // Simple logo placeholder
            doc.fontSize(12)
               .fillColor(COLORS.primary)
               .font("Helvetica-Bold")
               .text("PESIRA", 50, 70)
        }

        // Simple centered title
        doc.fontSize(28)
           .fillColor(COLORS.dark)
           .font("Helvetica-Bold")
           .text("ORGANIC CERTIFICATION", 0, 50, { width: contentWidth + 100, align: "center" })

        doc.fontSize(18)
           .fillColor(COLORS.primary)
           .font("Helvetica")
           .text("CERTIFICATE", 0, 85, { width: contentWidth + 100, align: "center" })

        // Simple line separator
        doc.moveTo(50, 120)
           .lineTo(contentWidth + 50, 120)
           .strokeColor(COLORS.primary)
           .lineWidth(1)
           .stroke()

        doc.y = 140
    }

    static drawCertificateContent(doc, contentWidth, certificateData, farmData, farmerData) {
        // Authority name
        doc.fontSize(14)
           .fillColor(COLORS.dark)
           .font("Helvetica-Bold")
           .text("Kenya Organic Agriculture Network (KOAN)", { align: "center" })
           .moveDown(0.5)

        doc.fontSize(10)
           .fillColor(COLORS.light)
           .font("Helvetica")
           .text("Accredited Organic Agriculture Certification Body", { align: "center" })
           .moveDown(2)

        // Certificate number
        doc.fontSize(12)
           .fillColor(COLORS.primary)
           .font("Helvetica-Bold")
           .text(`Certificate No: ${certificateData.certificate_number}`, { align: "center" })
           .moveDown(2)

        // Main statement
        doc.fontSize(14)
           .fillColor(COLORS.dark)
           .font("Helvetica")
           .text("This is to certify that:", { align: "center" })
           .moveDown(1)

        // Farmer name - simple and prominent
        doc.fontSize(22)
           .fillColor(COLORS.primary)
           .font("Helvetica-Bold")
           .text(farmerData.name, { align: "center", underline: true })
           .moveDown(1.5)

        // Farm details - simple text
        doc.fontSize(12)
           .fillColor(COLORS.dark)
           .font("Helvetica")
           .text(`Operating: ${farmData.farmName}`, { align: "center" })
           .text(`Location: ${farmData.location}`, { align: "center" })
           .text(`Farm Size: ${farmData.farmSize} acres`, { align: "center" })
           .moveDown(2)

        // Certification statement
        doc.fontSize(11)
           .fillColor(COLORS.dark)
           .font("Helvetica")
           .text("Has been inspected and certified as compliant with organic agriculture", { align: "center" })
           .text("standards for the production of:", { align: "center" })
           .moveDown(1.5)

        // Crops - simple list with safe JSON parsing
        let cropTypes = ["Organic crops"];
        if (farmData.crop_types) {
          try {
            if (typeof farmData.crop_types === 'string') {
              // Try parsing as JSON first
              cropTypes = JSON.parse(farmData.crop_types);
            } else if (Array.isArray(farmData.crop_types)) {
              // Already an array
              cropTypes = farmData.crop_types;
            } else {
              // Convert to string and split by comma as fallback
              cropTypes = farmData.crop_types.toString().split(',').map(crop => crop.trim());
            }
          } catch (error) {
            // If JSON parsing fails, try splitting by comma
            cropTypes = farmData.crop_types.split(',').map(crop => crop.trim());
          }
        }

        doc.fontSize(13)
           .fillColor(COLORS.primary)
           .font("Helvetica-Bold")
           .text("CERTIFIED CROPS", { align: "center" })
           .moveDown(0.5)

        cropTypes.forEach(crop => {
            doc.fontSize(11)
               .fillColor(COLORS.dark)
               .font("Helvetica")
               .text(`• ${crop}`, { align: "center" })
        })

        doc.moveDown(2)

        // Dates - simple layout
        doc.fontSize(11)
           .fillColor(COLORS.dark)
           .font("Helvetica")
           .text(`Issue Date: ${new Date(certificateData.issue_date).toLocaleDateString()}`, { align: "center" })
           .text(`Expiry Date: ${new Date(certificateData.expiry_date).toLocaleDateString()}`, { align: "center" })
           .moveDown(1)

        if (certificateData.scope) {
            doc.fontSize(10)
               .fillColor(COLORS.light)
               .font("Helvetica")
               .text(`Scope: ${certificateData.scope}`, { align: "center" })
               .moveDown(1)
        }
    }

    static drawFooter(doc, contentWidth, certificateData) {
        // Add some space before footer
        doc.moveDown(3)

        // Simple signature line
        doc.fontSize(11)
           .fillColor(COLORS.dark)
           .font("Helvetica")
           .text("_____________________________", { align: "center" })
           .moveDown(0.5)

        doc.fontSize(10)
           .fillColor(COLORS.light)
           .font("Helvetica")
           .text("Authorized Signature", { align: "center" })
           .text("Kenya Organic Agriculture Network", { align: "center" })
           .moveDown(2)

        // Simple disclaimer
        doc.fontSize(8)
           .fillColor(COLORS.light)
           .font("Helvetica")
           .text("This certificate is valid only when accompanied by the current inspection report.", { align: "center" })
           .moveDown(1)

        // Simple footer info
        doc.fontSize(7)
           .fillColor(COLORS.light)
           .font("Helvetica")
           .text(`Certificate ID: ${certificateData.certificate_number} | Generated: ${new Date().toLocaleDateString()}`, { align: "center" })
    }
}

module.exports = PDFService
