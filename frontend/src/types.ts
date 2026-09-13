export type UserRole = 'login' | 'doctor' | 'patient';
export type AppScreen =
  | 'landing'
  | 'login'
  | 'patient_register'
  | 'doctor_register'
  | 'doctor'
  | 'patient';

export type DoctorTab = 'home' | 'patients' | 'schedule' | 'alerts' | 'profile';
export type PatientTab =
  | 'home'
  | 'book'
  | 'records'
  | 'profile'
  | 'ai'
  | 'history'
  | 'sos'
  | 'clinics'
  | 'emergency_view'
  | 'video_view'
  | 'video_choice';

export type PathwayNextStep =
  | 'EMERGENCY'
  | 'URGENT_IN_PERSON'
  | 'ROUTINE_CONSULTATION'
  | 'VIDEO_PREFERRED'
  | 'VIDEO_OR_IN_PERSON';

export type ConsultationMode =
  | 'NONE'
  | 'IN_PERSON'
  | 'VIDEO'
  | 'VIDEO_OR_IN_PERSON';

export interface PathwayResult {
  next_step: PathwayNextStep;
  consultation_mode: ConsultationMode;
  target_department: string;
  recommendation_title: string;
  recommendation_summary: string;
  primary_action_label: string;
}

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
  bedType: string; // e.g. 'General' | 'Emergency' | 'ICU' | 'CCU' | 'HDU' | 'Private' | 'Pediatric'
  total: number;
  occupied: number;
  available: number; // Always total - occupied
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
  operatingHours: string; // e.g. '24x7' or '08:00 AM - 08:00 PM'
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
  type: string; // 'Government' | 'Private Multi-Specialty Hospital' | 'Trust' | 'Teaching Hospital' | etc.
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
  id: string; // e.g. 'P-102'
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



export interface Hospital {
  id: string;
  name: string;
  dist: string;
  time: string;
  traffic: string;
  address: string;
  phone: string;
  vacantBeds: number;
  totalBeds: number;
  erStatus: string;
}

export interface ActiveSosState {
  active: boolean;
  mode: 'drive-in' | 'ambulance';
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  bedNo: string;
  status: 'en-route' | 'accepted' | 'redirected';
  redirectedHospitalName?: string;
  redirectedHospitalAddress?: string;
}

export interface Patient {
  id: string;
  name: string;
  mrn: string;
  dept: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  blood: string;
  priority: 'HIGH' | 'NORMAL';
  status: 'WAITING' | 'COMPLETED';
  lastVisit: string;
  nextAppointment: string;
  allergies: string;
  meds: string;
  history: string;
  reason: string;
  recommendation: string;
  avatarPrompt?: string;
  heartRate?: string;
}

export interface Specialist {
  id: string;
  name: string;
  specialty?: string;
  dept?: string;
  title: string;
  facility?: string;
  hospital?: string;
  wing?: string;
  room?: string;
  rating: string;
  reviews: string;
  copay?: string;
  copayAmount?: string;
  fee?: string;
  experience?: string;
  earliest?: string;
  availableSlot?: string;
  photo?: string;
  image?: string;
}

export interface Appointment {
  id: string;
  bookingId?: string;
  name?: string;
  ageGender?: string;
  mrn?: string;
  department?: string;
  modality: string;
  modalityType?: string;
  time: string;
  dateLabel?: string;
  date?: string;
  fullDateStr?: string;
  status: 'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  reason: string;
  initials?: string;
  bgColor?: string;
  clinicalBrief?: string;
  doctor?: {
    id?: string;
    name: string;
    title?: string;
    specialty?: string;
    facility?: string;
    hospitalAffiliation?: string;
    photo?: string;
    rating?: string;
    copay?: string;
  };
  coverage?: {
    plan?: string;
    copay: string;
    healthKeyToken?: string;
    status?: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  icon?: string;
  type: string;
  category?: 'appointment' | 'ai-summary' | 'consultation' | 'alert-log' | 'urgent';
  unread: boolean;
  timeAgo?: string;
  time?: string;
  summary?: string;
  desc?: string;
  content?: string;
  patient?: Patient;
}

export interface DoctorProfileInfo {
  name: string;
  title: string;
  hospital: string;
  license: string;
  abhaId: string;
  room: string;
  hours: string;
  photo: string;
}

export type MedicalRecordCategory =
  | 'Lab Report'
  | 'Imaging'
  | 'Prescription'
  | 'Discharge Summary'
  | 'Surgical Note'
  | 'Follow-Up Note'
  | 'Other';

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  title: string;
  category: MedicalRecordCategory;
  date: string;
  doctor: string;
  department: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'dicom' | 'doc';
  fileSize: string;
  notes: string;
  uploadedBy: 'doctor' | 'patient' | 'system';
  tags: string[];
}

