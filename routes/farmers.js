const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const farmerController = require('../controllers/FarmerController');

router.get('/', authenticateToken, farmerController.getAll.bind(farmerController));
router.get('/:id', authenticateToken, farmerController.getById.bind(farmerController));
router.post('/', authenticateToken, farmerController.create.bind(farmerController));
router.put('/:id', authenticateToken, farmerController.update.bind(farmerController));
router.delete('/:id', authenticateToken, farmerController.delete.bind(farmerController));

module.exports = router;