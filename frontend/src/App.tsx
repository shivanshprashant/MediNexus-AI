import React, { useState } from 'react';
import {
  AppScreen,
  DoctorTab,
  PatientTab,
  Patient,
  Appointment,
  Specialist,
  NotificationItem,
  Hospital,
  ActiveSosState,
} from './types';
import {
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  SPECIALISTS,
  INITIAL_NOTIFICATIONS,
} from './data';

// Auth & Landing Components
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { PatientRegistrationWizard } from './components/patient/PatientRegistrationWizard';
import { DoctorRegistrationWizard } from './components/doctor/DoctorRegistrationWizard';
import {
  fetchAppointmentsApi,
  fetchPatientsApi,
  fetchDoctorsApi,
  triggerEmergencySosApi,
  fetchPatientProfileApi,
  fetchDoctorProfileApi,
  clearAuthToken,
  createAdmissionRequestApi,
  fetchMyAdmissionRequestsApi,
  fetchAdmissionRequestsApi,
  decideAdmissionRequestApi,
  dischargePatientApi,
  createAppointmentApi,
  updateAppointmentApi,
  takePatientUnderConsultancyApi,
  fetchEmergencyRequestsApi,
  updateEmergencyStatusApi,
  resolveActiveEmergencyApi,
  fetchActiveSosApi,
  fetchHospitalsApi,
  API_BASE_URL,
} from './services/api';

// Doctor & Patient Components
import { DoctorHeader } from './components/doctor/DoctorHeader';
import { DoctorNav } from './components/doctor/DoctorNav';
import { DoctorDashboardView } from './components/doctor/DoctorDashboardView';
import { PatientRostersView } from './components/doctor/PatientRostersView';
import { ConsultationScheduleView } from './components/doctor/ConsultationScheduleView';
import { TriageAlertsView } from './components/doctor/TriageAlertsView';
import { DoctorProfileView } from './components/doctor/DoctorProfileView';
import { DoctorModals } from './components/doctor/DoctorModals';
import { PatientHeader, PatientNav } from './components/patient/PatientNavHeader';
import { PatientDashboardView } from './components/patient/PatientDashboardView';
import { BookAppointmentView } from './components/patient/BookAppointmentView';
import { PatientProfileView } from './components/patient/PatientProfileView';
import { PatientModals } from './components/patient/PatientModals';

