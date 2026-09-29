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
  calculateHospitalSummary,
} from './services/hospitalAdminService';
import {
  fetchHospitalDetailsApi,
  fetchEmergencyRequestsApi,
  updateEmergencyStatusApi,
  updateBedOccupancyApi,
  subscribeEmergencyStreamApi,
} from './services/adminApi';

// Admin Components
import { HospitalAdminLogin } from './components/admin/HospitalAdminLogin';
import { HospitalOnboardingWizard } from './components/admin/onboarding/HospitalOnboardingWizard';
import { HospitalAdminHeader } from './components/admin/HospitalAdminHeader';
import { HospitalAdminNav } from './components/admin/HospitalAdminNav';
import { HospitalAdminSidebar } from './components/admin/HospitalAdminSidebar';
import { AdminDashboardOverview } from './components/admin/AdminDashboardOverview';
import { DepartmentsView } from './components/admin/DepartmentsView';
import { DepartmentDetailModal } from './components/admin/DepartmentDetailModal';
import { EmergencyRequestsView } from './components/admin/EmergencyRequestsView';
import { EmergencyRequestDetailModal } from './components/admin/EmergencyRequestDetailModal';
import { BedManagementView } from './components/admin/BedManagementView';
import { DoctorStaffView } from './components/admin/DoctorStaffView';
import { HospitalNotificationsView } from './components/admin/HospitalNotificationsView';
import { HospitalProfileView } from './components/admin/HospitalProfileView';

