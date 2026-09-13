import {
  DetailedHospital,
  HospitalEmergencyRequest,
  HospitalActivityLog,
  NotificationItem,
} from '../types';

// Full Nested Mock Hospital Data (CityCare Hospital HSP-001)
export const INITIAL_DETAILED_HOSPITAL: DetailedHospital = {
  id: 'hsp-001',
  hospitalCode: 'HSP-001',
  name: 'CityCare Hospital',
  type: 'Private Multi-Specialty Hospital',
  phone: '+91 11 4910 2000',
  emergencyPhone: '+91 11 4910 9999',
  email: 'admin@citycare.org',
  website: 'https://www.citycarehospital.org',
  establishedYear: 2012,
  employeeCount: 450,
  description:
    'CityCare Hospital is a state-of-the-art 250-bed multi-specialty tertiary care healthcare institution featuring Level-1 Trauma Care, Advanced Cardiac Care Unit, and 24x7 Stroke Care protocol.',
  adminName: 'Admin Rajesh Sharma',
  adminEmail: 'admin@citycare.org',
  isOnboarded: true,
  location: {
    address: 'Plot 14, Institutional Area, Sector 44',
    city: 'New Delhi',
    state: 'Delhi NCR',
    pincode: '110017',
    latitude: '28.5355',
    longitude: '77.2610',
    emergencyEntranceLocation: 'Gate #3 (South Wing - Red Canopy)',
    mainEntranceLocation: 'Gate #1 (North Main Atrium)',
    contactInfo: '+91 11 4910 2000 / ER Ext. 101',
  },
  emergencyConfig: {
    is24x7Emergency: true,
    departmentName: 'Emergency Medicine & Level-1 Trauma Bay',
    emergencyContact: '+91 11 4910 9999',
    totalEmergencyBeds: 20,
    availableEmergencyBeds: 8,
    traumaCareAvailable: true,
    ambulanceAvailable: true,
    emergencyDoctorsOnDutyCount: 4,
  },
  globalServices: [
    '24x7 Emergency & Trauma Care',
    'Intensive Care Unit (ICU)',
    'Advanced Cardiac Care (CCU)',
    'Stroke Protocol & Neuro ICU',
    'Orthopedic Trauma & Joint Surgery',
    'Pediatric Emergency & NICU',
    'Diagnostic Radiology (CT/MRI/USG)',
    '24x7 In-House Blood Bank',
    'ALS Ambulance Service',
    '24x7 Central Pharmacy',
  ],
  departments: [
    {
      id: 'dept-er',
      code: 'ER-01',
      name: 'Emergency Medicine & Trauma',
      description: 'Level 1 Trauma Triage & Acute Resuscitation Bay.',
      contactPhone: '+91 11 4910 9999',
      locationFloor: 'Ground Floor, South Wing',
      operatingHours: '24x7',
      is24x7: true,
      hasEmergencySupport: true,
      status: 'ACTIVE',
      services: ['Triage', 'Cardiac Resuscitation', 'Trauma Bay', 'Minor OT', 'Decontamination'],
      beds: [
        { id: 'b-er-gen', bedType: 'Emergency Triage Beds', total: 12, occupied: 7, available: 5, floorWard: 'ER Bay A' },
        { id: 'b-er-[#01]', bedType: 'Trauma Resuscitation Beds', total: 8, occupied: 5, available: 3, floorWard: 'Trauma Bay 1' },
      ],
      doctors: [
        {
          id: 'doc-er-1',
          doctorCode: 'DOC-ER-101',
          name: 'Dr. Sharma',
          specialization: 'Emergency Physician',
          qualification: 'MD (Emergency Medicine), FEM',
          experienceYears: 12,
          contactPhone: '+91 98100 11223',
          email: 'dr.sharma@citycare.org',
          shift: 'Morning Shift (08:00 - 16:00)',
          availability: 'ON DUTY',
        },
        {
          id: 'doc-er-2',
          doctorCode: 'DOC-ER-102',
          name: 'Dr. Vikram Seth',
          specialization: 'Trauma Specialist',
          qualification: 'MS (Trauma Surgery)',
          experienceYears: 9,
          contactPhone: '+91 98100 22334',
          email: 'dr.seth@citycare.org',
          shift: 'Morning Shift (08:00 - 16:00)',
          availability: 'ON DUTY',
        },
        {
          id: 'doc-er-3',
          doctorCode: 'DOC-ER-103',
          name: 'Dr. Neha Gupta',
          specialization: 'Emergency Medicine Specialist',
          qualification: 'MBBS, DNB (EM)',
          experienceYears: 6,
          contactPhone: '+91 98100 33445',
          email: 'dr.neha@citycare.org',
          shift: 'Night Shift (20:00 - 08:00)',
          availability: 'OFF DUTY',
        },
      ],
    },
    {
      id: 'dept-cardio',
      code: 'CARD-02',
      name: 'Cardiology & Vascular Medicine',
      description: 'Comprehensive interventional cardiology, Cath Lab, CCU, and telemetry.',
      contactPhone: '+91 11 4910 2020',
      locationFloor: '2nd Floor, Block A',
      operatingHours: '24x7 Emergency / OPD 09:00 - 17:00',
      is24x7: true,
      hasEmergencySupport: true,
      status: 'ACTIVE',
      services: ['Cath Lab', 'Echocardiography', 'Holter Monitoring', 'Cardiac Surgery', 'CCU'],
      beds: [
        { id: 'b-card-gen', bedType: 'General Cardiac Ward', total: 20, occupied: 15, available: 5, floorWard: 'Ward 2A' },
        { id: 'b-card-ccu', bedType: 'Cardiac Care Unit (CCU)', total: 5, occupied: 3, available: 2, floorWard: 'CCU Wing 1' },
        { id: 'b-card-icu', bedType: 'Post-Op Cardiac ICU', total: 5, occupied: 4, available: 1, floorWard: 'CCU Wing 2' },
      ],
      doctors: [
        {
          id: 'doc-card-1',
          doctorCode: 'DOC-CARD-201',
          name: 'Dr. Verma',
          specialization: 'Interventional Cardiologist',
          qualification: 'DM (Cardiology), FACC',
          experienceYears: 15,
          contactPhone: '+91 98111 22334',
          email: 'dr.verma@citycare.org',
          shift: 'On-Call Trauma & Cath Lab',
          availability: 'ON DUTY',
        },
        {
          id: 'doc-card-2',
          doctorCode: 'DOC-CARD-202',
          name: 'Dr. Priya Nambiar',
          specialization: 'Non-Invasive Cardiologist',
          qualification: 'MD, DNB (Cardiology)',
          experienceYears: 8,
          contactPhone: '+91 98111 33445',
          email: 'dr.priya@citycare.org',
          shift: 'Day Shift (09:00 - 17:00)',
          availability: 'ON DUTY',
        },
      ],
    },
    {
      id: 'dept-ortho',
      code: 'ORTH-03',
      name: 'Orthopedics & Joint Surgery',
      description: 'Joint replacement, arthroscopy, and complex fracture care.',
      contactPhone: '+91 11 4910 2030',
      locationFloor: '3rd Floor, Block B',
      operatingHours: 'OPD 08:00 - 18:00 (Emergency 24x7)',
      is24x7: false,
      hasEmergencySupport: true,
      status: 'ACTIVE',
      services: ['Total Knee Replacement', 'Spine Surgery', 'Arthroscopy', 'Fracture Care'],
      beds: [
        { id: 'b-orth-gen', bedType: 'General Ortho Ward', total: 30, occupied: 22, available: 8, floorWard: 'Ward 3B' },
        { id: 'b-orth-hdu', bedType: 'High Dependency Unit (HDU)', total: 10, occupied: 8, available: 2, floorWard: 'Ortho HDU' },
      ],
      doctors: [
        {
          id: 'doc-orth-1',
          doctorCode: 'DOC-ORTH-301',
          name: 'Dr. Singh',
          specialization: 'Orthopedic Surgeon',
          qualification: 'MS (Ortho), Fellowship (UK)',
          experienceYears: 14,
          contactPhone: '+91 98122 33445',
          email: 'dr.singh@citycare.org',
          shift: 'Day Shift (09:00 - 17:00)',
          availability: 'ON DUTY',
        },
      ],
    },
    {
      id: 'dept-neuro',
      code: 'NEUR-04',
      name: 'Neurology & Stroke Unit',
      description: 'Advanced neuro-critical care, stroke thrombolysis, and EEG lab.',
      contactPhone: '+91 11 4910 2040',
      locationFloor: '4th Floor, Block A',
      operatingHours: '24x7 Emergency',
      is24x7: true,
      hasEmergencySupport: true,
      status: 'ACTIVE',
      services: ['Stroke Code Thrombolysis', 'Neuro ICU', 'EEG / EMG', 'Neurosurgery'],
      beds: [
        { id: 'b-neur-gen', bedType: 'General Neuro Ward', total: 15, occupied: 10, available: 5, floorWard: 'Ward 4A' },
        { id: 'b-neur-icu', bedType: 'Neuro ICU Beds', total: 10, occupied: 7, available: 3, floorWard: 'Neuro ICU' },
      ],
      doctors: [
        {
          id: 'doc-neur-1',
          doctorCode: 'DOC-NEUR-401',
          name: 'Dr. Ananya Roy',
          specialization: 'Neurologist & Stroke Specialist',
          qualification: 'DM (Neurology)',
          experienceYears: 11,
          contactPhone: '+91 98133 44556',
          email: 'dr.ananya@citycare.org',
          shift: 'Morning Shift (08:00 - 16:00)',
          availability: 'ON DUTY',
        },
      ],
    },
    {
      id: 'dept-genmed',
      code: 'GEN-05',
      name: 'General Medicine & Internal Care',
      description: 'Inpatient medical management, infectious disease care, and diabetes management.',
      contactPhone: '+91 11 4910 2050',
      locationFloor: '1st & 2nd Floor, Block B',
      operatingHours: '24x7',
      is24x7: true,
      hasEmergencySupport: true,
      status: 'ACTIVE',
      services: ['Internal Medicine', 'Infectious Disease', 'Diabetology', 'General Ward'],
      beds: [
        { id: 'b-gen-ward', bedType: 'General Medical Ward', total: 45, occupied: 36, available: 9, floorWard: 'Ward 1B & 2B' },
        { id: 'b-gen-pvt', bedType: 'Private Deluxe Rooms', total: 5, occupied: 4, available: 1, floorWard: '5th Floor Suite' },
      ],
      doctors: [
        {
          id: 'doc-gen-1',
          doctorCode: 'DOC-GEN-501',
          name: 'Dr. Rajesh Patel',
          specialization: 'Internal Medicine Specialist',
          qualification: 'MD (Medicine)',
          experienceYears: 16,
          contactPhone: '+91 98144 55667',
          email: 'dr.patel@citycare.org',
          shift: 'Day Shift (08:00 - 17:00)',
          availability: 'ON DUTY',
        },
      ],
    },
    {
      id: 'dept-peds',
      code: 'PED-06',
      name: 'Pediatrics & Neonatal Unit',
      description: 'Comprehensive child healthcare, NICU, PICU, and immunizations.',
      contactPhone: '+91 11 4910 2060',
      locationFloor: '3rd Floor, Block A',
      operatingHours: '24x7',
      is24x7: true,
      hasEmergencySupport: true,
      status: 'ACTIVE',
      services: ['Pediatric Emergency', 'NICU Level 3', 'PICU', 'Child Development'],
      beds: [
        { id: 'b-ped-gen', bedType: 'Pediatric General Ward', total: 15, occupied: 10, available: 5, floorWard: 'Ward 3A' },
        { id: 'b-ped-nicu', bedType: 'NICU Incubator Beds', total: 10, occupied: 7, available: 3, floorWard: 'NICU Bay' },
      ],
      doctors: [
        {
          id: 'doc-ped-1',
          doctorCode: 'DOC-PED-601',
          name: 'Dr. Meera Kapoor',
          specialization: 'Pediatrician & Neonatologist',
          qualification: 'MD (Pediatrics), Fellowship (Neonatology)',
          experienceYears: 10,
          contactPhone: '+91 98155 66778',
          email: 'dr.meera@citycare.org',
          shift: 'Day Shift (09:00 - 17:00)',
          availability: 'ON DUTY',
        },
      ],
    },
  ],
};

