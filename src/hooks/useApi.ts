import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  aiService, 
  hospitalService, 
  patientService, 
  authService, 
  locationService,
  type Patient,
  type Doctor,
  type Hospital 
} from '../services/api';

// Patient hooks
export const usePatient = (patientId: string) => {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.get(patientId),
    enabled: !!patientId,
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ patientId, updates }: { patientId: string; updates: Partial<Patient> }) =>
      patientService.update(patientId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(['patient', data._id], data);
      queryClient.invalidateQueries({ queryKey: ['patient'] });
    },
  });
};

// AI Service hooks
export const usePatientSummary = (patientId: string) => {
  return useQuery({
    queryKey: ['patient-summary', patientId],
    queryFn: () => aiService.generatePatientSummary(patientId),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useGeneratePatientSummary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (patientId: string) => aiService.generatePatientSummary(patientId),
    onSuccess: (data, patientId) => {
      queryClient.setQueryData(['patient-summary', patientId], data);
    },
  });
};

export const useSuggestDoctors = (patientId: string, location?: { latitude: number; longitude: number }) => {
  return useQuery({
    queryKey: ['suggested-doctors', patientId, location],
    queryFn: () => aiService.suggestDoctors(patientId, location),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useAnalyzeSymptoms = () => {
  return useMutation({
    mutationFn: ({ symptoms, patientId }: { symptoms: string[]; patientId?: string }) =>
      aiService.analyzeSymptoms(symptoms, patientId),
  });
};

export const useHealthInsights = (patientId: string) => {
  return useQuery({
    queryKey: ['health-insights', patientId],
    queryFn: () => aiService.generateHealthInsights(patientId),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useChatWithAI = () => {
  return useMutation({
    mutationFn: ({ message, patientId }: { message: string; patientId?: string }) =>
      aiService.chatWithAI(message, patientId),
  });
};

// Hospital Service hooks
export const useNearbyHospitals = (
  latitude?: number,
  longitude?: number,
  radius: number = 50,
  filters?: any
) => {
  return useQuery({
    queryKey: ['nearby-hospitals', latitude, longitude, radius, filters],
    queryFn: () => hospitalService.findNearby(latitude!, longitude!, radius, filters),
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useEmergencyHospitals = () => {
  return useMutation({
    mutationFn: ({ 
      latitude, 
      longitude, 
      urgency 
    }: { 
      latitude: number; 
      longitude: number; 
      urgency?: 'low' | 'medium' | 'high' 
    }) => hospitalService.findEmergency(latitude, longitude, urgency),
  });
};

export const useSpecialistHospitals = (
  specialty?: string,
  latitude?: number,
  longitude?: number,
  radius: number = 50
) => {
  return useQuery({
    queryKey: ['specialist-hospitals', specialty, latitude, longitude, radius],
    queryFn: () => hospitalService.findSpecialists(specialty!, latitude!, longitude!, radius),
    enabled: !!specialty && !!latitude && !!longitude,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useHospitalCapacity = (hospitalId: string) => {
  return useQuery({
    queryKey: ['hospital-capacity', hospitalId],
    queryFn: () => hospitalService.getCapacity(hospitalId),
    enabled: !!hospitalId,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes for real-time data
  });
};

export const useDirections = () => {
  return useMutation({
    mutationFn: ({ 
      fromLat, 
      fromLng, 
      toLat, 
      toLng 
    }: { 
      fromLat: number; 
      fromLng: number; 
      toLat: number; 
      toLng: number; 
    }) => hospitalService.getDirections(fromLat, fromLng, toLat, toLng),
  });
};

// Location hook
export const useCurrentLocation = () => {
  return useQuery({
    queryKey: ['current-location'],
    queryFn: () => locationService.getCurrentLocation(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

// Authentication hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      email, 
      password, 
      userType 
    }: { 
      email: string; 
      password: string; 
      userType?: 'patient' | 'doctor' 
    }) => authService.login(email, password, userType),
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update query cache
      queryClient.setQueryData(['current-user'], data.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      userData, 
      userType 
    }: { 
      userData: any; 
      userType?: 'patient' | 'doctor' 
    }) => authService.register(userData, userType),
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update query cache
      queryClient.setQueryData(['current-user'], data.user);
    },
  });
};

// Current user hook
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    },
    staleTime: Infinity, // Don't refetch automatically
  });
};

// Logout hook
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

// Combined hook for getting user location and nearby hospitals
export const useLocationAndHospitals = (filters?: any) => {
  const { data: location, isLoading: locationLoading, error: locationError } = useCurrentLocation();
  const { 
    data: hospitals, 
    isLoading: hospitalsLoading, 
    error: hospitalsError 
  } = useNearbyHospitals(location?.latitude, location?.longitude, 50, filters);

  return {
    location,
    hospitals,
    isLoading: locationLoading || hospitalsLoading,
    error: locationError || hospitalsError,
  };
}; 