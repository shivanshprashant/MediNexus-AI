export const API_BASE_URL = 'http://127.0.0.1:8000/api';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('medinexus_token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('medinexus_token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('medinexus_token');
  }
}

function getHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(payload: { email: string; password?: string; role: 'patient' | 'doctor' }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      role: payload.role,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Login failed with status ${res.status}`);
  }
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function registerPatientApi(payload: any) {
  const res = await fetch(`${API_BASE_URL}/auth/register/patient`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Patient registration failed');
  }
  const data = await res.json();
  if (data.access_token) setAuthToken(data.access_token);
  return data;
}

export async function resetPasswordApi(payload: { email: string; new_password: string; role?: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Password reset failed');
  }
  return await res.json();
}

export async function registerDoctorApi(payload: any) {
  const res = await fetch(`${API_BASE_URL}/auth/register/doctor`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Doctor registration failed');
  }
  const data = await res.json();
  if (data.access_token) setAuthToken(data.access_token);
  return data;
}

export async function fetchPatientsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/patients`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch patients failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchPatients error, falling back:', err);
    return null;
  }
}

export async function fetchPatientProfileApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/patients/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch patient profile failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchPatientProfile error, falling back:', err);
    return null;
  }
}

export async function updatePatientProfileApi(payload: any) {
  const res = await fetch(`${API_BASE_URL}/patients/me`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Update patient profile failed');
  return await res.json();
}

export async function uploadPatientPhotoApi(file: File) {
  const headers = getHeaders() as Record<string, string>;
  headers['Content-Type'] = file.type || 'image/jpeg';
  const res = await fetch(`${API_BASE_URL}/patients/me/photo`, {
    method: 'POST',
    headers,
    body: file,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Photo upload failed');
  }
  return await res.json();
}

export async function fetchDoctorProfileApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch doctor profile failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchDoctorProfile error, falling back:', err);
    return null;
  }
}

export async function updateDoctorProfileApi(payload: any) {
  const res = await fetch(`${API_BASE_URL}/doctors/me`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Update doctor profile failed');
  return await res.json();
}

export async function uploadDoctorPhotoApi(file: File) {
  const headers = getHeaders() as Record<string, string>;
  headers['Content-Type'] = file.type || 'image/jpeg';
  const res = await fetch(`${API_BASE_URL}/doctors/me/photo`, {
    method: 'POST',
    headers,
    body: file,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Doctor photo upload failed');
  }
  return await res.json();
}

export async function fetchDoctorsApi(hospital_id: string = 'hsp-001') {
  try {
    const res = await fetch(`${API_BASE_URL}/doctors?hospital_id=${hospital_id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch doctors failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchDoctors error, falling back:', err);
    return null;
  }
}

export async function updateDoctorStatusApi(doctorId: string, availability: string = 'ON DUTY') {
  const encAvailability = encodeURIComponent(availability);
  const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/status?availability=${encAvailability}`, {
    method: 'PUT',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Update doctor status failed');
  return await res.json();
}

export async function fetchAppointmentsApi(doctorId?: string, patientId?: string) {
  try {
    let url = `${API_BASE_URL}/appointments`;
    const params = new URLSearchParams();
    if (doctorId) params.append('doctor_id', doctorId);
    if (patientId) params.append('patient_id', patientId);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch appointments failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchAppointments error, falling back:', err);
    return null;
  }
}

export async function createAppointmentApi(payload: {
  doctor_id?: string;
  patient_id?: string;
  date: string;
  time: string;
  modality: string;
  reason: string;
  clinical_notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/appointments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Create appointment failed');
  }
  return await res.json();
}

export async function updateAppointmentApi(appointmentId: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Update appointment failed');
  return await res.json();
}

export async function triggerEmergencySosApi(payload: {
  mode?: string;
  target_hospital_id?: string;
  complaint?: string;
  patient_id?: string;
  patient_name?: string;
  age_gender?: string;
  medical_info?: string;
  patient_location?: string;
  patient_latitude?: number;
  patient_longitude?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/emergency/sos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      mode: payload.mode || 'drive-in',
      target_hospital_id: payload.target_hospital_id || 'hsp-001',
      complaint: payload.complaint || 'Acute emergency symptom presentation',
      patient_id: payload.patient_id,
      patient_name: payload.patient_name,
      age_gender: payload.age_gender,
      medical_info: payload.medical_info,
      patient_location: payload.patient_location,
      patient_latitude: payload.patient_latitude,
      patient_longitude: payload.patient_longitude,
    }),
  });
  if (!res.ok) throw new Error('Emergency SOS trigger failed');
  return await res.json();
}

export async function analyzeSymptomsApi(symptomText: string, medicalContext: string = '') {
  const res = await fetch(`${API_BASE_URL}/ai/symptom-analysis`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      symptom_text: symptomText,
      medical_context: medicalContext,
    }),
  });
  if (!res.ok) throw new Error('Symptom analysis failed');
  return await res.json();
}

