const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types for API responses
export interface Patient {
  _id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  medicalHistory: {
    conditions: string[];
    surgeries: string[];
    allergies: string[];
    familyHistory: string[];
  };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    prescribedBy: string;
    startDate: string;
    endDate?: string;
  }>;
  vitalSigns: Array<{
    date: string;
    bloodPressure: { systolic: number; diastolic: number };
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
  }>;
  aiHealthSummary?: {
    summary: string;
    riskFactors: string[];
    recommendations: string[];
    lastUpdated: string;
  };
}

export interface Doctor {
  _id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  professionalInfo: {
    licenseNumber: string;
    specializations: string[];
    yearsOfExperience: number;
    education: Array<{
      degree: string;
      institution: string;
      year: number;
    }>;
    certifications: string[];
    languages: string[];
  };
  practiceInfo: {
    hospitalAffiliations: string[];
    clinicAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    consultationFee: number;
    availability: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
  ratings: {
    averageRating: number;
    totalReviews: number;
  };
}

export interface Hospital {
  _id: string;
  basicInfo: {
    name: string;
    type: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    phone: string;
    website?: string;
  };
  services: {
    departments: string[];
    specialties: string[];
    emergencyServices: boolean;
    hasICU: boolean;
    hasEmergencyRoom: boolean;
  };
  capacity: {
    totalBeds: number;
    availableBeds: number;
    icuBeds: number;
    emergencyBeds: number;
  };
  ratings: {
    averageRating: number;
    totalReviews: number;
  };
  operatingHours: {
    emergency: string;
    general: string;
  };
}

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // AI Services
  async generatePatientSummary(patientId: string): Promise<{ summary: string; riskFactors: string[]; recommendations: string[] }> {
    return this.request(`/ai/patient-summary/${patientId}`, {
      method: 'POST',
    });
  }

  async suggestDoctors(patientId: string, location?: { latitude: number; longitude: number }): Promise<Doctor[]> {
    const body: any = { patientId };
    if (location) {
      body.location = location;
    }
    
    return this.request('/ai/suggest-doctors', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async analyzeSymptoms(symptoms: string[], patientId?: string): Promise<{
    possibleConditions: string[];
    recommendedSpecialties: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    return this.request('/ai/analyze-symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptoms, patientId }),
    });
  }

  async generateHealthInsights(patientId: string): Promise<{
    trends: any[];
    alerts: string[];
    recommendations: string[];
  }> {
    return this.request(`/ai/health-insights/${patientId}`, {
      method: 'POST',
    });
  }

  async chatWithAI(message: string, patientId?: string): Promise<{ response: string }> {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, patientId }),
    });
  }

  // Hospital Services
  async findNearbyHospitals(
    latitude: number,
    longitude: number,
    radius: number = 50,
    filters?: {
      type?: string;
      hasEmergency?: boolean;
      specialty?: string;
    }
  ): Promise<Hospital[]> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    return this.request(`/hospitals/nearby?${params}`);
  }

  async findEmergencyHospitals(
    latitude: number,
    longitude: number,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Hospital[]> {
    return this.request('/hospitals/emergency', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, urgency }),
    });
  }

  async findSpecialists(
    specialty: string,
    latitude: number,
    longitude: number,
    radius: number = 50
  ): Promise<Hospital[]> {
    const params = new URLSearchParams({
      specialty,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });

    return this.request(`/hospitals/specialists?${params}`);
  }

  async getHospitalCapacity(hospitalId: string): Promise<{
    totalBeds: number;
    availableBeds: number;
    icuBeds: number;
    emergencyBeds: number;
    occupancyRate: number;
  }> {
    return this.request(`/hospitals/${hospitalId}/capacity`);
  }

  async getDirections(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<{
    distance: string;
    duration: string;
    steps: string[];
  }> {
    const params = new URLSearchParams({
      fromLat: fromLat.toString(),
      fromLng: fromLng.toString(),
      toLat: toLat.toString(),
      toLng: toLng.toString(),
    });

    return this.request(`/hospitals/directions?${params}`);
  }

  // Patient Services
  async getPatient(patientId: string): Promise<Patient> {
    return this.request(`/patients/${patientId}`);
  }

  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient> {
    return this.request(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async createPatient(patientData: Omit<Patient, '_id'>): Promise<Patient> {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  // Authentication
  async login(email: string, password: string, userType: 'patient' | 'doctor' = 'patient'): Promise<{
    token: string;
    user: Patient | Doctor;
  }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });
  }

  async register(userData: any, userType: 'patient' | 'doctor' = 'patient'): Promise<{
    token: string;
    user: Patient | Doctor;
  }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...userData, userType }),
    });
  }

  // Geolocation helper
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual service functions for easier use
export const aiService = {
  generatePatientSummary: (patientId: string) => apiClient.generatePatientSummary(patientId),
  suggestDoctors: (patientId: string, location?: { latitude: number; longitude: number }) => 
    apiClient.suggestDoctors(patientId, location),
  analyzeSymptoms: (symptoms: string[], patientId?: string) => 
    apiClient.analyzeSymptoms(symptoms, patientId),
  generateHealthInsights: (patientId: string) => apiClient.generateHealthInsights(patientId),
  chatWithAI: (message: string, patientId?: string) => apiClient.chatWithAI(message, patientId),
};

export const hospitalService = {
  findNearby: (lat: number, lng: number, radius?: number, filters?: any) => 
    apiClient.findNearbyHospitals(lat, lng, radius, filters),
  findEmergency: (lat: number, lng: number, urgency?: 'low' | 'medium' | 'high') => 
    apiClient.findEmergencyHospitals(lat, lng, urgency),
  findSpecialists: (specialty: string, lat: number, lng: number, radius?: number) => 
    apiClient.findSpecialists(specialty, lat, lng, radius),
  getCapacity: (hospitalId: string) => apiClient.getHospitalCapacity(hospitalId),
  getDirections: (fromLat: number, fromLng: number, toLat: number, toLng: number) => 
    apiClient.getDirections(fromLat, fromLng, toLat, toLng),
};

export const patientService = {
  get: (patientId: string) => apiClient.getPatient(patientId),
  update: (patientId: string, updates: Partial<Patient>) => apiClient.updatePatient(patientId, updates),
  create: (patientData: Omit<Patient, '_id'>) => apiClient.createPatient(patientData),
};

export const authService = {
  login: (email: string, password: string, userType?: 'patient' | 'doctor') => 
    apiClient.login(email, password, userType),
  register: (userData: any, userType?: 'patient' | 'doctor') => 
    apiClient.register(userData, userType),
};

export const locationService = {
  getCurrentLocation: () => apiClient.getCurrentLocation(),
}; 