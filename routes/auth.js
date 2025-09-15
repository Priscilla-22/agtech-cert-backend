const express = require('express');
const { auth } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const db = require('../models');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - phone
 *         - address
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the user
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           description: Phone number
 *           example: "+254712345678"
 *         address:
 *           type: string
 *           description: Physical address
 *           example: "P.O Box 123, Nairobi"
 *     ProfileUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Updated name
 *         phone:
 *           type: string
 *           description: Updated phone number
 *         address:
 *           type: string
 *           description: Updated address
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user profile
 *     description: Create user profile in database after Firebase authentication
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const { uid, email, emailVerified } = req.user;

    if (!emailVerified) {
      return res.status(400).json({ error: 'Email must be verified to complete registration' });
    }

    // Check if user already exists
    const existingUser = db.findBy('users', { uid });
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already registered' });
    }

    // Create user profile in our database
    const userData = {
      uid,
      email,
      name,
      phone,
      address,
      role: 'agronomist', // default role
      registrationDate: new Date().toISOString(),
      status: 'active'
    };

    // Add users collection to our in-memory database
    if (!db.users) {
      db.users = [];
    }

    const user = db.create('users', userData);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const users = db.findBy('users', { uid });
    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      uid: user.uid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.status,
      registrationDate: user.registrationDate
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, phone, address } = req.body;

    const users = db.findBy('users', { uid });
    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const user = users[0];
    const updatedUser = db.update('users', user.id, {
      name: name || user.name,
      phone: phone || user.phone,
      address: address || user.address
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        uid: updatedUser.uid,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

/**
 * @swagger
 * /api/auth/verify-token:
 *   post:
 *     summary: Verify authentication token
 *     description: Verify if the provided Firebase JWT token is valid
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token is valid"
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/verify-token', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Token is valid',
      user: {
        uid: req.user.uid,
        email: req.user.email,
        emailVerified: req.user.emailVerified
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Deactivate user account
 *     description: Mark user account as inactive (soft delete)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const users = db.findBy('users', { uid });
    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const user = users[0];
    db.update('users', user.id, { status: 'inactive' });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

module.exports = router;