export default function App() {
  // Screen mode: 'dashboard' | 'login' | 'onboarding'
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'login' | 'onboarding'>('login');

  React.useEffect(() => {
    const token = localStorage.getItem('medinexus_admin_token');
    if (token) {
      setCurrentScreen('dashboard');
    }
  }, []);

  // Sub-navigation tab
  const [adminTab, setAdminTab] = useState<HospitalAdminTab>('dashboard');

  // Detailed Hospital State
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

  React.useEffect(() => {
    let unsubscribe = () => {};
    if (currentScreen === 'dashboard') {
      const loadData = async () => {
        const hData = await fetchHospitalDetailsApi();
        if (hData) {
          setDetailedHospital(hData);
          const eData = await fetchEmergencyRequestsApi(hData.id);
          if (eData) {
            setAdminEmergencyRequests(eData);
          }
          
          unsubscribe = subscribeEmergencyStreamApi(hData.id, (eventData) => {
             if (eventData.type === 'EMERGENCY_SOS') {
               setAdminEmergencyRequests(prev => [eventData.data, ...prev]);
             }
          });
        }
      };
      loadData();
    }
    return () => unsubscribe();
  }, [currentScreen]);

  // Hospital Admin Actions
  const handleUpdateAdminRequestStatus = async (
    reqId: string,
    newStatus: EmergencyRequestStatus,
    allocatedBed?: string
  ) => {
    try {
      await updateEmergencyStatusApi(reqId, newStatus, allocatedBed);
      setAdminEmergencyRequests((prev) =>
        prev.map((req) => (req.id === reqId ? { ...req, status: newStatus, allocatedBed } : req))
      );
      if (selectedAdminRequest && selectedAdminRequest.id === reqId) {
        setSelectedAdminRequest((prev) => (prev ? { ...prev, status: newStatus, allocatedBed } : null));
      }

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAdminActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          time: timeNow,
          message: `Emergency request ${reqId} updated to ${newStatus}${allocatedBed ? ` (${allocatedBed})` : ''}.`,
          category: 'emergency',
        },
        ...prev,
      ]);

      showToast(`Request ${reqId} updated to ${newStatus}`);
    } catch (e) {
      showToast(`Failed to update request ${reqId}`);
    }
  };

  const handleUpdateBedOccupancy = async (deptId: string, bedTypeId: string, newOccupied: number) => {
    try {
      await updateBedOccupancyApi(deptId, bedTypeId, newOccupied);
      setDetailedHospital((prev) => {
        const updatedDepts = prev.departments.map((dept) => {
          if (dept.id !== deptId) return dept;
          const updatedBeds = dept.beds.map((b) => {
            if (b.id !== bedTypeId) return b;
            const validOccupied = Math.max(0, Math.min(b.total, newOccupied));
            return {
              ...b,
              occupied: validOccupied,
              available: b.total - validOccupied,
            };
          });
          return { ...dept, beds: updatedBeds };
        });
        return { ...prev, departments: updatedDepts };
      });

      showToast('Bed count updated in real-time');
    } catch (e) {
      showToast('Failed to update bed count');
    }
  };

  const handleUpdateDoctorAvailability = (
    deptId: string,
    docId: string,
    availability: 'ON DUTY' | 'OFF DUTY' | 'ON LEAVE'
  ) => {
    setDetailedHospital((prev) => {
      const updatedDepts = prev.departments.map((dept) => {
        if (dept.id !== deptId) return dept;
        const updatedDocs = dept.doctors.map((d) => {
          if (d.id !== docId) return d;
          return { ...d, availability };
        });
        return { ...dept, doctors: updatedDocs };
      });
      return { ...prev, departments: updatedDepts };
    });

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAdminActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        time: timeNow,
        message: `Doctor availability changed to ${availability}.`,
        category: 'doctor',
      },
      ...prev,
    ]);

    showToast(`Doctor availability set to ${availability}`);
  };

  const handleAddDepartment = (newDept: DepartmentItem) => {
    setDetailedHospital((prev) => ({
      ...prev,
      departments: [...prev.departments, newDept],
    }));
    showToast(`Department "${newDept.name}" added successfully`);
  };

  const handleAddDoctorToDept = (deptId: string, newDoc: DepartmentDoctor) => {
    setDetailedHospital((prev) => {
      const updatedDepts = prev.departments.map((dept) => {
        if (dept.id !== deptId) return dept;
        return { ...dept, doctors: [...dept.doctors, newDoc] };
      });
      return { ...prev, departments: updatedDepts };
    });
    showToast(`Doctor ${newDoc.name} added to department`);
  };

  const handleAddBedToDept = (deptId: string, newBed: DepartmentBedType) => {
    setDetailedHospital((prev) => {
      const updatedDepts = prev.departments.map((dept) => {
        if (dept.id !== deptId) return dept;
        return { ...dept, beds: [...dept.beds, newBed] };
      });
      return { ...prev, departments: updatedDepts };
    });
    showToast(`Bed category ${newBed.bedType} added`);
  };

  const handleUpdateHospitalProfile = (updatedProfile: {
    name: string;
    hospitalCode: string;
    adminName: string;
    adminEmail: string;
    address: string;
    contactPhone: string;
    emergencyDepartment: string;
    availableServices: string[];
  }) => {
    setDetailedHospital((prev) => ({
      ...prev,
      name: updatedProfile.name,
      hospitalCode: updatedProfile.hospitalCode,
      adminName: updatedProfile.adminName,
      adminEmail: updatedProfile.adminEmail,
      phone: updatedProfile.contactPhone,
      globalServices: updatedProfile.availableServices,
      location: {
        ...prev.location,
        address: updatedProfile.address,
      },
      emergencyConfig: {
        ...prev.emergencyConfig,
        departmentName: updatedProfile.emergencyDepartment,
      },
    }));
    showToast('Hospital profile updated');
  };

  const handleCompleteOnboarding = (newHospital: DetailedHospital) => {
    setDetailedHospital(newHospital);
    setCurrentScreen('dashboard');
    setAdminTab('dashboard');
    showToast(`Hospital "${newHospital.name}" onboarded successfully!`);
  };

  const unreadNotificationsCount = adminNotifications.filter((n) => n.unread).length;
  const summary = calculateHospitalSummary(detailedHospital);

  // Render Login Screen
  if (currentScreen === 'login') {
    return (
      <HospitalAdminLogin
        onLoginSuccess={(adminName) => {
          showToast(`Welcome back, ${adminName}`);
          setCurrentScreen('dashboard');
        }}
        onStartOnboarding={() => setCurrentScreen('onboarding')}
      />
    );
  }

  // Render Onboarding Screen
  if (currentScreen === 'onboarding') {
    return (
      <HospitalOnboardingWizard
        onComplete={handleCompleteOnboarding}
        onCancel={() => setCurrentScreen('login')}
      />
    );
  }

  // Render Admin Console Dashboard Layout
  return (
    <div className="min-h-screen bg-[#162a24] text-white flex flex-col antialiased selection:bg-[#2e594d] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#254d41] text-[#7ce7ba] px-4 py-2.5 rounded-xl border border-[#3b6657] shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <HospitalAdminHeader
        profile={{
          id: detailedHospital.id,
          name: detailedHospital.name,
          hospitalCode: detailedHospital.hospitalCode,
          adminName: detailedHospital.adminName,
          adminEmail: detailedHospital.adminEmail,
          address: detailedHospital.location.address,
          contactPhone: detailedHospital.phone,
          emergencyDepartment: detailedHospital.emergencyConfig.departmentName,
          availableServices: detailedHospital.globalServices,
        }}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setAdminTab('notifications')}
        onOpenProfile={() => setAdminTab('profile')}
      />

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <HospitalAdminSidebar
        activeTab={adminTab}
        onTabChange={(tab) => setAdminTab(tab)}
        onSignOut={() => {
          localStorage.removeItem('medinexus_admin_token');
          setCurrentScreen('login');
        }}
        departmentsCount={detailedHospital.departments.length}
        emergencyRequestsCount={adminEmergencyRequests.filter((r) => r.status === 'REQUEST CREATED').length}
        unreadNotificationsCount={unreadNotificationsCount}
        isMobileOpen={isMobileAdminSidebarOpen}
        onCloseMobile={() => setIsMobileAdminSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 pt-16 pb-20 md:pb-6">
        {/* Mobile Header Bar Toggle */}
        <div className="md:hidden bg-[#1b322a] border-b border-[#27463c] px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setIsMobileAdminSidebarOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold text-[#8adbb7] hover:text-white bg-[#224036] px-3 py-1.5 rounded-lg border border-[#2e5749]"
          >
            <span className="material-symbols-outlined text-[18px]">menu</span>
            <span>Admin Navigation</span>
          </button>
          <span className="text-[11px] font-mono text-[#81a89c]">{detailedHospital.hospitalCode}</span>
        </div>

        <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          {adminTab === 'dashboard' && (
            <AdminDashboardOverview
              hospital={detailedHospital}
              summary={summary}
              emergencyRequests={adminEmergencyRequests}
              activities={adminActivities}
              onNavigate={(tab) => setAdminTab(tab)}
              onSelectRequest={(req) => setSelectedAdminRequest(req)}
            />
          )}

          {adminTab === 'departments' && (
            <DepartmentsView
              departments={detailedHospital.departments}
              onSelectDepartment={(dept) => setSelectedDepartmentDetail(dept)}
              onAddDepartment={handleAddDepartment}
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
              onUpdateBedOccupied={handleUpdateBedOccupancy}
            />
          )}

          {adminTab === 'doctors' && (
            <DoctorStaffView
              hospital={detailedHospital}
              onToggleDoctorStatus={handleUpdateDoctorAvailability}
              onAddDoctorToDepartment={handleAddDoctorToDept}
            />
          )}

          {adminTab === 'notifications' && (
            <HospitalNotificationsView
              notifications={adminNotifications}
              onMarkAsRead={(id) =>
                setAdminNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
                )
              }
              onClearAll={() => setAdminNotifications([])}
            />
          )}

          {adminTab === 'profile' && (
            <HospitalProfileView
              profile={{
                id: detailedHospital.id,
                name: detailedHospital.name,
                hospitalCode: detailedHospital.hospitalCode,
                adminName: detailedHospital.adminName,
                adminEmail: detailedHospital.adminEmail,
                address: detailedHospital.location.address,
                contactPhone: detailedHospital.phone,
                emergencyDepartment: detailedHospital.emergencyConfig.departmentName,
                availableServices: detailedHospital.globalServices,
              }}
              onSaveProfile={handleUpdateHospitalProfile}
            />
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <HospitalAdminNav
          activeTab={adminTab}
          onTabChange={(tab) => setAdminTab(tab)}
          unreadNotificationsCount={unreadNotificationsCount}
          emergencyRequestsCount={adminEmergencyRequests.filter((r) => r.status === 'REQUEST CREATED').length}
        />
      </div>

      {/* Modals */}
      {selectedAdminRequest && (
        <EmergencyRequestDetailModal
          request={selectedAdminRequest}
          onClose={() => setSelectedAdminRequest(null)}
          onUpdateStatus={handleUpdateAdminRequestStatus}
        />
      )}

      {selectedDepartmentDetail && (
        <DepartmentDetailModal
          department={selectedDepartmentDetail}
          onClose={() => setSelectedDepartmentDetail(null)}
          onUpdateBedOccupancy={handleUpdateBedOccupancy}
          onUpdateDoctorAvailability={handleUpdateDoctorAvailability}
        />
      )}
    </div>
  );
}
