export type UserRole = 'hospital_admin';

export type HospitalAdminTab =
  | 'dashboard'
  | 'emergency-requests'
  | 'departments'
  | 'beds'
  | 'doctors'
  | 'notifications'
  | 'profile';

export type EmergencyRequestSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';
export type EmergencyRequestStatus =
  | 'REQUEST CREATED'
  | 'HOSPITAL NOTIFIED'
  | 'ACCEPTED'
  | 'IN PROGRESS'
  | 'COMPLETED'
  | 'REJECTED';

// Nested Department-Wise Resource Architecture

export interface DepartmentBedType {
  id: string;
  bedType: string;
  total: number;
  occupied: number;
  available: number;
  floorWard: string;
}

export interface DepartmentDoctor {
  id: string;
  doctorCode: string;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  contactPhone: string;
  email: string;
  shift: string;
  availability: 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE';
}

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  description: string;
  contactPhone: string;
  locationFloor: string;
  operatingHours: string;
  is24x7: boolean;
  hasEmergencySupport: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  beds: DepartmentBedType[];
  doctors: DepartmentDoctor[];
  services: string[];
}

export interface EmergencySetupConfig {
  is24x7Emergency: boolean;
  departmentName: string;
  emergencyContact: string;
  totalEmergencyBeds: number;
  availableEmergencyBeds: number;
  traumaCareAvailable: boolean;
  ambulanceAvailable: boolean;
  emergencyDoctorsOnDutyCount: number;
}

export interface HospitalLocationConfig {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  emergencyEntranceLocation: string;
  mainEntranceLocation: string;
  contactInfo: string;
}

export interface DetailedHospital {
  id: string;
  hospitalCode: string;
  name: string;
  type: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  website: string;
  establishedYear: number;
  employeeCount: number;
  description: string;
  location: HospitalLocationConfig;
  departments: DepartmentItem[];
  emergencyConfig: EmergencySetupConfig;
  globalServices: string[];
  isOnboarded: boolean;
  adminName: string;
  adminEmail: string;
}

export interface HospitalEmergencyRequest {
  id: string;
  patientId: string;
  patientName: string;
  ageGender: string;
  severity: EmergencyRequestSeverity;
  requiredCare: string;
  requestTime: string;
  timestamp: string;
  status: EmergencyRequestStatus;
  complaint: string;
  aiAssessment: string;
  aiRecommendation: string;
  aiSummary: string;
  medicalInfo: string;
  allocatedBed?: string;
}

export interface BedCategoryStatus {
  id: 'general' | 'icu' | 'emergency';
  categoryName: string;
  total: number;
  occupied: number;
  available: number;
}

export interface DoctorStaffStatus {
  id: string;
  name: string;
  department: string;
  availability: 'ON DUTY' | 'OFF DUTY';
  shiftStatus: string;
  phone?: string;
}

export interface HospitalActivityLog {
  id: string;
  time: string;
  message: string;
  category: 'emergency' | 'doctor' | 'bed' | 'system';
}

export interface HospitalProfile {
  id: string;
  name: string;
  hospitalCode: string;
  adminName: string;
  adminEmail: string;
  address: string;
  contactPhone: string;
  emergencyDepartment: string;
  availableServices: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  type: string;
  unread: boolean;
  time?: string;
  desc?: string;
}
