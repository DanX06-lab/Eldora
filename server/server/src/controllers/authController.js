const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class AuthController {
  
  // Register new user
  async register(req, res) {
    try {
      // Accept frontend field names: name, email, phone, emergencyContact, password
      const { name, email, phone, emergencyContact, password } = req.body;
      
      // Validate required fields
      if (!name || !email || !phone || !password) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: ['name', 'email', 'phone', 'password'].filter(field => !req.body[field]).map(field => ({
            field,
            message: `${field} is required`
          }))
        });
      }
      
      // Split name into firstName and lastName for database storage
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'User with this email already exists'
        });
      }
      
      // Create new user with mapped fields
      const user = new User({
        firstName,
        lastName,
        email,
        phoneNumber: phone, // Map phone to phoneNumber
        relationshipToPatient: 'patient', // Default for elderly patients
        password,
        emergencyContact // Add emergency contact if your User model supports it
      });
      
      await user.save();
      
      // Generate JWT token for auto-login
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      logger.info(`New user registered: ${email}`);
      
      res.status(201).json({
        message: 'User registered successfully',
        token, // Include token for auto-login
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phoneNumber
        }
      });
      
    } catch (error) {
      logger.error('Registration error:', error);
      
      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      res.status(500).json({ error: 'Registration failed' });
    }
  }
  
  // Keep your existing login, logout, getProfile methods unchanged
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      logger.info(`User logged in: ${email}`);
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phoneNumber
        }
      });
      
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
  
  // Logout user
  async logout(req, res) {
    try {
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
  
  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      res.json({ 
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phoneNumber
        }
      });
    } catch (error) {
      logger.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
}

module.exports = new AuthController();
