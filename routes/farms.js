const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const farmController = require('../controllers/FarmController');

router.get('/', authenticateToken, farmController.getAll.bind(farmController));
router.get('/:id', authenticateToken, farmController.getById.bind(farmController));
router.get('/farmer/:farmerId', authenticateToken, farmController.getByFarmerId.bind(farmController));
router.post('/', authenticateToken, farmController.create.bind(farmController));
router.put('/:id', authenticateToken, farmController.update.bind(farmController));
router.delete('/:id', authenticateToken, farmController.delete.bind(farmController));

module.exports = router;