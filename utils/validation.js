// User-friendly error messages for better frontend experience
const getUserFriendlyError = (validationErrors) => {
  const errorMap = {
    'Name is required': 'Please enter the farmer\'s full name',
    'Valid email is required': 'Please enter a valid email address',
    'Phone is required': 'Please provide a phone number',
    'ID Number is required': 'Please enter the farmer\'s ID number',
    'Date of birth is required': 'Please select the farmer\'s date of birth',
    'County is required': 'Please select a county',
    'Sub-county is required': 'Please select a sub-county',
    'Ward is required': 'Please enter the ward name',
    'Village is required': 'Please enter the village name',
    'Physical address is required': 'Please provide a physical address',
    'Farming experience is required': 'Please select farming experience level',
    'Education level must be one of: primary, secondary, certificate, diploma, degree, postgraduate': 'Please select a valid education level',
    'At least one primary crop must be selected': 'Please select at least one primary crop',
    'Farming type must be subsistence, commercial, or mixed': 'Please select a valid farming type',
    'Total land size must be greater than 0': 'Please enter total land size (must be greater than 0)',
    'Cultivated land size must be 0 or greater': 'Please enter cultivated land size',
    'Cultivated land size cannot exceed total land size': 'Cultivated area cannot be larger than total land size',
    'Land tenure must be owned, leased, communal, or family': 'Please select how the land is owned',
    'Soil type is required': 'Please enter the soil type',
    'At least one water source must be selected': 'Please select at least one water source',
    'Previous certification status must be yes, no, or expired': 'Please specify previous certification status',
    'Organic farming experience must be a valid value': 'Please select organic farming experience level'
  };

  return validationErrors.map(error => {

    for (const [key, friendlyMessage] of Object.entries(errorMap)) {
      if (error.includes(key)) {
        return friendlyMessage;
      }
    }

    return error;
  });
};

const validateFarmer = (data) => {
  const errors = [];

  // Step 1: Personal & Contact Information
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.phone || data.phone.trim().length === 0) {
    errors.push('Phone is required');
  }

  if (!data.idNumber || data.idNumber.trim().length === 0) {
    errors.push('ID Number is required');
  }

  if (!data.dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18 || age > 100) {
      errors.push('Farmer must be between 18 and 100 years old');
    }
  }

  // Step 2: Location Details
  if (!data.county || data.county.trim().length === 0) {
    errors.push('County is required');
  }

  if (!data.subCounty || data.subCounty.trim().length === 0) {
    errors.push('Sub-county is required');
  }

  if (!data.ward || data.ward.trim().length === 0) {
    errors.push('Ward is required');
  }

  if (!data.village || data.village.trim().length === 0) {
    errors.push('Village is required');
  }

  if (!data.address || data.address.trim().length === 0) {
    errors.push('Physical address is required');
  }


  // Step 3: Farming Background
  const validFarmingExperienceValues = ['0-2', '3-5', '6-10', '11-20', '20+'];
  if (!data.farmingExperience && !data.yearsInFarming) {
    errors.push('Farming experience is required');
  } else if (data.farmingExperience && !validFarmingExperienceValues.includes(data.farmingExperience)) {
    errors.push('Farming experience must be one of: 0-2, 3-5, 6-10, 11-20, 20+');
  } else if (data.yearsInFarming && !validFarmingExperienceValues.includes(data.yearsInFarming)) {
    errors.push('Years in farming must be one of: 0-2, 3-5, 6-10, 11-20, 20+');
  }

  const validEducationLevels = ['primary', 'secondary', 'certificate', 'diploma', 'degree', 'postgraduate'];
  if (!data.educationLevel || !validEducationLevels.includes(data.educationLevel)) {
    errors.push('Education level must be one of: primary, secondary, certificate, diploma, degree, postgraduate');
  }

  if (!data.primaryCrops || !Array.isArray(data.primaryCrops) || data.primaryCrops.length === 0) {
    errors.push('At least one primary crop must be selected');
  }

  if (!data.farmingType || !['subsistence', 'commercial', 'mixed'].includes(data.farmingType)) {
    errors.push('Farming type must be subsistence, commercial, or mixed');
  }

  // Step 4: Farm Details
  let totalLandSize = parseFloat(data.totalLandSize);
  if (!data.totalLandSize || isNaN(totalLandSize) || totalLandSize <= 0) {
    errors.push('Total land size must be greater than 0');
  }

  // Handle cultivatedSize calculation from frontend fields
  let cultivatedSize = 0;
  if (data.cultivatedSize) {
    cultivatedSize = parseFloat(data.cultivatedSize);
  } else if (data.ownedLandSize || data.leasedLandSize) {
    // Frontend sends separate owned and leased land sizes
    const ownedSize = parseFloat(data.ownedLandSize) || 0;
    const leasedSize = parseFloat(data.leasedLandSize) || 0;
    cultivatedSize = ownedSize + leasedSize;

    // If the calculated total is larger than the provided total, accept the calculated total
    if (cultivatedSize > totalLandSize) {
      totalLandSize = cultivatedSize;
    }
  }

  if (isNaN(cultivatedSize) || cultivatedSize < 0) {
    errors.push('Cultivated land size must be 0 or greater');
  }

  if (cultivatedSize > totalLandSize) {
    errors.push('Cultivated land size cannot exceed total land size');
  }

  if (!data.landTenure || !['owned', 'leased', 'communal', 'family'].includes(data.landTenure)) {
    errors.push('Land tenure must be owned, leased, communal, or family');
  }

  const validSoilTypes = ['clay', 'sandy', 'loam', 'volcanic', 'black cotton'];
  if (!data.soilType || !validSoilTypes.includes(data.soilType)) {
    errors.push('Soil type must be one of: clay, sandy, loam, volcanic, black cotton');
  }

  if (!data.waterSources || !Array.isArray(data.waterSources) || data.waterSources.length === 0) {
    errors.push('At least one water source must be selected');
  }

  // Step 5: Certification Status
  if (!data.previousCertification || !['yes', 'no', 'transitioning'].includes(data.previousCertification)) {
    errors.push('Previous certification status must be yes, no, or transitioning');
  }

  const validOrganicExperienceValues = ['0-1', '2-3', '4-5', '6-10', '10+'];
  if (!data.organicExperience || !validOrganicExperienceValues.includes(data.organicExperience)) {
    errors.push('Organic farming experience must be one of: 0-1, 2-3, 4-5, 6-10, 10+');
  }

  // Make motivation optional since frontend sends motivationForOrganic as empty
  if (data.motivation && data.motivation.trim && data.motivation.trim().length === 0) {
    errors.push('Motivation for organic certification cannot be empty if provided');
  }
  if (data.motivationForOrganic && data.motivationForOrganic.trim && data.motivationForOrganic.trim().length === 0) {
    errors.push('Motivation for organic certification cannot be empty if provided');
  }

  // Status validation (optional, defaults to 'active')
  if (data.status && !['active', 'inactive', 'pending'].includes(data.status)) {
    errors.push('Status must be one of: active, inactive, pending');
  }

  return errors;
};

