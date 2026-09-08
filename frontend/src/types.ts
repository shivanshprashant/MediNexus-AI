export type UserRole = 'login' | 'doctor' | 'patient';
export type AppScreen = 'login' | 'doctor' | 'patient';

export type DoctorTab = 'home' | 'patients' | 'schedule' | 'alerts' | 'profile';
export type PatientTab = 'home' | 'book' | 'records' | 'profile' | 'ai' | 'history' | 'sos' | 'clinics';

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