// Helper: Dynamically compute hospital totals across nested departments
export function calculateHospitalSummary(hospital: DetailedHospital) {
  let totalBeds = 0;
  let occupiedBeds = 0;
  let availableBeds = 0;
  let totalIcuBeds = 0;
  let availableIcuBeds = 0;
  let totalErBeds = 0;
  let availableErBeds = 0;
  let totalDoctors = 0;
  let doctorsOnDuty = 0;

  hospital.departments.forEach((dept) => {
    // Beds calculation
    dept.beds.forEach((b) => {
      totalBeds += b.total;
      occupiedBeds += b.occupied;
      availableBeds += b.available;

      const typeLower = b.bedType.toLowerCase();
      if (typeLower.includes('icu') || typeLower.includes('ccu') || typeLower.includes('nicu')) {
        totalIcuBeds += b.total;
        availableIcuBeds += b.available;
      }
      if (typeLower.includes('emergency') || typeLower.includes('trauma') || typeLower.includes('er')) {
        totalErBeds += b.total;
        availableErBeds += b.available;
      }
    });

    // Doctors calculation
    dept.doctors.forEach((doc) => {
      totalDoctors += 1;
      if (doc.availability === 'ON DUTY') {
        doctorsOnDuty += 1;
      }
    });
  });

  return {
    totalBeds,
    occupiedBeds,
    availableBeds,
    totalIcuBeds,
    availableIcuBeds,
    totalErBeds,
    availableErBeds,
    totalDoctors,
    doctorsOnDuty,
    totalDepartments: hospital.departments.length,
  };
}

