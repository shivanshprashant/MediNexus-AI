const API_BASE_URL = 'http://localhost:8000/api';

export function getAdminAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('medinexus_admin_token');
  }
  return null;
}

export function setAdminAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('medinexus_admin_token', token);
  }
}

function getAdminHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getAdminAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginHospitalAdminApi(payload: { hospital_code: string; email: string; password?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login/hospital-admin`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({
        hospital_code: payload.hospital_code,
        email: payload.email,
        password: payload.password || 'adminpassword',
      }),
    });
    if (!res.ok) throw new Error('Hospital admin login failed');
    const data = await res.json();
    if (data.access_token) setAdminAuthToken(data.access_token);
    return data;
  } catch (err) {
    console.warn('API admin login error, using demo token:', err);
    return {
      access_token: 'demo-admin-token',
      role: 'hospital_admin',
      user_id: 'usr-admin-01',
      full_name: 'Admin Rajesh Sharma',
      email: payload.email,
      hospital_id: 'hsp-001',
    };
  }
}

export async function fetchHospitalDetailsApi(hospitalId: string = 'hsp-001') {
  try {
    const res = await fetch(`${API_BASE_URL}/hospitals/me`, { headers: getAdminHeaders() });
    if (!res.ok) throw new Error('Fetch hospital details failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchHospitalDetails error:', err);
    return null;
  }
}

export async function fetchEmergencyRequestsApi(hospitalId: string = 'hsp-001') {
  try {
    const res = await fetch(`${API_BASE_URL}/emergency/requests?hospital_id=${hospitalId}`, { headers: getAdminHeaders() });
    if (!res.ok) throw new Error('Fetch emergency requests failed');
    return await res.json();
  } catch (err) {
    console.warn('API fetchEmergencyRequests error:', err);
    return null;
  }
}

export async function updateEmergencyStatusApi(emergencyId: string, status: string, allocatedBed?: string) {
  const res = await fetch(`${API_BASE_URL}/emergency/requests/${emergencyId}`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    body: JSON.stringify({
      status,
      allocatedBed: allocatedBed || null,
    }),
  });
  if (!res.ok) throw new Error('Update emergency status failed');
  return await res.json();
}

export async function updateBedOccupancyApi(deptId: string, bedId: string, occupied: number) {
  const res = await fetch(`${API_BASE_URL}/hospitals/me/departments/${deptId}/beds/${bedId}`, {
    method: 'PUT',
    headers: getAdminHeaders(),
    body: JSON.stringify({ occupied }),
  });
  if (!res.ok) throw new Error('Update bed occupancy failed');
  return await res.json();
}

export function subscribeEmergencyStreamApi(hospitalId: string = 'hsp-001', onEvent: (data: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  try {
    const eventSource = new EventSource(`${API_BASE_URL}/emergency/stream?hospital_id=${hospitalId}`);
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onEvent(parsed);
      } catch (err) {
        console.log('SSE message parsing:', event.data);
      }
    };
    eventSource.onerror = (err) => {
      console.warn('SSE stream reconnecting...');
    };
    return () => eventSource.close();
  } catch (err) {
    console.warn('SSE EventSource error:', err);
    return () => {};
  }
}
