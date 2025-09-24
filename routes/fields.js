const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const fieldController = require('../controllers/FieldController');

router.get('/', authenticateToken, fieldController.getAll.bind(fieldController));
router.get('/:id', authenticateToken, fieldController.getById.bind(fieldController));
router.get('/farm/:farmId', authenticateToken, fieldController.getByFarmId.bind(fieldController));
router.post('/', authenticateToken, fieldController.create.bind(fieldController));
router.put('/:id', authenticateToken, fieldController.update.bind(fieldController));
router.delete('/:id', authenticateToken, fieldController.delete.bind(fieldController));

module.exports = router;