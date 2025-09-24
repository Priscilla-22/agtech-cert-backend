const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const certificateController = require('../controllers/CertificateController');

router.get('/', authenticateToken, certificateController.getAll.bind(certificateController));
router.get('/:id', authenticateToken, certificateController.getById.bind(certificateController));
router.get('/:id/pdf', authenticateToken, certificateController.downloadPDF.bind(certificateController));
router.post('/', authenticateToken, certificateController.create.bind(certificateController));
router.put('/:id', authenticateToken, certificateController.update.bind(certificateController));
router.delete('/:id', authenticateToken, certificateController.delete.bind(certificateController));

module.exports = router;