const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const inspectionController = require('../controllers/InspectionController');
const { CHECKLIST_QUESTIONS } = require('../utils/inspection');

router.get('/', authenticateToken, inspectionController.getAll.bind(inspectionController));
router.get('/:id', authenticateToken, inspectionController.getById.bind(inspectionController));
router.post('/', authenticateToken, inspectionController.create.bind(inspectionController));
router.put('/:id', authenticateToken, inspectionController.update.bind(inspectionController));
router.post('/:id/approve', authenticateToken, inspectionController.approve.bind(inspectionController));
router.delete('/:id', authenticateToken, inspectionController.delete.bind(inspectionController));

router.get('/checklist', authenticateToken, (req, res) => {
  res.json({ data: CHECKLIST_QUESTIONS });
});

module.exports = router;