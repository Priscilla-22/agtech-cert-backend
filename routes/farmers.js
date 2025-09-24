const express = require('express');
const router = express.Router();
const db = require('../models');
const dbConfig = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateFarmer, validateFarmerUpdate, getUserFriendlyError } = require('../utils/validation');

const generateMemberNumber = () => {
  const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
  const random = Math.random().toString(36).substr(2, 2).toUpperCase();
  return `${timestamp}${random}`;
};

function mapOrganicExperience(frontendValue) {
  const mapping = {
    'beginner': '0-1',
    'intermediate': '2-3',
    'advanced': '4-5',
    'expert': '6-10',
    '0-1': '0-1',
    '2-3': '2-3',
    '4-5': '4-5',
    '6-10': '6-10',
    '10+': '10+'
  };
  return mapping[frontendValue] || '0-1'; // Default to '0-1' if not found
}

/**
 * @swagger
 * components:
 *   schemas:
 *     FarmerInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - idNumber
 *         - county
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the farmer
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Primary phone number
 *         idNumber:
 *           type: string
 *           description: National ID number
 *         county:
 *           type: string
 *           description: County location
 */

/**
 * @swagger
 * /api/farmers:
 *   get:
 *     summary: Get all farmers with optional filtering
 *     description: Retrieve a list of all registered farmers with optional filtering parameters
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, suspended]
 *         description: Filter by farmer status
 *       - in: query
 *         name: certificationStatus
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, certified, expired, rejected]
 *         description: Filter by certification status
 *       - in: query
 *         name: county
 *         schema:
 *           type: string
 *         description: Filter by county
 *       - in: query
 *         name: subCounty
 *         schema:
 *           type: string
 *         description: Filter by sub-county
 *       - in: query
 *         name: farmingType
 *         schema:
 *           type: string
 *           enum: [organic, conventional, mixed, subsistence]
 *         description: Filter by farming type
 *       - in: query
 *         name: organicExperience
 *         schema:
 *           type: string
 *           enum: [0-1, 2-3, 4-5, 6-10, 10+]
 *         description: Filter by organic farming experience
 *       - in: query
 *         name: educationLevel
 *         schema:
 *           type: string
 *           enum: [primary, secondary, tertiary, university, none]
 *         description: Filter by education level
 *       - in: query
 *         name: minLandSize
 *         schema:
 *           type: number
 *         description: Filter by minimum total land size (acres)
 *       - in: query
 *         name: maxLandSize
 *         schema:
 *           type: number
 *         description: Filter by maximum total land size (acres)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in farmer name, email, or phone
 *       - in: query
 *         name: registrationDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration date from (YYYY-MM-DD)
 *       - in: query
 *         name: registrationDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by registration date to (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Limit number of results (default 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Offset for pagination (default 0)
 *     responses:
 *       200:
 *         description: List of farmers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Farmer'
 *                 total:
 *                   type: integer
 *                   description: Total number of farmers matching filters
 *                 limit:
 *                   type: integer
 *                   description: Applied limit
 *                 offset:
 *                   type: integer
 *                   description: Applied offset
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // SECURITY: Only show farmers created by the current user (agronomist)
    if (!req.user.id) {
      return res.status(403).json({ error: 'User not found in database. Please register first.' });
    }

    // Simplified query - just get farmers for this user
    const farmersQuery = `SELECT * FROM farmers WHERE user_id = ? ORDER BY registration_date DESC`;
    const farmers = await dbConfig.executeQuery(farmersQuery, [req.user.id]);

    const mappedFarmers = farmers.map(farmer => db.mapFieldsFromDatabase(farmer));

    res.json({
      data: mappedFarmers,
      total: farmers.length,
      limit: 50,
      offset: 0
    });
  } catch (error) {
    console.error('Error fetching farmers:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });

    res.status(500).json({
      error: 'Failed to fetch farmers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/farmers/{id}:
 *   get:
 *     summary: Get farmer by ID
 *     description: Retrieve a specific farmer by their unique identifier
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique farmer identifier
 *     responses:
 *       200:
 *         description: Farmer details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Farmer'
 *                 - type: object
 *                   properties:
 *                     farms:
 *                       type: array
 *                       description: Associated farms
 *                       items:
 *                         type: object
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.id) {
      return res.status(403).json({ error: 'User not found in database. Please register first.' });
    }

    const farmer = await db.findById('farmers', parseInt(req.params.id));
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // SECURITY: Ensure user can only access farmers they created
    if (farmer.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view farmers you registered.' });
    }

    // Include farms for this farmer
    const farms = await db.findBy('farms', { farmer_id: farmer.id });
    const mappedFarmer = db.mapFieldsFromDatabase(farmer);
    const mappedFarms = farms.map(farm => db.mapFieldsFromDatabase(farm));

    res.json({ ...mappedFarmer, farms: mappedFarms });
  } catch (error) {
    console.error('Error fetching farmer:', error);
    res.status(500).json({ error: 'Failed to fetch farmer' });
  }
});

/**
 * @swagger
 * /api/farmers:
 *   post:
 *     summary: Create new farmer
 *     description: Register a new farmer in the system
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Farmer'
 *           example:
 *             name: "John Doe"
 *             email: "john.doe@example.com"
 *             phone: "+254712345678"
 *             idNumber: "12345678"
 *             dateOfBirth: "1985-01-01"
 *             county: "Kiambu"
 *             subCounty: "Thika"
 *             ward: "Thika Town"
 *             village: "Kamenu"
 *             address: "P.O Box 123, Thika"
 *             farmingExperience: "6-10"
 *             educationLevel: "secondary"
 *             primaryCrops: ["Coffee", "Maize"]
 *             farmingType: "mixed"
 *             totalLandSize: 5.5
 *             cultivatedSize: 4.0
 *             landTenure: "owned"
 *             soilType: "volcanic"
 *             waterSources: ["River", "Borehole"]
 *             irrigationSystem: "drip"
 *             previousCertification: "no"
 *             organicExperience: "2-3"
 *     responses:
 *       201:
 *         description: Farmer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Farmer'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    // SECURITY: Ensure user is authenticated and in database
    if (!req.user.id) {
      return res.status(403).json({ error: 'User not found in database. Please register first.' });
    }

    console.log('=== FARMER CREATION DEBUG ===');
    console.log('Received payload:', JSON.stringify(req.body, null, 2));
    console.log('landTenure value:', req.body.landTenure);
    console.log('organicExperience value:', req.body.organicExperience);
    console.log('Creating farmer for user ID:', req.user.id);

    const errors = validateFarmer(req.body);
    console.log('Validation errors:', errors);

    if (errors.length > 0) {
      const friendlyErrors = getUserFriendlyError(errors);
      console.error('Farmer validation failed:', errors);
      return res.status(400).json({
        errors: friendlyErrors,
        originalErrors: errors,
        message: 'Please fix the following issues and try again:'
      });
    }

    console.log('Validation passed, proceeding with farmer creation...');

    // Calculate total and cultivated land size from frontend fields
    let totalLandSize = parseFloat(req.body.totalLandSize);
    let cultivatedSize = req.body.cultivatedSize;

    // If frontend sends separate owned/leased sizes, use them to calculate total and cultivated
    if (req.body.ownedLandSize || req.body.leasedLandSize) {
      const ownedSize = parseFloat(req.body.ownedLandSize) || 0;
      const leasedSize = parseFloat(req.body.leasedLandSize) || 0;

      // If totalLandSize is less than owned+leased, recalculate it
      const calculatedTotal = ownedSize + leasedSize;
      if (calculatedTotal > totalLandSize) {
        totalLandSize = calculatedTotal;
      }

      // Cultivated size should be the total if not specified separately
      if (!cultivatedSize) {
        cultivatedSize = calculatedTotal;
      }
    }

    cultivatedSize = parseFloat(cultivatedSize) || 0;


    // Separate farmer data (only farmer-specific fields)
    const farmerData = {
      // System generated fields
      memberNumber: generateMemberNumber(),
      userId: req.user.id, // SECURITY: Link farmer to the creating agronomist

      // Step 1: Personal & Contact Information
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      idNumber: req.body.idNumber,
      dateOfBirth: req.body.dateOfBirth,

      // Step 2: Location Details
      county: req.body.county,
      subCounty: req.body.subCounty,
      ward: req.body.ward,
      village: req.body.village,
      address: req.body.address,

      // Step 3: Farming Background
      farmingExperience: req.body.farmingExperience || req.body.yearsInFarming,
      educationLevel: req.body.educationLevel,
      agriculturalTraining: req.body.agriculturalTraining || 'none',
      primaryCrops: req.body.primaryCrops || [],
      farmingType: req.body.farmingType,

      // Step 4: Farm Details (calculated above)
      totalLandSize: totalLandSize,
      cultivatedSize: cultivatedSize,
      landTenure: req.body.landTenure,
      soilType: req.body.soilType,
      waterSources: req.body.waterSources || [],
      irrigationSystem: req.body.irrigationSystem || 'none',

      // Step 5: Certification Status
      previousCertification: req.body.previousCertification,
      certifyingBody: req.body.certifyingBody || req.body.certificationBodies || '',
      certificationExpiry: req.body.certificationExpiry || null,
      organicExperience: mapOrganicExperience(req.body.organicExperience),
      motivation: req.body.motivation || req.body.motivationForOrganic || '',
      challenges: req.body.challenges || '',
      expectations: req.body.expectations || '',

      // System fields
      status: req.body.status || 'active',
      notes: req.body.notes || '',
      registrationDate: new Date().toISOString().split('T')[0],
      totalFarms: 1, // Will have 1 farm initially
      certificationStatus: 'pending'
    };

    // Create farmer first
    const farmer = await db.Farmer.create(farmerData);

    // Prepare farm data (farm-specific fields)
    const farmData = {
      farmerId: farmer.id,
      farmName: `${req.body.name}'s Farm`, // Default farm name
      location: req.body.address,
      totalArea: totalLandSize,
      organicArea: cultivatedSize,
      cropTypes: req.body.primaryCrops || [],
      organicSince: new Date().toISOString().split('T')[0], // Today's date
      certificationStatus: 'pending'
    };

    // Create farm record - bypass mapping function for farms
    const farmResult = await dbConfig.executeQuery(
      'INSERT INTO farms (farmer_id, farm_name, location, total_area, organic_area, crop_types, organic_since, certification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        farmer.id,
        farmData.farmName,
        farmData.location,
        farmData.totalArea,
        farmData.organicArea,
        JSON.stringify(farmData.cropTypes),
        farmData.organicSince,
        farmData.certificationStatus
      ]
    );

    const mappedFarmer = db.mapFieldsFromDatabase(farmer);
    res.status(201).json(mappedFarmer);
  } catch (error) {
    console.error('Error creating farmer:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });

    // Return more specific error message in development
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({
        error: 'Failed to create farmer',
        details: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({ error: 'Failed to create farmer' });
    }
  }
});

/**
 * @swagger
 * /api/farmers/{id}:
 *   put:
 *     summary: Update farmer
 *     description: Update an existing farmer's information
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique farmer identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Farmer'
 *     responses:
 *       200:
 *         description: Farmer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Farmer'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.id) {
      return res.status(403).json({ error: 'User not found in database. Please register first.' });
    }

    // SECURITY: Check if farmer exists and belongs to current user
    const existingFarmer = await db.findById('farmers', parseInt(req.params.id));
    if (!existingFarmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    if (existingFarmer.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only update farmers you registered.' });
    }

    const errors = validateFarmerUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const farmer = await db.Farmer.update(parseInt(req.params.id), req.body);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const mappedFarmer = db.mapFieldsFromDatabase(farmer);
    res.json(mappedFarmer);
  } catch (error) {
    console.error('Error updating farmer:', error);
    res.status(500).json({ error: 'Failed to update farmer' });
  }
});

/**
 * @swagger
 * /api/farmers/{id}:
 *   delete:
 *     summary: Delete farmer
 *     description: Delete a farmer and all associated data (farms, fields, inspections)
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique farmer identifier
 *     responses:
 *       200:
 *         description: Farmer deleted successfully
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
    if (!req.user.id) {
      return res.status(403).json({ error: 'User not found in database. Please register first.' });
    }

    // Check if farmer exists first
    const farmer = await db.findById('farmers', parseInt(req.params.id));
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // SECURITY: Ensure user can only delete farmers they created
    if (farmer.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only delete farmers you registered.' });
    }

    // Also delete associated farms, fields, inspections
    const farms = await db.findBy('farms', { farmer_id: parseInt(req.params.id) });
    for (const farm of farms) {
      // Delete fields associated with this farm
      const fields = await db.findBy('fields', { farm_id: farm.id });
      for (const field of fields) {
        await db.delete('fields', field.id);
      }

      // Delete inspections associated with this farm
      const inspections = await db.findBy('inspections', { farm_id: farm.id });
      for (const inspection of inspections) {
        await db.delete('inspections', inspection.id);
      }

      // Delete the farm
      await db.delete('farms', farm.id);
    }

    // Finally delete the farmer
    await db.delete('farmers', parseInt(req.params.id));

    res.json({ message: 'Farmer deleted successfully' });
  } catch (error) {
    console.error('Error deleting farmer:', error);
    res.status(500).json({ error: 'Failed to delete farmer' });
  }
});

module.exports = router;