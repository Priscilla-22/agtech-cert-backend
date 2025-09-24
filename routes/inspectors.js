const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const inspectorController = require('../controllers/InspectorController');

router.get('/', authenticateToken, inspectorController.getAll.bind(inspectorController));
router.get('/:id', authenticateToken, inspectorController.getById.bind(inspectorController));
router.post('/', authenticateToken, inspectorController.create.bind(inspectorController));
router.put('/:id', authenticateToken, inspectorController.update.bind(inspectorController));
router.delete('/:id', authenticateToken, inspectorController.delete.bind(inspectorController));

module.exports = router;