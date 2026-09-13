import React, { useState } from 'react';
import {
  HospitalAdminTab,
  DetailedHospital,
  DepartmentItem,
  DepartmentBedType,
  DepartmentDoctor,
  HospitalEmergencyRequest,
  HospitalActivityLog,
  NotificationItem,
  EmergencyRequestStatus,
} from './types';
import {
  INITIAL_DETAILED_HOSPITAL,
  INITIAL_EMERGENCY_REQUESTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_HOSPITAL_NOTIFICATIONS,
} from './services/hospitalAdminService';

// Admin Components
import { AdminLandingPage } from './components/AdminLandingPage';
import { HospitalAdminLogin } from './components/HospitalAdminLogin';
import { HospitalOnboardingWizard } from './components/onboarding/HospitalOnboardingWizard';
import { HospitalAdminHeader } from './components/HospitalAdminHeader';
import { HospitalAdminNav } from './components/HospitalAdminNav';
import { HospitalAdminSidebar } from './components/HospitalAdminSidebar';
import { AdminDashboardOverview } from './components/AdminDashboardOverview';
import { DepartmentsView } from './components/DepartmentsView';
import { DepartmentDetailModal } from './components/DepartmentDetailModal';
import { EmergencyRequestsView } from './components/EmergencyRequestsView';
import { EmergencyRequestDetailModal } from './components/EmergencyRequestDetailModal';
import { BedManagementView } from './components/BedManagementView';
import { DoctorStaffView } from './components/DoctorStaffView';
import { HospitalNotificationsView } from './components/HospitalNotificationsView';
import { HospitalProfileView } from './components/HospitalProfileView';

export type AdminAppScreen = 'landing' | 'login' | 'register' | 'dashboard';

