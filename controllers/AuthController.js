const { auth } = require('../config/firebase');
const { User } = require('../models');

class AuthController {
  async register(req, res) {
    try {
      const { uid, email, name, role = 'agronomist' } = req.body;

      if (!uid || !email) {
        return res.status(400).json({ error: 'UID and email are required' });
      }

      const existingUser = await User.findOne({ where: { uid } });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const user = await User.create({ uid, email, name, role });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findOne({ where: { uid: req.user.uid } });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, role } = req.body;

      const user = await User.findOne({ where: { uid: req.user.uid } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;

      await user.update(updateData);

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
}

module.exports = new AuthController();