const validateFarm = (data) => {
  const errors = [];

  if (!data.farmerId) {
    errors.push('Farmer ID is required');
  }

  // Check both name and farmName to be flexible with frontend
  if ((!data.name || data.name.trim().length === 0) && (!data.farmName || data.farmName.trim().length === 0)) {
    errors.push('Farm name is required');
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.push('Location is required');
  }

  // Check both size and totalArea to be flexible with frontend
  const sizeValue = data.totalArea || data.size;
  if (!sizeValue || parseFloat(sizeValue) <= 0) {
    errors.push('Size must be greater than 0');
  }

  return errors;
};

const validateFarmUpdate = (data) => {
  const errors = [];

  // For updates, farmerId is not required since it shouldn't change

  // Check both name and farmName to be flexible with frontend
  if ((!data.name || data.name.trim().length === 0) && (!data.farmName || data.farmName.trim().length === 0)) {
    errors.push('Farm name is required');
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.push('Location is required');
  }

  // Check both size and totalArea to be flexible with frontend
  const sizeValue = data.totalArea || data.size;
  if (!sizeValue || parseFloat(sizeValue) <= 0) {
    errors.push('Size must be greater than 0');
  }

  return errors;
};

const validateField = (data) => {
  const errors = [];
  
  if (!data.farmId) {
    errors.push('Farm ID is required');
  }
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Field name is required');
  }
  
  if (!data.cropType || data.cropType.trim().length === 0) {
    errors.push('Crop type is required');
  }
  
  if (!data.size || data.size <= 0) {
    errors.push('Size must be greater than 0');
  }
  
  return errors;
};

const validateInspection = (data) => {
  const errors = [];
  
  if (!data.farmId) {
    errors.push('Farm ID is required');
  }
  
  if (!data.inspectorName || data.inspectorName.trim().length === 0) {
    errors.push('Inspector name is required');
  }
  
  if (!data.scheduledDate) {
    errors.push('Scheduled date is required');
  }
  
  return errors;
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  validateFarmer,
  validateFarm,
  validateFarmUpdate,
  validateField,
  validateInspection,
  getUserFriendlyError
};