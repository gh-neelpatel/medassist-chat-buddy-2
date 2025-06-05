import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  services: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  emergencyServices: {
    type: Boolean,
    default: false
  },
  operatingHours: {
    weekdays: {
      open: String,
      close: String
    },
    weekends: {
      open: String,
      close: String
    },
    is24Hours: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  capacity: Number,
  isAvailable: {
    type: Boolean,
    default: true
  },
  equipment: [String],
  lastMaintenance: Date,
  nextMaintenance: Date
});

const insuranceSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true
  },
  plans: [String],
  isInNetwork: {
    type: Boolean,
    default: true
  },
  copayAmount: Number,
  deductibleAmount: Number
});

const emergencyServiceSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  averageWaitTime: Number, // in minutes
  capacity: Number,
  currentLoad: {
    type: Number,
    default: 0
  }
});

const hospitalSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: String,
  hospitalId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'specialty', 'teaching', 'research', 'rehabilitation', 'psychiatric', 'children'],
    required: true
  },
  
  // Contact Information
  phone: {
    type: String,
    required: true
  },
  email: String,
  website: String,
  emergencyPhone: String,
  
  // Address and Location
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'US'
    }
  },
  
  // Geographical coordinates for location services
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  
  // Hospital Details
  description: String,
  established: Date,
  bedCount: {
    total: Number,
    available: Number,
    icu: Number,
    emergency: Number,
    general: Number
  },
  
  // Departments and Services
  departments: [departmentSchema],
  specialtyServices: [String],
  emergencyServices: [emergencyServiceSchema],
  
  // Facilities and Equipment
  facilities: [facilitySchema],
  parkingSpaces: {
    total: Number,
    available: Number,
    handicapAccessible: Number,
    valetService: Boolean
  },
  
  // Staff Information
  totalStaff: Number,
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  
  // Accreditation and Certifications
  accreditations: [{
    body: String,
    certificate: String,
    issueDate: Date,
    expiryDate: Date,
    isActive: Boolean
  }],
  
  // Quality Metrics
  qualityRatings: {
    overall: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    cleanliness: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    staffRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    waitTime: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  
  // Insurance and Financial
  acceptedInsurance: [insuranceSchema],
  
  // Operating Information
  operatingHours: {
    emergency: {
      is24Hours: {
        type: Boolean,
        default: true
      }
    },
    outpatient: {
      weekdays: {
        open: String,
        close: String
      },
      weekends: {
        open: String,
        close: String
      }
    },
    visiting: {
      weekdays: {
        start: String,
        end: String
      },
      weekends: {
        start: String,
        end: String
      }
    }
  },
  
  // Digital Services
  onlineAppointments: {
    type: Boolean,
    default: false
  },
  telemedicine: {
    type: Boolean,
    default: false
  },
  patientPortal: {
    type: Boolean,
    default: false
  },
  
  // Reviews and Feedback
  reviews: [{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    department: String,
    visitDate: Date,
    isVerified: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  }],
  
  // Network Information
  networkAffiliations: [String],
  parentOrganization: String,
  
  // AI-generated insights
  patientFlowMetrics: {
    averageWaitTime: Number,
    peakHours: [String],
    occupancyRate: Number,
    readmissionRate: Number
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Compliance and Safety
  safetyRatings: {
    infectionControl: Number,
    patientSafety: Number,
    medicationSafety: Number
  },
  
  // Contact for Integration
  apiEndpoints: {
    appointments: String,
    records: String,
    availability: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
hospitalSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

hospitalSchema.virtual('occupancyRate').get(function() {
  if (!this.bedCount.total || !this.bedCount.available) return null;
  return Math.round(((this.bedCount.total - this.bedCount.available) / this.bedCount.total) * 100);
});

hospitalSchema.virtual('averageRating').get(function() {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const publicReviews = this.reviews.filter(review => review.isPublic);
  if (publicReviews.length === 0) return 0;
  
  const totalRating = publicReviews.reduce((sum, review) => sum + review.rating, 0);
  return Number((totalRating / publicReviews.length).toFixed(1));
});

hospitalSchema.virtual('totalReviews').get(function() {
  if (!this.reviews) return 0;
  return this.reviews.filter(review => review.isPublic).length;
});

// Indexes for better performance
hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ hospitalId: 1 });
hospitalSchema.index({ type: 1 });
hospitalSchema.index({ 'address.city': 1 });
hospitalSchema.index({ 'address.state': 1 });
hospitalSchema.index({ 'address.zipCode': 1 });
hospitalSchema.index({ specialtyServices: 1 });
hospitalSchema.index({ isActive: 1 });
hospitalSchema.index({ isVerified: 1 });
hospitalSchema.index({ 'qualityRatings.overall': -1 });

// Compound indexes
hospitalSchema.index({ type: 1, 'address.city': 1 });
hospitalSchema.index({ isActive: 1, isVerified: 1, 'qualityRatings.overall': -1 });

// Instance methods
hospitalSchema.methods.getNearbyHospitals = async function(radiusInKm = 10) {
  return this.constructor.find({
    location: {
      $near: {
        $geometry: this.location,
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    },
    _id: { $ne: this._id },
    isActive: true
  });
};

hospitalSchema.methods.getAvailableBeds = function(type = 'general') {
  if (type === 'all') {
    return this.bedCount.available || 0;
  }
  return this.bedCount[type] || 0;
};

hospitalSchema.methods.getDepartmentByName = function(departmentName) {
  return this.departments.find(dept => 
    dept.name.toLowerCase() === departmentName.toLowerCase() && dept.isActive
  );
};

hospitalSchema.methods.hasSpecialtyService = function(service) {
  return this.specialtyServices.includes(service);
};

hospitalSchema.methods.acceptsInsurance = function(insuranceProvider) {
  return this.acceptedInsurance.some(insurance => 
    insurance.provider.toLowerCase() === insuranceProvider.toLowerCase() && insurance.isInNetwork
  );
};

hospitalSchema.methods.getCurrentWaitTime = function(department) {
  if (department) {
    const emergencyService = this.emergencyServices.find(service => 
      service.service.toLowerCase().includes(department.toLowerCase())
    );
    return emergencyService ? emergencyService.averageWaitTime : null;
  }
  
  // Return average wait time across all emergency services
  if (this.emergencyServices.length === 0) return null;
  
  const totalWaitTime = this.emergencyServices.reduce((sum, service) => 
    sum + (service.averageWaitTime || 0), 0
  );
  
  return Math.round(totalWaitTime / this.emergencyServices.length);
};

hospitalSchema.methods.addReview = function(patientId, rating, comment, department, visitDate) {
  this.reviews.push({
    patient: patientId,
    rating,
    comment,
    department,
    visitDate,
    isVerified: true
  });
  
  return this.save();
};

// Static methods
hospitalSchema.statics.findNearby = function(coordinates, radiusInKm = 10, filters = {}) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: radiusInKm * 1000
      }
    },
    isActive: true,
    ...filters
  };
  
  return this.find(query);
};

hospitalSchema.statics.findBySpecialty = function(specialty) {
  return this.find({
    specialtyServices: { $in: [specialty] },
    isActive: true,
    isVerified: true
  });
};

hospitalSchema.statics.findByInsurance = function(insuranceProvider) {
  return this.find({
    'acceptedInsurance.provider': { 
      $regex: new RegExp(insuranceProvider, 'i') 
    },
    'acceptedInsurance.isInNetwork': true,
    isActive: true
  });
};

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital; 