export async function createAdmissionRequestApi(payload: { hospital_id?: string; department_id?: string; reason: string }) {
  const res = await fetch(`${API_BASE_URL}/admission-requests`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      hospital_id: payload.hospital_id || 'hsp-001',
      department_id: payload.department_id || 'dept-cardio',
      reason: payload.reason,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to submit admission request');
  }
  return await res.json();
}

export async function fetchMyAdmissionRequestsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/admission-requests/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch my admission requests failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchMyAdmissionRequests error:', err);
    return null;
  }
}

export async function fetchAdmissionRequestsApi(hospitalId: string = 'hsp-001') {
  try {
    const res = await fetch(`${API_BASE_URL}/admission-requests?hospital_id=${hospitalId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch admission requests failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchAdmissionRequests error:', err);
    return null;
  }
}

export async function decideAdmissionRequestApi(requestId: string, payload: { action: 'APPROVE' | 'REJECT'; bed_id?: string; decision_notes?: string }) {
  const res = await fetch(`${API_BASE_URL}/admission-requests/${requestId}/decision`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Admission decision failed');
  }
  return await res.json();
}

export async function dischargePatientApi(requestId: string) {
  const res = await fetch(`${API_BASE_URL}/admission-requests/${requestId}/discharge`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return await res.json();
}

export async function submitDoctorReviewApi(doctorId: string, payload: { appointment_id: string; rating: number; comment?: string }) {
  const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/reviews`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to submit doctor review');
  }
  return await res.json();
}

export async function takePatientUnderConsultancyApi(patientId: string) {
  const res = await fetch(`${API_BASE_URL}/patients/${patientId}/take-consultancy`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to take patient under consultancy');
  }
  return await res.json();
}

export async function fetchHospitalsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/hospitals?t=${Date.now()}`, { 
      headers: getHeaders(),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Fetch hospitals failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchHospitals error:', err);
    return null;
  }
}

export async function fetchHospitalDetailsApi(hospitalId?: string) {
  try {
    const url = hospitalId ? `${API_BASE_URL}/hospitals/${hospitalId}` : `${API_BASE_URL}/hospitals/me`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch hospital details failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchHospitalDetails error:', err);
    return null;
  }
}

export async function registerHospitalApi(payload: {
  hospitalCode?: string;
  name: string;
  type?: string;
  phone: string;
  emergencyPhone: string;
  ambulancePhone?: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/hospitals/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Hospital registration failed');
  }
  return await res.json();
}

export async function fetchHospitalAmbulanceNumberApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/patients/me/ambulance-number`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch ambulance number failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchHospitalAmbulanceNumber error:', err);
    return null;
  }
}

export async function uploadPatientReportApi(file: File) {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE_URL}/patient-reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Report upload failed');
  }
  return await res.json();
}

export async function fetchPatientReportsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/patient-reports`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch reports failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchPatientReports error, falling back:', err);
    return [];
  }
}

export async function deletePatientReportApi(reportId: string) {
  const res = await fetch(`${API_BASE_URL}/patient-reports/${reportId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Delete report failed');
  }
  return await res.json();
}

export async function fetchPatientReportsForDoctorApi(patientId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/patient-reports/patient/${patientId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch reports for doctor failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchPatientReportsForDoctor error, falling back:', err);
    return [];
  }
}

export async function fetchEmergencyRequestsApi(hospitalId: string = 'hsp-001') {
  try {
    const res = await fetch(`${API_BASE_URL}/emergency/requests?hospital_id=${hospitalId}&t=${Date.now()}`, { 
      headers: getHeaders(),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Fetch emergency requests failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchEmergencyRequests error, falling back:', err);
    return [];
  }
}

export async function updateEmergencyStatusApi(
  emergencyId: string, 
  status: string, 
  allocatedBed?: string,
  redirectedHospital?: { id: string; name: string; address?: string }
) {
  const res = await fetch(`${API_BASE_URL}/emergency/requests/${emergencyId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ 
      status, 
      allocatedBed,
      redirectedHospitalId: redirectedHospital?.id,
      redirectedHospitalName: redirectedHospital?.name,
      redirectedHospitalAddress: redirectedHospital?.address
    })
  });
  if (!res.ok) throw new Error('Update emergency status failed');
  return await res.json();
}

export async function resolveActiveEmergencyApi(payload?: { emergency_id?: string; patient_id?: string; patient_name?: string }) {
  const res = await fetch(`${API_BASE_URL}/emergency/requests/resolve-active`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload || {})
  });
  if (!res.ok) throw new Error('Resolve active emergency failed');
  return await res.json();
}

export async function fetchActiveSosApi(patientId?: string, patientName?: string, emergencyId?: string) {
  try {
    const params = new URLSearchParams();
    if (patientId) params.append('patient_id', patientId);
    if (patientName) params.append('patient_name', patientName);
    if (emergencyId) params.append('emergency_id', emergencyId);
    params.append('t', Date.now().toString());
    const res = await fetch(`${API_BASE_URL}/emergency/active-sos?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
