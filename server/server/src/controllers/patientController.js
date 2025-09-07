const Patient = require('../models/Patient');
const FamilyMember = require('../models/FamilyMember');
const logger = require('../utils/logger');

/**
 * Create a new patient
 */
const createPatient = async (req, res) => {
  try {
    const patientData = req.body;
    
    // Check if phone number already exists
    const existingPatient = await Patient.findOne({
      'personalInfo.phoneNumber': patientData.personalInfo.phoneNumber
    });
    
    if (existingPatient) {
      return res.status(400).json({
        error: 'Patient with this phone number already exists'
      });
    }
    
    const patient = new Patient(patientData);
    await patient.save();
    
    logger.info(`New patient created: ${patient._id}`);
    
    res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        id: patient._id,
        name: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
        phoneNumber: patient.personalInfo.phoneNumber
      }
    });
    
  } catch (error) {
    logger.error('Failed to create patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

/**
 * Get patient by ID
 */
const getPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await Patient.findById(patientId)
      .populate('familyMembers', 'firstName lastName email phoneNumber relationshipToPatient');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      patient
    });
    
  } catch (error) {
    logger.error('Failed to get patient:', error);
    res.status(500).json({ error: 'Failed to retrieve patient' });
  }
};

/**
 * Update patient information
 */
const updatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const updateData = req.body;
    
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    logger.info(`Patient updated: ${patientId}`);
    
    res.json({
      message: 'Patient updated successfully',
      patient
    });
    
  } catch (error) {
    logger.error('Failed to update patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

/**
 * Get all patients
 */
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, active = true } = req.query;
    
    const query = { isActive: active === 'true' };
    
    const patients = await Patient.find(query)
      .select('personalInfo medications.name medications.times isActive createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Patient.countDocuments(query);
    
    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    logger.error('Failed to get patients:', error);
    res.status(500).json({ error: 'Failed to retrieve patients' });
  }
};

/**
 * Delete patient (soft delete)
 */
const deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    logger.info(`Patient deactivated: ${patientId}`);
    
    res.json({ message: 'Patient deactivated successfully' });
    
  } catch (error) {
    logger.error('Failed to delete patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};

/**
 * Get patient dashboard data
 */
const getPatientDashboard = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      patient: {
        id: patient._id,
        name: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
        medications: patient.medications ? patient.medications.filter(med => med.isActive) : [],
        lastUpdated: patient.updatedAt
      }
    });
    
  } catch (error) {
    logger.error('Failed to get patient dashboard:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
};

// Export all functions
module.exports = {
  createPatient,
  getAllPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientDashboard
};
