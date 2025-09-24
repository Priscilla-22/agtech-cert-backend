const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateField } = require('../utils/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Field:
 *       type: object
 *       required:
 *         - farmId
 *         - fieldName
 *         - cropType
 *       properties:
 *         id:
 *           type: string
 *           description: Unique field identifier
 *         farmId:
 *           type: string
 *           description: ID of the farm this field belongs to
 *         fieldName:
 *           type: string
 *           description: Name/identifier for the field
 *           example: "Field A - Coffee Block"
 *         cropType:
 *           type: string
 *           description: Primary crop grown in this field
 *           example: "Coffee"
 *         area:
 *           type: number
 *           description: Field area in hectares
 *           example: 2.5
 *         soilType:
 *           type: string
 *           description: Soil type in this field
 *           example: "Volcanic soil"
 *         plantingDate:
 *           type: string
 *           format: date
 *           description: Date when crop was planted
 *         organicStatus:
 *           type: boolean
 *           description: Whether this field follows organic practices
 *           example: true
 *         farmName:
 *           type: string
 *           description: Name of the farm (populated)
 */

/**
 * @swagger
 * /api/fields:
 *   get:
 *     summary: Get all fields
 *     description: Retrieve a list of all fields, optionally filtered by farm ID
 *     tags: [Fields]
 *     parameters:
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: string
 *         description: Filter fields by farm ID
 *     responses:
 *       200:
 *         description: List of fields retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Field'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    let fields;

    if (req.query.farmId) {
      fields = await db.findBy('fields', { farm_id: parseInt(req.query.farmId) });
    } else {
      fields = await db.findAll('fields');
    }

    // Enrich with farm data
    const enrichedFields = await Promise.all(fields.map(async (field) => {
      const farm = await db.findById('farms', field.farm_id);
      const mappedField = db.mapFieldsFromDatabase(field);
      return {
        ...mappedField,
        farmName: farm ? farm.farm_name : 'Unknown'
      };
    }));

    res.json(enrichedFields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

/**
 * @swagger
 * /api/fields/{id}:
 *   get:
 *     summary: Get field by ID
 *     description: Retrieve detailed information for a specific field including farm and farmer details
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique field identifier
 *     responses:
 *       200:
 *         description: Field details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Field'
 *                 - type: object
 *                   properties:
 *                     farm:
 *                       $ref: '#/components/schemas/Farm'
 *                     farmer:
 *                       $ref: '#/components/schemas/Farmer'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const field = await db.findById('fields', parseInt(req.params.id));
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const farm = await db.findById('farms', field.farm_id);
    const farmer = farm ? await db.findById('farmers', farm.farmer_id) : null;

    const mappedField = db.mapFieldsFromDatabase(field);
    const mappedFarm = farm ? db.mapFieldsFromDatabase(farm) : null;
    const mappedFarmer = farmer ? db.mapFieldsFromDatabase(farmer) : null;

    res.json({
      ...mappedField,
      farm: mappedFarm,
      farmer: mappedFarmer
    });
  } catch (error) {
    console.error('Error fetching field:', error);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
});

/**
 * @swagger
 * /api/fields:
 *   post:
 *     summary: Create new field
 *     description: Create a new field within an existing farm
 *     tags: [Fields]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmId
 *               - fieldName
 *               - cropType
 *             properties:
 *               farmId:
 *                 type: string
 *                 description: ID of the farm this field belongs to
 *               fieldName:
 *                 type: string
 *                 description: Name/identifier for the field
 *               cropType:
 *                 type: string
 *                 description: Primary crop grown in this field
 *               area:
 *                 type: number
 *                 description: Field area in hectares
 *               soilType:
 *                 type: string
 *                 description: Soil type in this field
 *               plantingDate:
 *                 type: string
 *                 format: date
 *                 description: Date when crop was planted
 *               organicStatus:
 *                 type: boolean
 *                 description: Whether this field follows organic practices
 *           example:
 *             farmId: "farm123"
 *             fieldName: "Field A - Coffee Block"
 *             cropType: "Coffee"
 *             area: 2.5
 *             soilType: "Volcanic soil"
 *             plantingDate: "2023-01-15"
 *             organicStatus: true
 *     responses:
 *       201:
 *         description: Field created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Field'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const errors = validateField(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Verify farm exists
    const farm = await db.findById('farms', parseInt(req.body.farmId));
    if (!farm) {
      return res.status(400).json({ error: 'Farm not found' });
    }

    const fieldData = {
      ...req.body,
      plantingDate: req.body.plantingDate || new Date().toISOString().split('T')[0],
      organicStatus: req.body.organicStatus !== undefined ? req.body.organicStatus : true
    };

    const field = await db.create('fields', fieldData);
    const mappedField = db.mapFieldsFromDatabase(field);
    res.status(201).json(mappedField);
  } catch (error) {
    console.error('Error creating field:', error);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

/**
 * @swagger
 * /api/fields/{id}:
 *   put:
 *     summary: Update field
 *     description: Update an existing field's information
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique field identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Field'
 *     responses:
 *       200:
 *         description: Field updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Field'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const errors = validateField(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const field = await db.update('fields', parseInt(req.params.id), req.body);
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const mappedField = db.mapFieldsFromDatabase(field);
    res.json(mappedField);
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ error: 'Failed to update field' });
  }
});

/**
 * @swagger
 * /api/fields/{id}:
 *   delete:
 *     summary: Delete field
 *     description: Delete a field from the farm
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique field identifier
 *     responses:
 *       200:
 *         description: Field deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if field exists first
    const field = await db.findById('fields', parseInt(req.params.id));
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    await db.delete('fields', parseInt(req.params.id));
    res.json({ message: 'Field deleted successfully' });
  } catch (error) {
    console.error('Error deleting field:', error);
    res.status(500).json({ error: 'Failed to delete field' });
  }
});

module.exports = router;