import mongoose from 'mongoose';

export const validatePatientId = (req, res, next) => {
  const { patientId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid patient ID format' }
    });
  }
  
  next();
};

export const validateDoctorId = (req, res, next) => {
  const { doctorId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid doctor ID format' }
    });
  }
  
  next();
};

export const validateHospitalId = (req, res, next) => {
  const { hospitalId, id } = req.params;
  const targetId = hospitalId || id;
  
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid hospital ID format' }
    });
  }
  
  next();
}; 