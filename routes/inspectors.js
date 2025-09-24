const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Inspector:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - specialization
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the inspector
 *         name:
 *           type: string
 *           description: Full name of the inspector
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         phone:
 *           type: string
 *           description: Phone number
 *         specialization:
 *           type: string
 *           enum: [organic-crops, livestock, processing, general, soil-management, pest-control]
 *           description: Inspector's area of specialization
 *         qualifications:
 *           type: string
 *           description: Qualifications and certifications
 *         experience:
 *           type: string
 *           enum: [1-2, 3-5, 6-10, 10+]
 *           description: Years of experience
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Inspector's current status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/inspectors:
 *   get:
 *     summary: Get all inspectors
 *     description: Retrieve a list of all inspectors
 *     tags: [Inspectors]
 *     responses:
 *       200:
 *         description: List of inspectors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inspector'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const limitNum = Math.max(1, parseInt(limit) || 50);
    const offsetNum = Math.max(0, parseInt(offset) || 0);

    const query = `
      SELECT * FROM inspectors
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const inspectors = await db.query(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM inspectors ${whereClause}`;
    const countParams = status ? [status] : [];
    const [{ total }] = await db.query(countQuery, countParams);

    // Map database fields to frontend format
    const mappedInspectors = inspectors.map(inspector => ({
      id: inspector.id,
      name: inspector.name,
      email: inspector.email,
      phone: inspector.phone,
      specialization: inspector.specialization,
      qualifications: inspector.qualifications,
      experience: inspector.experience,
      status: inspector.status,
      createdAt: inspector.created_at,
      updatedAt: inspector.updated_at
    }));

    res.json({
      data: mappedInspectors,
      total: parseInt(total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching inspectors:', error);
    res.status(500).json({ error: 'Failed to fetch inspectors' });
  }
});

/**
 * @swagger
 * /api/inspectors:
 *   post:
 *     summary: Create a new inspector
 *     description: Register a new inspector in the system
 *     tags: [Inspectors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - specialization
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               specialization:
 *                 type: string
 *               qualifications:
 *                 type: string
 *               experience:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: active
 *     responses:
 *       201:
 *         description: Inspector created successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      qualifications = '',
      experience = '1-2',
      status = 'active'
    } = req.body;

    // Basic validation
    if (!name || !email || !phone || !specialization) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, phone, specialization'
      });
    }

    // Check if email already exists
    const existingInspector = await db.query(
      'SELECT id FROM inspectors WHERE email = ?',
      [email]
    );

    if (existingInspector.length > 0) {
      return res.status(400).json({
        error: 'Inspector with this email already exists'
      });
    }

    const query = `
      INSERT INTO inspectors (
        name, email, phone, specialization, qualifications,
        experience, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await db.query(query, [
      name, email, phone, specialization,
      qualifications, experience, status
    ]);

    // Fetch the created inspector
    const [newInspector] = await db.query(
      'SELECT * FROM inspectors WHERE id = ?',
      [result.insertId]
    );

    // Map to frontend format
    const mappedInspector = {
      id: newInspector.id,
      name: newInspector.name,
      email: newInspector.email,
      phone: newInspector.phone,
      specialization: newInspector.specialization,
      qualifications: newInspector.qualifications,
      experience: newInspector.experience,
      status: newInspector.status,
      createdAt: newInspector.created_at,
      updatedAt: newInspector.updated_at
    };

    res.status(201).json(mappedInspector);
  } catch (error) {
    console.error('Error creating inspector:', error);
    res.status(500).json({ error: 'Failed to create inspector' });
  }
});

/**
 * @swagger
 * /api/inspectors/{id}:
 *   get:
 *     summary: Get an inspector by ID
 *     description: Retrieve a specific inspector's details
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inspector ID
 *     responses:
 *       200:
 *         description: Inspector details
 *       404:
 *         description: Inspector not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [inspector] = await db.query(
      'SELECT * FROM inspectors WHERE id = ?',
      [id]
    );

    if (!inspector) {
      return res.status(404).json({ error: 'Inspector not found' });
    }

    // Map to frontend format
    const mappedInspector = {
      id: inspector.id,
      name: inspector.name,
      email: inspector.email,
      phone: inspector.phone,
      specialization: inspector.specialization,
      qualifications: inspector.qualifications,
      experience: inspector.experience,
      status: inspector.status,
      createdAt: inspector.created_at,
      updatedAt: inspector.updated_at
    };

    res.json(mappedInspector);
  } catch (error) {
    console.error('Error fetching inspector:', error);
    res.status(500).json({ error: 'Failed to fetch inspector' });
  }
});

/**
 * @swagger
 * /api/inspectors/{id}:
 *   put:
 *     summary: Update an inspector
 *     description: Update an existing inspector's information
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inspector ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               specialization:
 *                 type: string
 *               qualifications:
 *                 type: string
 *               experience:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inspector updated successfully
 *       404:
 *         description: Inspector not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if inspector exists
    const [existingInspector] = await db.query(
      'SELECT id FROM inspectors WHERE id = ?',
      [id]
    );

    if (!existingInspector) {
      return res.status(404).json({ error: 'Inspector not found' });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'email', 'phone', 'specialization', 'qualifications', 'experience', 'status'];
    const updateFields = [];
    const updateValues = [];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const query = `
      UPDATE inspectors
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await db.query(query, updateValues);

    // Fetch updated inspector
    const [updatedInspector] = await db.query(
      'SELECT * FROM inspectors WHERE id = ?',
      [id]
    );

    // Map to frontend format
    const mappedInspector = {
      id: updatedInspector.id,
      name: updatedInspector.name,
      email: updatedInspector.email,
      phone: updatedInspector.phone,
      specialization: updatedInspector.specialization,
      qualifications: updatedInspector.qualifications,
      experience: updatedInspector.experience,
      status: updatedInspector.status,
      createdAt: updatedInspector.created_at,
      updatedAt: updatedInspector.updated_at
    };

    res.json(mappedInspector);
  } catch (error) {
    console.error('Error updating inspector:', error);
    res.status(500).json({ error: 'Failed to update inspector' });
  }
});

/**
 * @swagger
 * /api/inspectors/{id}:
 *   delete:
 *     summary: Delete an inspector
 *     description: Remove an inspector from the system
 *     tags: [Inspectors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Inspector ID
 *     responses:
 *       200:
 *         description: Inspector deleted successfully
 *       404:
 *         description: Inspector not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if inspector exists
    const [existingInspector] = await db.query(
      'SELECT id FROM inspectors WHERE id = ?',
      [id]
    );

    if (!existingInspector) {
      return res.status(404).json({ error: 'Inspector not found' });
    }

    // Check if inspector has any active inspections
    const [activeInspections] = await db.query(
      'SELECT COUNT(*) as count FROM inspections WHERE inspector_name = (SELECT name FROM inspectors WHERE id = ?) AND status IN ("scheduled", "in_progress")',
      [id]
    );

    if (activeInspections.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete inspector with active inspections. Please reassign or complete existing inspections first.'
      });
    }

    await db.query('DELETE FROM inspectors WHERE id = ?', [id]);

    res.json({ message: 'Inspector deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspector:', error);
    res.status(500).json({ error: 'Failed to delete inspector' });
  }
});

module.exports = router;