export default function App() {
  console.log('🔴 APP v3 LOADED — new code running');
  // Screen state: 'landing' | 'login' | 'patient_register' | 'doctor_register' | 'doctor' | 'patient'
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);

  const getInitialScreen = (): AppScreen => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('doctor') || search.includes('doctor')) return 'doctor';
      if (hash.includes('patient') || search.includes('patient')) return 'patient';
      
      const token = localStorage.getItem('medinexus_token');
      const role = localStorage.getItem('userRole');
      if (token) {
        if (role === 'doctor') return 'doctor';
        if (role === 'patient') return 'patient';
      }
    }
    return 'landing';
  };

  const [currentScreen, setCurrentScreen] = useState<AppScreen>(getInitialScreen);

  // Validate session token on mount
  React.useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('medinexus_token');
    const role = localStorage.getItem('userRole');

    if (token && role) {
      if (role === 'patient') {
        fetchPatientProfileApi()
          .then((prof) => {
            if (!isMounted) return;
            if (prof) {
              setCurrentPatientProfile(prof);
              setCurrentScreen('patient');
              window.location.hash = 'patient';
            } else {
              localStorage.removeItem('medinexus_token');
              localStorage.removeItem('userRole');
              setCurrentScreen('landing');
            }
          })
          .catch(() => {
            if (!isMounted) return;
            localStorage.removeItem('medinexus_token');
            localStorage.removeItem('userRole');
            setCurrentScreen('landing');
          })
          .finally(() => {
            if (isMounted) setIsAuthInitializing(false);
          });
      } else if (role === 'doctor') {
        fetchDoctorProfileApi()
          .then((prof) => {
            if (!isMounted) return;
            if (prof) {
              setCurrentDoctorProfile(prof);
              setCurrentScreen('doctor');
              window.location.hash = 'doctor';
            } else {
              localStorage.removeItem('medinexus_token');
              localStorage.removeItem('userRole');
              setCurrentScreen('landing');
            }
          })
          .catch(() => {
            if (!isMounted) return;
            localStorage.removeItem('medinexus_token');
            localStorage.removeItem('userRole');
            setCurrentScreen('landing');
          })
          .finally(() => {
            if (isMounted) setIsAuthInitializing(false);
          });
      } else {
        setIsAuthInitializing(false);
      }
    } else {
      setIsAuthInitializing(false);
    }
  }, []);

  React.useEffect(() => {
    const handleHashChange = () => {
      const token = localStorage.getItem('medinexus_token');
      const role = localStorage.getItem('userRole');
      const hash = window.location.hash.toLowerCase();

      if (hash.includes('doctor')) setCurrentScreen('doctor');
      else if (hash.includes('patient')) setCurrentScreen('patient');
      else if (hash.includes('login')) setCurrentScreen('login');
      else if (hash === '' || hash === '#landing') {
        // If user has a valid authenticated session, don't kick them out to landing on blank hash
        if (token && role === 'patient') {
          setCurrentScreen('patient');
          window.location.hash = 'patient';
        } else if (token && role === 'doctor') {
          setCurrentScreen('doctor');
          window.location.hash = 'doctor';
        } else {
          setCurrentScreen('landing');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sub-navigation state
  const [doctorTab, setDoctorTab] = useState<DoctorTab>('home');
  const [patientTab, setPatientTab] = useState<PatientTab>('home');
  const [patientBookDeptFilter, setPatientBookDeptFilter] = useState<string>('All');

  // Data states (Doctor & Patient)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [specialists, setSpecialists] = useState<Specialist[]>(SPECIALISTS);
    React.useEffect(() => {
    fetchDoctorsApi().then(docs => {
      if (docs && docs.length > 0) {
        setSpecialists(docs);
      }
    });
  }, []);

const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [urgentAcknowledged, setUrgentAcknowledged] = useState(false);
  const [currentPatientProfile, setCurrentPatientProfile] = useState<any>(null);
  const [currentDoctorProfile, setCurrentDoctorProfile] = useState<any>(null);
  const [admissionRequests, setAdmissionRequests] = useState<any[]>([]);
  const [myAdmissionRequests, setMyAdmissionRequests] = useState<any[]>([]);
  const [showRequestAdmissionModal, setShowRequestAdmissionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Emergency SOS State for Patient
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const [activeSos, setActiveSos] = useState<ActiveSosState | null>(null);

  // --- PWA Installation Logic ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };
  // -----------------------------

  // DEDICATED hospital bed count live stream (SSE)
  // Replaces previous 2-second polling with real-time push updates
  React.useEffect(() => {
    if (currentScreen !== 'patient') return;
    
    // Initial fetch to populate right away
    fetchHospitalsApi().then((freshHospitals) => {
      if (freshHospitals && Array.isArray(freshHospitals) && freshHospitals.length > 0) {
        setHospitals(prev => {
          const prevMap: Record<string, any> = {};
          prev.forEach(ph => { prevMap[ph.id] = ph; });
          return freshHospitals.map((fh: any) => ({ ...prevMap[fh.id], ...fh }));
        });
      }
    }).catch(e => console.warn('[BED FETCH] Error fetching initial hospitals:', e));

    // Connect to SSE for real-time updates
    const eventSource = new EventSource(`${API_BASE_URL}/hospitals/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'BED_AVAILABILITY_UPDATED') {
          const payload = data.data;
          console.log('[BED SSE] Real-time bed update received:', payload.hospital_id, payload.vacantBeds);
          setHospitals(prev => prev.map(h => {
            if (h.id === payload.hospital_id) {
              return {
                ...h,
                vacantBeds: payload.vacantBeds,
                totalBeds: payload.totalBeds
              };
            }
            return h;
          }));
        }
      } catch (err) {
        console.error('[BED SSE] Parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[BED SSE] Connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [currentScreen]);

  // Poll for emergency requests for both doctor and patient portal
  React.useEffect(() => {
    let interval: any;
    const pollSOS = async () => {
      try {
        if (currentScreen === 'doctor') {
          const requests = await fetchEmergencyRequestsApi();
          if (requests && requests.length > 0) {
            const active = requests.find((r: any) => 
              r.status !== 'RESOLVED' && r.status !== 'DISCHARGED'
            );
            if (active) {
              const ageGenderParts = active.ageGender ? active.ageGender.split('/') : ['29', 'Female'];
              const age = ageGenderParts[0].trim();
              const gender = ageGenderParts[1] ? ageGenderParts[1].trim() : 'Female';
              const newStatus = active.status === 'ACCEPTED' ? 'accepted' : active.status === 'REDIRECTED' ? 'redirected' : 'en-route';
              
              setActiveSos(prev => {
                if (!prev || prev.id !== active.id || prev.status !== newStatus || prev.redirectedHospitalName !== active.redirectedHospitalName) {
                  return {
                    id: active.id,
                    active: true,
                    mode: active.complaint?.toLowerCase().includes('ambulance') ? 'ambulance' : 'drive-in',
                    patientName: active.patientName,
                    age,
                    gender,
                    complaint: active.complaint,
                    hospitalId: active.hospital_id || 'hsp-001',
                    hospitalName: 'CityCare Hospital (HSP-001)',
                    bedNo: active.allocatedBed || (newStatus === 'redirected' ? 'ER Bed #08' : 'ER Bed #04'),
                    status: newStatus,
                    redirectedHospitalId: active.redirectedHospitalId,
                    redirectedHospitalName: active.redirectedHospitalName,
                    redirectedHospitalAddress: active.redirectedHospitalAddress,
                  };
                }
                return prev;
              });
            } else {
              setActiveSos(null);
              setShowEmergencyModal(false);
            }
          } else {
            setActiveSos(null);
            setShowEmergencyModal(false);
          }
        } else if (currentScreen === 'patient') {
          // Poll active SOS status for patient so doctor actions (like redirect or accept) immediately reflect!
          const active = await fetchActiveSosApi(
            currentPatientProfile?.id,
            currentPatientProfile?.name,
            activeSos?.id
          );
          
          if (active && active.status !== 'RESOLVED' && active.status !== 'DISCHARGED' && active.status !== 'REJECTED') {
            const newStatus = active.status === 'ACCEPTED' ? 'accepted' : active.status === 'REDIRECTED' ? 'redirected' : 'en-route';
            setActiveSos(prev => {
              if (!prev || prev.status !== newStatus || prev.redirectedHospitalName !== active.redirectedHospitalName || prev.bedNo !== active.allocatedBed) {
                if (newStatus === 'redirected' && prev?.status !== 'redirected') {
                  showToast(`⚠️ REROUTED: Destination updated to ${active.redirectedHospitalName || 'Partner Hospital'}!`);
                  setShowSOS(true);
                }
                return {
                  id: active.id,
                  active: true,
                  mode: (prev?.mode || (active.complaint?.toLowerCase().includes('ambulance') ? 'ambulance' : 'drive-in')),
                  patientName: active.patientName,
                  age: prev?.age || '29',
                  gender: prev?.gender || 'Female',
                  complaint: active.complaint,
                  hospitalId: active.hospital_id || prev?.hospitalId || 'hsp-001',
                  hospitalName: prev?.hospitalName || 'CityCare Hospital (HSP-001)',
                  bedNo: active.allocatedBed || (newStatus === 'redirected' ? 'ER Bed #08' : 'ER Bed #04'),
                  status: newStatus,
                  redirectedHospitalId: active.redirectedHospitalId,
                  redirectedHospitalName: active.redirectedHospitalName,
                  redirectedHospitalAddress: active.redirectedHospitalAddress,
                };
              }
              return prev;
            });
          } else if (active && (active.status === 'RESOLVED' || active.status === 'DISCHARGED' || active.status === 'REJECTED')) {
            setActiveSos(null);
            setShowSOS(false);
          }
        }
      } catch (e) {}
    };
    pollSOS();
    interval = setInterval(pollSOS, 2500);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentScreen, currentPatientProfile?.id, activeSos?.id, activeSos?.status]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Sync data with FastAPI Backend on screen load
  React.useEffect(() => {
    if (currentScreen === 'patient' || currentScreen === 'doctor') {
      fetchAppointmentsApi().then((apts) => {
        if (apts && apts.length > 0) setAppointments(apts);
      });
      fetchPatientsApi().then((pts) => {
        if (pts && pts.length > 0) setPatients(pts);
      });
      if (currentScreen === 'patient') {
        fetchPatientProfileApi().then((prof) => {
          if (prof) setCurrentPatientProfile(prof);
        });
        fetchMyAdmissionRequestsApi().then((reqs) => {
          if (reqs) setMyAdmissionRequests(reqs);
        });
        // Immediately load live hospital bed counts on patient screen entry
        fetchHospitalsApi().then((freshHospitals) => {
          if (freshHospitals && Array.isArray(freshHospitals) && freshHospitals.length > 0) {
            setHospitals(prev => {
              const prevMap: Record<string, any> = {};
              prev.forEach(ph => { prevMap[ph.id] = ph; });
              return freshHospitals.map((fh: any) => ({ ...prevMap[fh.id], ...fh }));
            });
          }
        });
      }
      if (currentScreen === 'doctor') {
        fetchDoctorProfileApi().then((prof) => {
          if (prof) setCurrentDoctorProfile(prof);
        });
        fetchAdmissionRequestsApi().then((reqs) => {
          if (reqs) setAdmissionRequests(reqs);
        });
      }
    }
  }, [currentScreen]);

  // Handlers for Emergency SOS
  const handleTriggerPatientSOS = (mode: 'drive-in' | 'ambulance', targetHospitalId?: string) => {
    const activePatientName = currentPatientProfile?.name || 'Patient';
    const activeAge = currentPatientProfile?.age ? String(currentPatientProfile.age) : '29';
    const activeGender = currentPatientProfile?.gender || 'Female';
    const activeComplaint = currentPatientProfile?.reason || 'Severe emergency symptoms on arrival.';
    const activeMedInfo = `Allergies: ${currentPatientProfile?.allergies || 'None'} | Meds: ${currentPatientProfile?.meds || 'None'} | Blood: ${currentPatientProfile?.blood || 'O+'}`;

    const chosenHosp = hospitals.find((h) => h.id === targetHospitalId) || hospitals[0];

    setHospitals((prev) =>
      prev.map((h) => (h.id === chosenHosp.id ? { ...h, vacantBeds: Math.max(0, h.vacantBeds - 1) } : h))
    );

    // Get patient location string (or fallback if profile has address or default Delhi/NCR location)
    let patientLoc = 'B-42, Sector 62, Noida, Uttar Pradesh 201309';
    if (currentPatientProfile?.history && currentPatientProfile.history.includes('Address:')) {
      const match = currentPatientProfile.history.match(/Address:\s*([^.]+)/);
      if (match && match[1]) patientLoc = match[1].trim();
    }

    const defaultLat = 28.6280;
    const defaultLng = 77.3649;
    const defaultMapsLink = `https://www.google.com/maps/dir/?api=1&destination=${defaultLat},${defaultLng}`;

    const sosObj: ActiveSosState = {
      active: true,
      mode,
      patientName: activePatientName,
      age: activeAge,
      gender: activeGender,
      complaint: activeComplaint,
      hospitalId: chosenHosp.id,
      hospitalName: chosenHosp.name,
      bedNo: 'ER Bed #04',
      status: 'en-route',
      redirectedHospitalAddress: chosenHosp.address,
      patientLocation: patientLoc,
      mapsLink: defaultMapsLink,
    };
    setActiveSos(sosObj);

    const triggerSOSWithCoords = (lat?: number, lng?: number) => {
      const locStr = (lat && lng) ? `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} (${patientLoc})` : patientLoc;
      triggerEmergencySosApi({
        mode,
        target_hospital_id: chosenHosp.id || 'hsp-001',
        complaint: activeComplaint,
        patient_id: currentPatientProfile?.id,
        patient_name: activePatientName !== 'Patient' ? activePatientName : undefined,
        age_gender: `${activeAge} / ${activeGender}`,
        medical_info: activeMedInfo,
        patient_location: locStr,
        patient_latitude: lat || defaultLat,
        patient_longitude: lng || defaultLng,
      }).then((created) => {
        if (created && created.id) {
          setActiveSos((prev) => (prev ? {
            ...prev,
            id: created.id,
            ambulanceNumber: created.ambulanceNumber || 'DL-01-AMB-402',
            driverName: created.driverName || 'Rajesh Kumar',
            driverPhone: created.driverPhone || '+91 83039 36384',
            ambulanceType: created.ambulanceType || 'ALS (Advanced Life Support)',
            patientLocation: created.patientLocation || locStr,
            mapsLink: created.mapsLink || defaultMapsLink,
          } : prev));
        }
      }).catch((err) => {
        console.warn('Emergency SOS API fallback:', err);
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => triggerSOSWithCoords(pos.coords.latitude, pos.coords.longitude),
        () => triggerSOSWithCoords(defaultLat, defaultLng),
        { timeout: 3000 }
      );
    } else {
      triggerSOSWithCoords(defaultLat, defaultLng);
    }

    const newDoctorNotif: NotificationItem = {
      id: `notif-sos-${Date.now()}`,
      title: `CRITICAL SOS: Severe Patient Arriving (${mode === 'drive-in' ? 'Drive-In' : 'Ambulance'})`,
      desc: `${activePatientName} arriving. ER Bed #04 Reserved at ${chosenHosp.name}.`,
      time: 'Just now',
      type: 'URGENT',
      unread: true,
    };
    setNotifications((prev) => [newDoctorNotif, ...prev]);

    showToast(
      mode === 'drive-in'
        ? `Emergency Drive-In Route Active • ${chosenHosp.name} ER Bed #04 Reserved`
        : `Emergency Ambulance Dispatched • ${chosenHosp.name} ER Bed #04 Reserved`
    );
  };

  const handleAcceptEmergencyIntake = () => {
    if (activeSos) {
      if (activeSos.id) {
        updateEmergencyStatusApi(activeSos.id, 'ACCEPTED', 'ER Bed #04');
      }
      setActiveSos((prev) => (prev ? { ...prev, status: 'accepted' } : null));
      showToast('Intake Confirmed! Trauma Bay 1 & ER Bed #04 Prepared for Patient.');
    }
    setShowEmergencyModal(false);
  };

  const handleRedirectPatientEmergency = (targetHospitalId: string) => {
    const targetHosp = hospitals.find((h) => h.id === targetHospitalId) || hospitals[1];

    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id === 'hsp-001') return { ...h, vacantBeds: h.vacantBeds + 1 };
        if (h.id === targetHosp.id) return { ...h, vacantBeds: Math.max(0, h.vacantBeds - 1) };
        return h;
      })
    );

    if (activeSos?.id) {
      updateEmergencyStatusApi(activeSos.id, 'REDIRECTED', 'ER Bed #08', {
        id: targetHosp.id,
        name: targetHosp.name,
        address: targetHosp.address,
      });
    }

    setActiveSos((prev) =>
      prev
        ? {
            ...prev,
            status: 'redirected',
            redirectedHospitalId: targetHosp.id,
            redirectedHospitalName: targetHosp.name,
            redirectedHospitalAddress: targetHosp.address,
            bedNo: 'ER Bed #08',
          }
        : null
    );

    showToast(`Patient rerouted to ${targetHosp.name}. ER Bed #08 Allotted!`);
    setShowEmergencyModal(false);
  };

  const handleResetSOS = async () => {
    const currentSosId = activeSos?.id;
    try {
      if (currentSosId) {
        await updateEmergencyStatusApi(currentSosId, 'RESOLVED');
      } else {
        await resolveActiveEmergencyApi({
          patient_id: currentPatientProfile?.id,
          patient_name: currentPatientProfile?.name,
        });
      }
    } catch (err) {
      console.warn('Failed to resolve SOS on server:', err);
    }
    setActiveSos(null);
    setShowSOS(false);
    setShowEmergencyModal(false);
    showToast('Emergency SOS session ended & resolved');
  };

  const handleResolveEmergency = async () => {
    const currentSosId = activeSos?.id;
    try {
      if (currentSosId) {
        await updateEmergencyStatusApi(currentSosId, 'RESOLVED');
      } else {
        await resolveActiveEmergencyApi();
      }
    } catch (err) {
      console.warn('Resolve emergency error:', err);
    }
    setActiveSos(null);
    setShowEmergencyModal(false);
    showToast('Emergency intake marked as completed & resolved');
  };

  // Doctor Modals state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [aiSummaryPatient, setAiSummaryPatient] = useState<Patient | null>(null);
  const [activeConsultationApt, setActiveConsultationApt] = useState<Appointment | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showEHRModal, setShowEHRModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);

  // Patient Modals state
  const [showSOS, setShowSOS] = useState(false);
  const [showAITriage, setShowAITriage] = useState(false);
  const [showNearbyClinics, setShowNearbyClinics] = useState(false);
  const [showPatientNotifications, setShowPatientNotifications] = useState(false);

  // Handlers for Login & Role Switch
  const handleLoginSuccess = (role: 'doctor' | 'patient', userName: string) => {
    setCurrentScreen(role);
    localStorage.setItem('userRole', role);
    window.location.hash = role;
    if (role === 'patient') {
      fetchPatientProfileApi().then((prof) => {
        if (prof) setCurrentPatientProfile(prof);
      });
      fetchAppointmentsApi().then((apts) => {
        if (Array.isArray(apts)) setAppointments(apts);
      });
    } else if (role === 'doctor') {
      fetchDoctorProfileApi().then((prof) => {
        if (prof) setCurrentDoctorProfile(prof);
      });
      fetchAppointmentsApi().then((apts) => {
        if (Array.isArray(apts)) setAppointments(apts);
      });
    }
    showToast(`Authenticated as ${userName}`);
  };

  const handleSignOut = () => {
    clearAuthToken();
    localStorage.removeItem('userRole');
    window.location.hash = '';
    setCurrentScreen('landing');
    setCurrentPatientProfile(null);
    setCurrentDoctorProfile(null);
    setDoctorTab('home');
    setPatientTab('home');
    showToast('Signed out to Landing Page');
  };

  const handleSaveConsultation = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: 'COMPLETED' } : a))
    );
    setActiveConsultationApt(null);
    showToast('Encounter signed & clinical notes archived');
  };

  const handleSubmitAdmissionRequest = async (departmentId: string, reason: string) => {
    try {
      await createAdmissionRequestApi({ hospital_id: 'hsp-001', department_id: departmentId, reason });
      const freshMyReqs = await fetchMyAdmissionRequestsApi();
      if (freshMyReqs) setMyAdmissionRequests(freshMyReqs);
      setShowRequestAdmissionModal(false);
      showToast('Bed admission request submitted to hospital');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit admission request');
    }
  };

  const handleDecideAdmission = async (requestId: string, action: 'APPROVE' | 'REJECT', bedId?: string) => {
    try {
      const res = await decideAdmissionRequestApi(requestId, { action, bed_id: bedId });
      const freshReqs = await fetchAdmissionRequestsApi();
      if (freshReqs) setAdmissionRequests(freshReqs);
      if (action === 'APPROVE') {
        showToast(`Admission Approved • Bed Allotted: ${res.allocated_bed_info || 'Assigned'}`);
      } else {
        showToast('Admission Request Rejected');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to process admission decision');
    }
  };

  const handleDischargeAdmission = async (requestId: string) => {
    try {
      const res = await dischargePatientApi(requestId);
      const freshReqs = await fetchAdmissionRequestsApi();
      if (freshReqs) setAdmissionRequests(freshReqs);
      const freshMyReqs = await fetchMyAdmissionRequestsApi();
      if (freshMyReqs) setMyAdmissionRequests(freshMyReqs);
      showToast(res.message || 'Patient discharged & bed released successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to discharge patient');
    }
  };

  const handleConfirmReschedule = async (aptId: string, date: string, time: string) => {
    try {
      await updateAppointmentApi(aptId, { date, time, status: 'UPCOMING' });
      const freshApts = await fetchAppointmentsApi();
      if (Array.isArray(freshApts)) {
        setAppointments(freshApts);
      }
      setRescheduleApt(null);
      showToast(`Appointment rescheduled to ${date}, ${time}`);
    } catch (err: any) {
      console.error('Reschedule error:', err);
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, date, time, dateLabel: date, status: 'UPCOMING' } : a))
      );
      setRescheduleApt(null);
      showToast(`Appointment rescheduled to ${date}, ${time}`);
    }
  };

  const handleConfirmCancel = async (aptId: string) => {
    try {
      await updateAppointmentApi(aptId, { status: 'CANCELLED' });
      const freshApts = await fetchAppointmentsApi();
      if (Array.isArray(freshApts)) {
        setAppointments(freshApts);
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? { ...a, status: 'CANCELLED' } : a))
        );
      }
      setCancelApt(null);
      showToast('Appointment cancelled in schedule');
    } catch (err: any) {
      console.error('Cancel error:', err);
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: 'CANCELLED' } : a))
      );
      setCancelApt(null);
      showToast('Appointment cancelled in schedule');
    }
  };

  const handleConfirmScheduleAppointment = async (data: {
    patientId: string;
    date: string;
    time: string;
    modality: string;
    reason: string;
    clinicalNotes?: string;
  }) => {
    const doctorId = currentDoctorProfile?.id || 'doc-001';
    await createAppointmentApi({
      doctor_id: doctorId,
      patient_id: data.patientId,
      date: data.date,
      time: data.time,
      modality: data.modality,
      reason: data.reason,
      clinical_notes: data.clinicalNotes,
    });

    showToast('Appointment successfully scheduled!');

    const freshApts = await fetchAppointmentsApi();
    if (Array.isArray(freshApts)) {
      setAppointments(freshApts);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read');
  };

  const handleConfirmPatientBooking = async (
    specialist: Specialist,
    date: string,
    time: string,
    modality: string,
    reason: string
  ) => {
    try {
      await createAppointmentApi({
        doctor_id: specialist.id || 'doc-001',
        date,
        time,
        modality,
        reason,
      });
      const freshApts = await fetchAppointmentsApi();
      if (Array.isArray(freshApts)) {
        setAppointments(freshApts);
      }
      showToast(`Appointment booked with ${specialist.name}!`);
    } catch (err: any) {
      console.error('Patient booking error:', err);
      showToast('Appointment booked in schedule');
    }
    setPatientTab('book');
  };

  const handleStartConsultation = async (p: Patient) => {
    try {
      await takePatientUnderConsultancyApi(p.id);
      showToast(`Patient ${p.name} taken under active consultancy.`);
      const freshPts = await fetchPatientsApi();
      if (Array.isArray(freshPts)) setPatients(freshPts);
      const freshApts = await fetchAppointmentsApi();
      if (Array.isArray(freshApts)) setAppointments(freshApts);
    } catch (err: any) {
      console.warn('Take consultancy API note:', err.message);
      showToast(err.message || `Started consultation with ${p.name}`);
    }

    const apt: Appointment = appointments.find((a) => a.name.includes(p.name)) || {
      id: `apt-${p.id}`,
      name: p.name,
      initials: p.name.substring(0, 2).toUpperCase(),
      ageGender: `${p.age}y • ${p.gender}`,
      mrn: p.mrn,
      date: 'Today',
      time: 'Now',
      department: p.dept,
      reason: p.reason,
      status: 'TODAY',
      modality: 'Room 304 Consult',
    };
    setActiveConsultationApt(apt);
  };

  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-[#006C4C]/5 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#006C4C] border-t-transparent animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-[#006C4C]">Restoring MediNexus Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* 1. Landing Page */}
      {currentScreen === 'landing' && (
        <LandingPage onNavigateScreen={(screen) => setCurrentScreen(screen)} />
      )}

      {/* 2. Login Page */}
      {currentScreen === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateScreen={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 3. Patient Registration Wizard */}
      {currentScreen === 'patient_register' && (
        <PatientRegistrationWizard
          onCompletePatientRegistration={(userName) => {
            setCurrentScreen('patient');
            fetchPatientProfileApi().then((prof) => {
              if (prof) setCurrentPatientProfile(prof);
            });
            showToast(`Welcome ${userName}! Health account created.`);
          }}
          onNavigateScreen={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 4. Doctor Registration Wizard */}
      {currentScreen === 'doctor_register' && (
        <DoctorRegistrationWizard
          onCompleteDoctorRegistration={(doctorName) => {
            setCurrentScreen('doctor');
            fetchDoctorProfileApi().then((prof) => {
              if (prof) setCurrentDoctorProfile(prof);
            });
            showToast(`Welcome ${doctorName}! Doctor profile registered.`);
          }}
          onNavigateScreen={(screen) => setCurrentScreen(screen)}
        />
      )}

      {/* 5. Doctor Portal */}
      {currentScreen === 'doctor' && (
        <div className="flex flex-col min-h-screen pt-16">
          <DoctorHeader
            onOpenNotifications={() => setDoctorTab('alerts')}
            onOpenProfile={() => setDoctorTab('profile')}
            unreadNotificationsCount={notifications.filter((n) => n.unread).length}
            doctorProfile={currentDoctorProfile}
          />

          <main className="flex-1 w-full animate-in fade-in duration-200">
            {doctorTab === 'home' && (
              <DoctorDashboardView
                onNavigateTab={(tab) => setDoctorTab(tab)}
                onOpenPatientModal={(p) => setSelectedPatient(p)}
                onOpenAISummary={(p) => setAiSummaryPatient(p)}
                onOpenEmergencyModal={() => setShowEmergencyModal(true)}
                onStartConsultation={handleStartConsultation}
                onShowToast={showToast}
                urgentAcknowledged={urgentAcknowledged}
                doctorProfile={currentDoctorProfile}
                admissionRequests={admissionRequests}
                appointments={appointments}
                patients={patients}
                onDecideAdmission={handleDecideAdmission}
                onDischargeAdmission={handleDischargeAdmission}
                activeSos={activeSos}
              />
            )}

            {doctorTab === 'patients' && (
              <PatientRostersView
                patients={patients}
                onOpenPatientModal={(p) => setSelectedPatient(p)}
                onShowToast={showToast}
              />
            )}

            {doctorTab === 'schedule' && (
              <ConsultationScheduleView
                appointments={appointments}
                onStartConsult={(apt) => setActiveConsultationApt(apt)}
                onOpenDetails={(apt) => {
                  const foundPatient = patients.find((p) => p.name === apt.name) || {
                    id: apt.id,
                    name: apt.name,
                    mrn: apt.mrn,
                    dept: apt.department || 'Cardiology',
                    age: parseInt(apt.ageGender) || 45,
                    gender: apt.ageGender.includes('Female') ? 'Female' : 'Male',
                    blood: 'O+',
                    priority: 'NORMAL',
                    status: apt.status === 'COMPLETED' ? 'COMPLETED' : 'WAITING',
                    lastVisit: 'Oct 10, 2026',
                    nextAppointment: `${apt.date}, ${apt.time}`,
                    allergies: 'None recorded',
                    meds: 'Standard clinical dosage',
                    history: 'Under regular follow-up.',
                    reason: apt.reason,
                    recommendation: 'Monitor vitals and review in 12 weeks.',
                  };
                  setSelectedPatient(foundPatient);
                }}
                onReschedule={(apt) => setRescheduleApt(apt)}
                onCancel={(apt) => setCancelApt(apt)}
                onOpenScheduleModal={() => setShowScheduleModal(true)}
              />
            )}

            {doctorTab === 'alerts' && (
              <TriageAlertsView
                notifications={notifications}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onSelectNotification={(n) => {
                  setSelectedNotification(n);
                  setNotifications((prev) =>
                    prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                  );
                }}
                urgentAcknowledged={urgentAcknowledged}
                onAcknowledgeEmergency={() => {
                  setUrgentAcknowledged(true);
                  setActiveSos((prev) => (prev ? { ...prev, status: 'accepted' } : null));
                  showToast('Emergency Case Acknowledged • Rapid Protocol Active');
                }}
                onOpenEmergencyIntake={() => setShowEmergencyModal(true)}
                onOpenEHR={() => setShowEHRModal(true)}
                activeSos={activeSos}
              />
            )}

            {doctorTab === 'profile' && (
              <DoctorProfileView
                onSignOut={handleSignOut}
                onShowToast={showToast}
                doctorProfile={currentDoctorProfile}
                onProfileUpdated={(updated) => setCurrentDoctorProfile(updated)}
              />
            )}
          </main>

          <DoctorNav
            activeTab={doctorTab}
            onTabChange={(tab) => setDoctorTab(tab)}
            hasAlerts={notifications.some((n) => n.unread)}
          />

          <DoctorModals
            selectedPatient={selectedPatient}
            onClosePatient={() => setSelectedPatient(null)}
            aiSummaryPatient={aiSummaryPatient}
            onCloseAISummary={() => setAiSummaryPatient(null)}
            activeConsultationApt={activeConsultationApt}
            onCloseConsultation={() => setActiveConsultationApt(null)}
            onSaveConsultation={handleSaveConsultation}
            showEmergencyModal={showEmergencyModal}
            onCloseEmergency={() => setShowEmergencyModal(false)}
            onAcceptEmergency={handleAcceptEmergencyIntake}
            activeSos={activeSos}
            hospitals={hospitals}
            onAcceptEmergencyIntake={handleAcceptEmergencyIntake}
            onRedirectEmergencyPatient={handleRedirectPatientEmergency}
            onResolveEmergency={handleResolveEmergency}
            showEHRModal={showEHRModal}
            onCloseEHR={() => setShowEHRModal(false)}
            selectedNotification={selectedNotification}
            onCloseNotification={() => setSelectedNotification(null)}
            rescheduleApt={rescheduleApt}
            onCloseReschedule={() => setRescheduleApt(null)}
            onConfirmReschedule={handleConfirmReschedule}
            cancelApt={cancelApt}
            onCloseCancel={() => setCancelApt(null)}
            onConfirmCancel={handleConfirmCancel}
            showScheduleModal={showScheduleModal}
            onCloseScheduleModal={() => setShowScheduleModal(false)}
            patients={patients}
            onConfirmScheduleAppointment={handleConfirmScheduleAppointment}
            onOpenAISummaryFromPatient={(p) => {
              setSelectedPatient(null);
              setAiSummaryPatient(p);
            }}
            onStartConsultFromPatient={(p) => {
              setSelectedPatient(null);
              handleStartConsultation(p);
            }}
          />
        </div>
      )}

      {/* 6. Patient Portal */}
      {currentScreen === 'patient' && (
        <div className="flex flex-col min-h-screen pt-16">
          <PatientHeader
            onOpenNotifications={() => setShowPatientNotifications(true)}
            onOpenProfile={() => setPatientTab('profile')}
            unreadCount={notifications.filter((n) => n.unread).length}
            patientProfile={currentPatientProfile}
            showInstallPrompt={showInstallPrompt}
            onInstallClick={handleInstallApp}
          />

          <main className="flex-1 w-full animate-in fade-in duration-200">
            {patientTab === 'home' && (
              <PatientDashboardView
                onNavigateTab={(tab) => setPatientTab(tab)}
                onOpenSOS={() => setShowSOS(true)}
                onOpenAITriage={() => setShowAITriage(true)}
                onOpenNearbyClinics={() => setShowNearbyClinics(true)}
                onShowToast={showToast}
                patientProfile={currentPatientProfile}
                myAdmissionRequests={myAdmissionRequests}
                onOpenRequestAdmissionModal={() => setShowRequestAdmissionModal(true)}
                appointments={appointments}
                onCancelAppointment={(aptId) => handleConfirmCancel(aptId)}
                activeSos={activeSos}
              />
            )}

            {patientTab === 'book' && (
              <BookAppointmentView
                specialists={specialists}
                appointments={appointments}
                initialDeptFilter={patientBookDeptFilter}
                onConfirmBooking={handleConfirmPatientBooking}
                onCancelAppointment={handleConfirmCancel}
                onShowToast={showToast}
              />
            )}

            {patientTab === 'profile' && (
              <PatientProfileView
                onSignOut={handleSignOut}
                onShowToast={showToast}
                patientProfile={currentPatientProfile}
                onProfileUpdated={(updated) => setCurrentPatientProfile(updated)}
              />
            )}
          </main>

          <PatientNav activeTab={patientTab} onTabChange={(tab) => setPatientTab(tab)} />

          <PatientModals
            showSOS={showSOS}
            onCloseSOS={() => setShowSOS(false)}
            onOpenSOS={() => setShowSOS(true)}
            onNavigateToBook={(dept) => {
              setPatientBookDeptFilter(dept);
              setPatientTab('book');
              setShowAITriage(false);
            }}
            showAITriage={showAITriage}
            onCloseAITriage={() => setShowAITriage(false)}
            showNearbyClinics={showNearbyClinics}
            onCloseNearbyClinics={() => setShowNearbyClinics(false)}
            showNotifications={showPatientNotifications}
            onCloseNotifications={() => setShowPatientNotifications(false)}
            onShowToast={showToast}
            hospitals={hospitals}
            activeSos={activeSos}
            onTriggerSOS={handleTriggerPatientSOS}
            onResetSOS={handleResetSOS}
            patientProfile={currentPatientProfile}
            showRequestAdmissionModal={showRequestAdmissionModal}
            onCloseRequestAdmissionModal={() => setShowRequestAdmissionModal(false)}
            onSubmitAdmissionRequest={handleSubmitAdmissionRequest}
          />
        </div>
      )}

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