// Initial Mock Emergency Requests
export const INITIAL_EMERGENCY_REQUESTS: HospitalEmergencyRequest[] = [
  {
    id: 'P-102',
    patientId: 'p-102',
    patientName: 'Ramesh Kumar',
    ageGender: '58y • Male',
    severity: 'EMERGENCY',
    requiredCare: 'Emergency Department / Cardiac Bay',
    requestTime: '2 min ago',
    timestamp: '10:42 AM',
    status: 'REQUEST CREATED',
    complaint: 'Sudden retrosternal chest pain, radiating to left arm with cold sweating.',
    aiAssessment: 'CRITICAL HIGH URGENCY — Immediate emergency cardiac triage required.',
    aiRecommendation: 'Trauma Bay 1 preparation, STAT ECG, Troponin I panel, Oxygen protocol.',
    aiSummary:
      'Patient P-102 (58M) presented with acute chest discomfort and autonomic symptoms. Past history of hypertension. High risk of Acute Coronary Syndrome.',
    medicalInfo: 'Hypertension (5 yrs), Type 2 Diabetes. Allergy: Penicillin.',
    allocatedBed: 'ER Bed #01',
  },
  {
    id: 'P-204',
    patientId: 'p-204',
    patientName: 'Priya Verma',
    ageGender: '34y • Female',
    severity: 'HIGH',
    requiredCare: 'Cardiology & Vascular',
    requestTime: '8 min ago',
    timestamp: '10:36 AM',
    status: 'ACCEPTED',
    complaint: 'Acute palpitations, dizziness, and feeling of impending syncope.',
    aiAssessment: 'HIGH URGENCY — Rapid cardiology evaluation advised.',
    aiRecommendation: 'Monitor telemetry, BP checks, Echocardiogram assessment.',
    aiSummary:
      'Patient P-204 (34F) reporting sudden onset paroxysmal tachycardia. No previous cardiac surgical history.',
    medicalInfo: 'Asthma (Mild). Current Meds: Albuterol inhaler PRN.',
    allocatedBed: 'CCU Wing 1 Bed #04',
  },
  {
    id: 'P-098',
    patientId: 'p-098',
    patientName: 'Gurpreet Singh',
    ageGender: '45y • Male',
    severity: 'MODERATE',
    requiredCare: 'General Medicine',
    requestTime: '25 min ago',
    timestamp: '10:19 AM',
    status: 'IN PROGRESS',
    complaint: 'High grade fever (103°F), severe body ache, and vomiting.',
    aiAssessment: 'MODERATE URGENCY — Clinical evaluation and hydration IV needed.',
    aiRecommendation: 'Vitals check, CBC, Dengue/Malaria screen, IV fluids.',
    aiSummary:
      'Patient P-098 (45M) with 3-day history of febrile illness. Hemodynamically stable but dehydrated.',
    medicalInfo: 'No known chronic conditions or allergies.',
    allocatedBed: 'General Ward 2B',
  },
  {
    id: 'P-115',
    patientId: 'p-115',
    patientName: 'Sunita Devi',
    ageGender: '62y • Female',
    severity: 'HIGH',
    requiredCare: 'Neurology & Stroke Unit',
    requestTime: '40 min ago',
    timestamp: '10:04 AM',
    status: 'ACCEPTED',
    complaint: 'Sudden weakness in right upper limb, mild facial asymmetry.',
    aiAssessment: 'HIGH URGENCY — STAT Stroke Protocol evaluation recommended.',
    aiRecommendation: 'Immediate non-contrast CT Brain, Stroke code activation.',
    aiSummary:
      'Patient P-115 (62F) exhibiting acute neurological deficit onset < 2 hours. Requires urgent neuro-imaging.',
    medicalInfo: 'Hypertension, Hyperlipidemia. Meds: Amlodipine 5mg.',
    allocatedBed: 'Neuro ICU Bed #02',
  },
];