export default function App() {
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<AdminAppScreen>('landing');

  // Authentication & Admin State
  const [adminName, setAdminName] = useState<string>('Admin Rajesh Sharma');

  // Sub-navigation state within Dashboard
  const [adminTab, setAdminTab] = useState<HospitalAdminTab>('dashboard');

  // Detailed Hospital Data State (CityCare Hospital HSP-001 or newly onboarded)
  const [detailedHospital, setDetailedHospital] = useState<DetailedHospital>(INITIAL_DETAILED_HOSPITAL);

  // Operational Lists State
  const [adminEmergencyRequests, setAdminEmergencyRequests] =
    useState<HospitalEmergencyRequest[]>(INITIAL_EMERGENCY_REQUESTS);
  const [adminActivities, setAdminActivities] = useState<HospitalActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [adminNotifications, setAdminNotifications] =
    useState<NotificationItem[]>(INITIAL_HOSPITAL_NOTIFICATIONS);

  // Modals & Selection State
  const [selectedAdminRequest, setSelectedAdminRequest] = useState<HospitalEmergencyRequest | null>(null);
  const [selectedDepartmentDetail, setSelectedDepartmentDetail] = useState<DepartmentItem | null>(null);
  const [isMobileAdminSidebarOpen, setIsMobileAdminSidebarOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Handlers for Department-Wise Resource Operations
  const handleUpdateDepartmentBedOccupied = (
    deptId: string,
    bedId: string,
    newOccupied: number
  ) => {
    setDetailedHospital((prev) => ({
      ...prev,
      departments: prev.departments.map((dept) => {
        if (dept.id !== deptId) return dept;
        return {
          ...dept,
          beds: dept.beds.map((b) => {
            if (b.id !== bedId) return b;
            const updatedOccupied = Math.max(0, Math.min(b.total, newOccupied));
            return {
              ...b,
              occupied: updatedOccupied,
              available: b.total - updatedOccupied,
            };
          }),
        };
      }),
    }));

    if (selectedDepartmentDetail && selectedDepartmentDetail.id === deptId) {
      setSelectedDepartmentDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          beds: prev.beds.map((b) => {
            if (b.id !== bedId) return b;
            const updatedOccupied = Math.max(0, Math.min(b.total, newOccupied));
            return {
              ...b,
              occupied: updatedOccupied,
              available: b.total - updatedOccupied,
            };
          }),
        };
      });
    }

    showToast('Department bed availability updated live!');
  };

  const handleToggleDepartmentDoctorStatus = (
    deptId: string,
    doctorId: string,
    newStatus: 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE'
  ) => {
    setDetailedHospital((prev) => ({
      ...prev,
      departments: prev.departments.map((dept) => {
        if (dept.id !== deptId) return dept;
        return {
          ...dept,
          doctors: dept.doctors.map((doc) =>
            doc.id === doctorId ? { ...doc, availability: newStatus } : doc
          ),
        };
      }),
    }));

    if (selectedDepartmentDetail && selectedDepartmentDetail.id === deptId) {
      setSelectedDepartmentDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          doctors: prev.doctors.map((doc) =>
            doc.id === doctorId ? { ...doc, availability: newStatus } : doc
          ),
        };
      });
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAdminActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: nowStr,
        message: `Doctor status updated to ${newStatus} in department.`,
        category: 'doctor',
      },
      ...prev,
    ]);

    showToast(`Physician shift status set to ${newStatus}`);
  };

  const handleAddBedTypeToDept = (deptId: string, newBed: DepartmentBedType) => {
    setDetailedHospital((prev) => ({
      ...prev,
      departments: prev.departments.map((dept) =>
        dept.id === deptId ? { ...dept, beds: [...dept.beds, newBed] } : dept
      ),
    }));
    showToast(`New bed unit (${newBed.bedType}) added to department!`);
  };

  const handleAddDoctorToDept = (deptId: string, newDoctor: DepartmentDoctor) => {
    setDetailedHospital((prev) => ({
      ...prev,
      departments: prev.departments.map((dept) =>
        dept.id === deptId ? { ...dept, doctors: [...dept.doctors, newDoctor] } : dept
      ),
    }));
    showToast(`${newDoctor.name} added to department roster!`);
  };

  // Emergency Handlers
  const handleAcceptAdminEmergencyRequest = (requestId: string) => {
    setAdminEmergencyRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'ACCEPTED' } : r))
    );

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAdminActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: nowStr,
        message: `Emergency request ${requestId} ACCEPTED by Hospital Admin.`,
        category: 'emergency',
      },
      ...prev,
    ]);

    showToast(`Emergency request ${requestId} accepted and triage bay notified.`);
    if (selectedAdminRequest && selectedAdminRequest.id === requestId) {
      setSelectedAdminRequest((prev) => (prev ? { ...prev, status: 'ACCEPTED' } : null));
    }
  };

  const handleRejectAdminEmergencyRequest = (requestId: string) => {
    setAdminEmergencyRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'REJECTED' } : r))
    );

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAdminActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: nowStr,
        message: `Emergency request ${requestId} REJECTED / Redirected.`,
        category: 'emergency',
      },
      ...prev,
    ]);

    showToast(`Emergency request ${requestId} rejected.`);
    if (selectedAdminRequest && selectedAdminRequest.id === requestId) {
      setSelectedAdminRequest((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
    }
  };

  const handleUpdateAdminRequestStatus = (
    requestId: string,
    newStatus: EmergencyRequestStatus
  ) => {
    setAdminEmergencyRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );

    if (selectedAdminRequest && selectedAdminRequest.id === requestId) {
      setSelectedAdminRequest((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    showToast(`Request ${requestId} status updated to "${newStatus}"`);
  };

  // Auth & Registration Handlers
  const handleLoginSuccess = (name: string) => {
    setAdminName(name);
    setCurrentScreen('dashboard');
    showToast(`Signed in as ${name}`);
  };

  const handleCompleteOnboarding = (newHospital: DetailedHospital) => {
    setDetailedHospital(newHospital);
    setAdminName(newHospital.adminName || 'Admin Rajesh Sharma');
    setCurrentScreen('dashboard');
    showToast(`Hospital "${newHospital.name}" onboarded and ready!`);
  };

  const handleSignOut = () => {
    setCurrentScreen('landing');
    showToast('Signed out of Hospital Admin Portal');
  };

  // SCREEN RENDERING
  if (currentScreen === 'landing') {
    return (
      <AdminLandingPage
        onNavigateScreen={(screen) => setCurrentScreen(screen)}
        hospitalName={detailedHospital.name}
        hospitalCode={detailedHospital.hospitalCode}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <HospitalAdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToRoles={() => setCurrentScreen('landing')}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <HospitalOnboardingWizard
        onCompleteOnboarding={handleCompleteOnboarding}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body antialiased flex flex-col pt-16">
      {/* Mobile Top Header */}
      <HospitalAdminHeader
        profile={{
          id: detailedHospital.id,
          hospitalCode: detailedHospital.hospitalCode,
          name: detailedHospital.name,
          adminName: detailedHospital.adminName || adminName,
          adminEmail: detailedHospital.adminEmail,
          address: detailedHospital.location.address,
          contactPhone: detailedHospital.phone,
          emergencyDepartment: detailedHospital.emergencyConfig.departmentName,
          availableServices: detailedHospital.globalServices,
        }}
        unreadCount={adminNotifications.filter((n) => n.unread).length}
        onOpenNotifications={() => setAdminTab('notifications')}
        onOpenProfile={() => setAdminTab('profile')}
      />

      {/* Main Mobile App Container */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-28 animate-in fade-in duration-200">
        {adminTab === 'dashboard' && (
          <AdminDashboardOverview
            hospital={detailedHospital}
            emergencyRequests={adminEmergencyRequests}
            activities={adminActivities}
            onNavigateTab={(tab) => setAdminTab(tab)}
            onOpenRequestDetail={(req) => setSelectedAdminRequest(req)}
            onOpenDepartmentDetail={(dept) => setSelectedDepartmentDetail(dept)}
          />
        )}

        {adminTab === 'departments' && (
          <DepartmentsView
            departments={detailedHospital.departments}
            onOpenDepartmentDetail={(dept) => setSelectedDepartmentDetail(dept)}
          />
        )}

        {adminTab === 'emergency-requests' && (
          <EmergencyRequestsView
            requests={adminEmergencyRequests}
            onOpenDetail={(req) => setSelectedAdminRequest(req)}
          />
        )}

        {adminTab === 'beds' && (
          <BedManagementView
            hospital={detailedHospital}
            onUpdateBedOccupied={handleUpdateDepartmentBedOccupied}
          />
        )}

        {adminTab === 'doctors' && (
          <DoctorStaffView
            hospital={detailedHospital}
            onToggleDoctorStatus={handleToggleDepartmentDoctorStatus}
            onAddDoctorToDepartment={handleAddDoctorToDept}
          />
        )}

        {adminTab === 'notifications' && (
          <HospitalNotificationsView
            notifications={adminNotifications}
            onMarkAllRead={() =>
              setAdminNotifications((prev) =>
                prev.map((n) => ({ ...n, unread: false }))
              )
            }
          />
        )}

        {adminTab === 'profile' && (
          <HospitalProfileView
            profile={{
              id: detailedHospital.id,
              hospitalCode: detailedHospital.hospitalCode,
              name: detailedHospital.name,
              adminName: detailedHospital.adminName || adminName,
              adminEmail: detailedHospital.adminEmail,
              address: detailedHospital.location.address,
              contactPhone: detailedHospital.phone,
              emergencyDepartment: detailedHospital.emergencyConfig.departmentName,
              availableServices: detailedHospital.globalServices,
            }}
            onUpdateProfile={(updated) =>
              setDetailedHospital((prev) => ({
                ...prev,
                name: updated.name,
                adminName: updated.adminName,
                adminEmail: updated.adminEmail,
                phone: updated.contactPhone,
              }))
            }
            onShowToast={showToast}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <HospitalAdminNav
        activeTab={adminTab}
        onTabChange={(tab) => setAdminTab(tab)}
        unreadNotificationsCount={adminNotifications.filter((n) => n.unread).length}
        emergencyRequestsCount={adminEmergencyRequests.length}
      />

      {/* Modals */}
      <DepartmentDetailModal
        department={selectedDepartmentDetail}
        onClose={() => setSelectedDepartmentDetail(null)}
        onUpdateBedOccupied={handleUpdateDepartmentBedOccupied}
        onToggleDoctorStatus={handleToggleDepartmentDoctorStatus}
        onAddBedType={handleAddBedTypeToDept}
        onAddDoctor={handleAddDoctorToDept}
      />

      <EmergencyRequestDetailModal
        request={selectedAdminRequest}
        onClose={() => setSelectedAdminRequest(null)}
        onAccept={handleAcceptAdminEmergencyRequest}
        onReject={handleRejectAdminEmergencyRequest}
        onUpdateStatus={handleUpdateAdminRequestStatus}
      />

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
