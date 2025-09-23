const express = require('express');
const router = express.Router();
const db = require('../models');
const Farm = require('../models/Farm');
const dbConfig = require('../config/database');
const { validateFarm, validateFarmUpdate } = require('../utils/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Farm:
 *       type: object
 *       required:
 *         - farmerId
 *         - farmName
 *         - location
 *       properties:
 *         id:
 *           type: string
 *           description: Unique farm identifier
 *         farmerId:
 *           type: string
 *           description: ID of the farmer who owns this farm
 *         farmName:
 *           type: string
 *           description: Name of the farm
 *           example: "Green Valley Organic Farm"
 *         location:
 *           type: string
 *           description: Farm location/address
 *           example: "Kiambu County, Kenya"
 *         totalArea:
 *           type: number
 *           description: Total farm area in hectares
 *           example: 15.5
 *         organicArea:
 *           type: number
 *           description: Organic farming area in hectares
 *           example: 12.0
 *         cropTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: Types of crops grown
 *           example: ["Coffee", "Maize", "Beans"]
 *         organicSince:
 *           type: string
 *           format: date
 *           description: Date when organic farming started
 *         certificationStatus:
 *           type: string
 *           enum: ["pending", "certified", "expired", "rejected"]
 *           description: Current certification status
 *         farmerName:
 *           type: string
 *           description: Name of the farm owner (populated)
 *         totalFields:
 *           type: integer
 *           description: Number of fields in this farm
 */

/**
 * @swagger
 * /api/farms:
 *   get:
 *     summary: Get all farms
 *     description: Retrieve a list of all farms with farmer and field information
 *     tags: [Farms]
 *     responses:
 *       200:
 *         description: List of farms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Farm'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', async (req, res) => {
  try {
    const farms = await db.findAll('farms');

    // Enrich with farmer data
    const enrichedFarms = await Promise.all(farms.map(async (farm) => {
      const farmer = await db.findById('farmers', farm.farmer_id);
      const fields = await db.findBy('fields', { farm_id: farm.id });
      const mappedFarm = db.mapFieldsFromDatabase(farm);
      return {
        ...mappedFarm,
        farmerName: farmer ? farmer.name : 'Unknown',
        totalFields: fields.length
      };
    }));

    res.json(enrichedFarms);
  } catch (error) {
    console.error('Error fetching farms:', error);
    res.status(500).json({ error: 'Failed to fetch farms' });
  }
});

/**
 * @swagger
 * /api/farms/farmer/{farmerId}:
 *   get:
 *     summary: Get farms by farmer ID
 *     description: Retrieve all farms belonging to a specific farmer
 *     tags: [Farms]
 *     parameters:
 *       - in: path
 *         name: farmerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique farmer identifier
 *     responses:
 *       200:
 *         description: Farms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Farm'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const farmerId = parseInt(req.params.farmerId);

    // Verify farmer exists
    const farmer = await db.findById('farmers', farmerId);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Get all farms for this farmer
    const farms = await db.findBy('farms', { farmer_id: farmerId });

    // Enrich with farmer data and field count
    const enrichedFarms = await Promise.all(farms.map(async (farm) => {
      const fields = await db.findBy('fields', { farm_id: farm.id });
      const mappedFarm = db.mapFieldsFromDatabase(farm);
      return {
        ...mappedFarm,
        farmerName: farmer.name,
        totalFields: fields.length
      };
    }));

    res.json(enrichedFarms);
  } catch (error) {
    console.error('Error fetching farms by farmer ID:', error);
    res.status(500).json({ error: 'Failed to fetch farms' });
  }
});

/**
 * @swagger
 * /api/farms/{id}:
 *   get:
 *     summary: Get farm by ID
 *     description: Retrieve detailed information for a specific farm including farmer, fields, inspections, and certificates
 *     tags: [Farms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique farm identifier
 *     responses:
 *       200:
 *         description: Farm details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Farm'
 *                 - type: object
 *                   properties:
 *                     farmer:
 *                       $ref: '#/components/schemas/Farmer'
 *                     fields:
 *                       type: array
 *                       description: Farm fields
 *                     inspections:
 *                       type: array
 *                       description: Farm inspections
 *                     certificates:
 *                       type: array
 *                       description: Farm certificates
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const farm = await db.findById('farms', parseInt(req.params.id));
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const farmer = await db.findById('farmers', farm.farmer_id);
    const fields = await db.findBy('fields', { farm_id: farm.id });
    const inspections = await db.findBy('inspections', { farm_id: farm.id });
    const certificates = await db.findBy('certificates', { farm_id: farm.id });

    const mappedFarm = db.mapFieldsFromDatabase(farm);
    const mappedFarmer = farmer ? db.mapFieldsFromDatabase(farmer) : null;
    const mappedFields = fields.map(field => db.mapFieldsFromDatabase(field));
    const mappedInspections = inspections.map(inspection => db.mapFieldsFromDatabase(inspection));
    const mappedCertificates = certificates.map(cert => db.mapFieldsFromDatabase(cert));

    res.json({
      ...mappedFarm,
      farmer: mappedFarmer,
      fields: mappedFields,
      inspections: mappedInspections,
      certificates: mappedCertificates
    });
  } catch (error) {
    console.error('Error fetching farm:', error);
    res.status(500).json({ error: 'Failed to fetch farm' });
  }
});

/**
 * @swagger
 * /api/farms:
 *   post:
 *     summary: Create new farm
 *     description: Create a new farm for an existing farmer
 *     tags: [Farms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmerId
 *               - farmName
 *               - location
 *             properties:
 *               farmerId:
 *                 type: string
 *                 description: ID of the farmer who owns this farm
 *               farmName:
 *                 type: string
 *                 description: Name of the farm
 *               location:
 *                 type: string
 *                 description: Farm location/address
 *               totalArea:
 *                 type: number
 *                 description: Total farm area in hectares
 *               organicArea:
 *                 type: number
 *                 description: Organic farming area in hectares
 *               cropTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Types of crops grown
 *           example:
 *             farmerId: "farmer123"
 *             farmName: "Green Valley Organic Farm"
 *             location: "Kiambu County, Kenya"
 *             totalArea: 15.5
 *             organicArea: 12.0
 *             cropTypes: ["Coffee", "Maize", "Beans"]
 *     responses:
 *       201:
 *         description: Farm created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Farm'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', async (req, res) => {
  try {
    const errors = validateFarm(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Verify farmer exists
    const farmer = await db.findById('farmers', parseInt(req.body.farmerId));
    if (!farmer) {
      return res.status(400).json({ error: 'Farmer not found' });
    }

    const farmData = {
      farmerId: req.body.farmerId,
      farmName: req.body.name || req.body.farmName,
      location: req.body.location,
      totalArea: req.body.totalArea,
      organicArea: req.body.organicArea || req.body.cultivatedSize,
      cropTypes: req.body.cropTypes || [],
      organicSince: req.body.organicSince || new Date().toISOString().split('T')[0],
      certificationStatus: 'pending'
    };

    // Create farm record - bypass mapping function for farms to avoid field conflicts
    const farmResult = await dbConfig.executeQuery(
      'INSERT INTO farms (farmer_id, farm_name, location, total_area, organic_area, crop_types, organic_since, certification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        farmData.farmerId,
        farmData.farmName,
        farmData.location,
        farmData.totalArea,
        farmData.organicArea,
        JSON.stringify(farmData.cropTypes),
        farmData.organicSince,
        farmData.certificationStatus
      ]
    );

    const farm = { id: farmResult.insertId, ...farmData };

    // Update farmer's totalFarms count
    const farmerFarms = await db.findBy('farms', { farmer_id: farmer.id });
    await db.update('farmers', farmer.id, { totalFarms: farmerFarms.length });

    const mappedFarm = db.mapFieldsFromDatabase(farm);
    res.status(201).json(mappedFarm);
  } catch (error) {
    console.error('Error creating farm:', error);
    res.status(500).json({ error: 'Failed to create farm' });
  }
});

/**
 * @swagger
 * /api/farms/{id}:
 *   put:
 *     summary: Update farm
 *     description: Update an existing farm's information
 *     tags: [Farms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique farm identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Farm'
 *     responses:
 *       200:
 *         description: Farm updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Farm'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', async (req, res) => {
  try {
    const errors = validateFarmUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }


    console.log('FIXED VERSION - Updating farm with ID:', req.params.id);
    console.log('Update data:', req.body);

    // First check if farm exists
    const existingFarm = await db.findById('farms', parseInt(req.params.id));
    if (!existingFarm) {
      console.log('Farm not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Farm not found' });
    }

    console.log('Existing farm found:', existingFarm);

    const farm = await Farm.update(parseInt(req.params.id), req.body);
    console.log('Update result:', farm);

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found after update' });
    }

    const mappedFarm = db.mapFieldsFromDatabase(farm);
    res.json(mappedFarm);
  } catch (error) {
    console.error('Error updating farm:', error);
    res.status(500).json({ error: 'Failed to update farm' });
  }
});

/**
 * @swagger
 * /api/farms/{id}:
 *   delete:
 *     summary: Delete farm
 *     description: Delete a farm and all associated data (fields, inspections)
 *     tags: [Farms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique farm identifier
 *     responses:
 *       200:
 *         description: Farm deleted successfully
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
    const farm = await db.findById('farms', parseInt(req.params.id));
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    // Delete associated fields and inspections
    const fields = await db.findBy('fields', { farm_id: parseInt(req.params.id) });
    for (const field of fields) {
      await db.delete('fields', field.id);
    }

    const inspections = await db.findBy('inspections', { farm_id: parseInt(req.params.id) });
    for (const inspection of inspections) {
      await db.delete('inspections', inspection.id);
    }

    // Delete the farm
    await db.delete('farms', parseInt(req.params.id));

    // Update farmer's totalFarms count
    const remainingFarms = await db.findBy('farms', { farmer_id: farm.farmer_id });
    await db.update('farmers', farm.farmer_id, { totalFarms: remainingFarms.length });

    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    console.error('Error deleting farm:', error);
    res.status(500).json({ error: 'Failed to delete farm' });
  }
});

module.exports = router;