// Initial Activity Logs
export const INITIAL_ACTIVITY_LOGS: HospitalActivityLog[] = [
  {
    id: 'act-1',
    time: '10:42 AM',
    message: 'Emergency request P-102 received (Severity: EMERGENCY).',
    category: 'emergency',
  },
  {
    id: 'act-2',
    time: '10:39 AM',
    message: 'Dr. Sharma marked ON DUTY for Emergency Medicine.',
    category: 'doctor',
  },
  {
    id: 'act-3',
    time: '10:35 AM',
    message: 'Cardiology CCU bed availability updated.',
    category: 'bed',
  },
  {
    id: 'act-4',
    time: '10:04 AM',
    message: 'Emergency request P-115 ACCEPTED for Stroke Protocol.',
    category: 'emergency',
  },
];

// Initial Hospital Notifications
export const INITIAL_HOSPITAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'hnotif-1',
    title: '🚨 New Emergency Request P-102',
    desc: 'Hospital emergency request P-102 requires immediate attention. Chest pain & acute distress.',
    time: '2 min ago',
    type: 'EMERGENCY',
    unread: true,
  },
  {
    id: 'hnotif-2',
    title: 'Doctor Duty Update',
    desc: 'Dr. Sharma is now ON DUTY in Emergency Medicine department.',
    time: '8 min ago',
    type: 'STAFF',
    unread: true,
  },
  {
    id: 'hnotif-3',
    title: 'Emergency Request P-204 Accepted',
    desc: 'Request P-204 accepted. CCU Bed #04 assigned to Cardiology intake.',
    time: '12 min ago',
    type: 'SYSTEM',
    unread: false,
  },
];
