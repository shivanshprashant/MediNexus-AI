# MediNexus AI — Project Context for Antigravity

## 1. Project Identity

**Project Name:** MediNexus AI  
**Full Title:** MediNexus AI: An AI-Powered Unified Smart Healthcare Ecosystem  
**Tagline:** Healthcare, connected.

MediNexus AI is a college project that aims to create a unified healthcare ecosystem connecting **patients, doctors, and multiple hospitals** through an AI-assisted workflow.

This is **not intended to be just an AI chatbot** and not simply a hospital management system. The core idea is to connect patient information, symptom understanding, urgency assessment, suitable healthcare recommendations, emergency workflows, and healthcare-provider communication in one platform.

---

## 2. Core Vision

The overall workflow is:

Patient
→ Symptoms / Complaint
→ Medical History & Context
→ AI-Assisted Analysis
→ Severity / Urgency Assessment
→ Healthcare Pathway Recommendation
→ Suitable Nearby Hospital
→ Emergency / Care Request
→ Hospital Notification
→ Doctor Notification
→ Patient Status Updates

The AI should assist the healthcare workflow. It must **not be presented as a doctor or definitive diagnostic system**.

---

## 3. User Roles

MediNexus has three primary user portals:

### A. Patient

Patients can:

- Register and log in
- Maintain their profile
- Maintain medical history
- Enter symptoms using text
- Enter symptoms using voice
- View speech-to-text transcription
- Request AI-assisted symptom analysis
- View severity / urgency assessment
- View recommended healthcare pathway
- Find suitable nearby hospitals
- Trigger Emergency SOS
- Track emergency/care request status
- Receive notifications
- View AI-generated patient summaries where appropriate

### B. Doctor

Doctors can:

- Log in
- View doctor dashboard
- View relevant/assigned patients
- View patient information
- View medical history
- View current symptoms/complaints
- View AI-assisted assessment
- View AI-generated patient summary
- View emergency cases
- Receive emergency notifications
- Update case status

### C. Hospital Admin

MediNexus supports **multiple hospitals**, so each hospital has its own Hospital Admin.

Hospital Admin can:

- Log in
- View their hospital dashboard
- View incoming emergency requests
- Accept/reject requests
- Update request status
- Manage bed availability
- View general/ICU/emergency bed availability
- View/manage doctor and staff availability
- Receive notifications
- View hospital-specific activity

### Multi-Hospital Isolation

This is an important architectural rule.

Hospital A Admin must only see Hospital A's data.

Hospital B Admin must only see Hospital B's data.

Do NOT create a single dashboard where every hospital admin can see every hospital's private information.

The backend will eventually enforce this using authentication and a hospital identifier such as `hospital_id`.

---

## 4. Current V1 Features

The college-project V1 should focus on these features:

1. User Authentication
2. Patient Profile & Medical History
3. AI Symptom Analysis
4. AI Severity Assessment
5. Smart Healthcare Recommendation
6. Suitable Nearby Hospital Recommendation
7. Emergency SOS System
8. Hospital Dashboard
9. Doctor Dashboard
10. Patient Dashboard
11. Notifications
12. AI Patient Summary
13. Voice Input / Speech-to-Text

Keep the V1 focused. Do not unnecessarily expand the scope.

---

## 5. Patient Portal

### Authentication

Required screens:

- Login
- Registration
- Forgot Password

### Patient Home

The patient dashboard should provide quick access to:

- AI Health Assistant
- Emergency SOS
- Medical History
- Nearby Hospitals
- Notifications
- Profile

Example conceptual layout:

    Welcome, [Patient Name]

    [ AI Health Assistant ]

    [ EMERGENCY SOS ]

    Medical History
    Nearby Hospitals
    Notifications

---

## 6. AI Health Assistant

This is one of the most important features.

The patient should be able to describe a health complaint naturally.

### Text input

Example:

> I have severe chest pain and dizziness.

### Voice input

The patient can press a microphone button and speak.

Example:

> Mujhe seene mein bahut dard ho raha hai.

The voice pipeline is:

    Microphone
        ↓
    Speech-to-Text
        ↓
    Display Transcribed Text
        ↓
    Analyze

The frontend should visibly show the transcription before analysis.

The frontend should not pretend that it is doing medical reasoning itself. The AI processing will eventually happen through the backend.

---

## 7. AI Assessment

The backend AI engine is planned around an LLM accessed through NVIDIA NIM.

The frontend should be capable of displaying structured AI results such as:

- Severity
- Emergency status
- Appropriate department / care pathway
- Recommended action
- Reason

Possible severity values:

- LOW
- MODERATE
- HIGH
- EMERGENCY

### Medical Safety Language

Never display definitive diagnoses.

Bad:

> You have a heart attack.

Better:

> AI-assisted assessment indicates that urgent medical evaluation may be required.

Use labels such as:

**AI-Assisted Assessment**

and:

**AI does not replace professional medical evaluation.**

---

## 8. Emergency SOS

Emergency SOS should be highly visible but should not look like a gimmicky feature.

Conceptual flow:

    Patient activates SOS
            ↓
    Emergency request created
            ↓
    Suitable hospital notified
            ↓
    Hospital Admin notified
            ↓
    Doctor notified
            ↓
    Patient sees request status

Possible statuses:

- REQUEST CREATED
- HOSPITAL NOTIFIED
- ACCEPTED
- IN PROGRESS
- COMPLETED

Emergency-related UI can use muted red.

---

## 9. Emergency AI Pipeline

The planned backend architecture contains a deterministic emergency pre-screening layer.

Conceptually:

    Patient message
          ↓
    Emergency Interceptor
        /       \
      YES        NO
       ↓          ↓
    Emergency    AI analysis
    workflow

The reason for this layer is that obvious emergency phrases should not depend entirely on an LLM.

Examples:

- unconscious
- not breathing
- stopped breathing
- cardiac arrest
- severe bleeding
- cannot breathe

The implementation should be described as a **fast deterministic emergency pre-screening layer**, not as a complete medical diagnosis system.

---

## 10. Nearby Suitable Hospitals

This should NOT be a generic hospital directory.

The MediNexus concept is:

    Patient location
          +
    Healthcare requirement
          +
    Hospital suitability
          +
    Availability
          ↓
    Suitable Hospital

A hospital card can display:

- Hospital name
- Distance
- Relevant services
- Emergency capability
- Availability indicator
- Request Care button
- View Details button

For the frontend prototype, realistic mock data can be used initially.

The frontend must be designed so mock data can later be replaced with FastAPI/backend data without rebuilding the UI.

---

## 11. Medical History

Patient medical history should be represented clearly.

Potential categories:

- Medical conditions
- Medications
- Allergies
- Previous procedures
- Relevant medical events

This information will eventually be passed to the AI as medical context.

Do not make the medical-history UI unnecessarily complicated for V1.

---

## 12. AI Patient Summary

Doctors should be able to view a concise AI-generated summary.

Example:

    AI PATIENT SUMMARY

    Patient: P-101

    Current Complaint:
    Chest discomfort and dizziness

    Relevant History:
    Hypertension

    AI-Assisted Severity:
    HIGH

    Recommended Care Pathway:
    Urgent medical evaluation

    AI-generated summary.
    Verify with clinical information.

The summary must clearly be presented as AI-generated assistance, not a definitive clinical diagnosis.

---

## 13. Doctor Portal

Required screens:

- Doctor Login
- Doctor Dashboard
- Patient List
- Patient Details
- Emergency Cases
- AI Patient Summary
- Notifications

Doctor dashboard can display:

- Emergency cases
- Active patients
- Pending reviews
- Recent cases

Patient details should show:

- Patient information
- Current complaint
- Medical history
- AI-assisted assessment
- AI-generated summary
- Emergency/care request status

---

## 14. Hospital Admin Portal

This portal is REQUIRED because MediNexus supports multiple hospitals.

Required screens:

- Hospital Admin Login
- Hospital Dashboard
- Emergency Requests
- Bed Management
- Doctor/Staff Management
- Notifications

### Hospital Dashboard

Display information such as:

- Emergency requests
- Available beds
- ICU beds
- Emergency beds
- Doctors on duty
- Recent activity

### Emergency Requests

Show:

- Patient ID
- Severity
- Request time
- Status
- Required care pathway

Actions:

- View
- Accept
- Reject
- Update Status

### Bed Management

Support simple categories:

- General beds
- ICU beds
- Emergency beds

Show:

- Total
- Occupied
- Available

### Doctor/Staff Management

Show:

- Doctor name
- Department
- Availability

Example:

    Dr. Sharma
    Emergency Medicine
    ON DUTY

    Dr. Verma
    Cardiology
    ON DUTY

    Dr. Singh
    Orthopedics
    OFF DUTY

---

## 15. Notifications

All three portals should have notification interfaces.

### Patient

Example:

> Hospital accepted your emergency request.

### Doctor

Example:

> New emergency case received.

### Hospital Admin

Example:

> New emergency request received.

The frontend should be designed so that notifications can later be connected to real-time backend communication such as SSE/WebSockets.

For the current prototype, mock notification updates are acceptable.

---

## 16. Planned AI/LLM Architecture

The AI engine is separate from the UI.

Current conceptual architecture:

    React + TypeScript
            ↓
         FastAPI
            ↓
     AI / LLM Engine
            ↓
    Emergency Interceptor
            ↓
     Medical Context
            ↓
       NVIDIA NIM
            ↓
    Structured AI Output
            ↓
     Backend Validation
            ↓
    Healthcare Workflow

Voice adds:

    Patient Voice
         ↓
    Speech-to-Text
         ↓
    Patient Text
         ↓
    Emergency Interceptor / LLM Pipeline

The planned speech-to-text option is **Faster-Whisper**, running locally, while the main LLM may use NVIDIA NIM.

The frontend should not need to know which AI model is used internally.

---

## 17. Planned Backend Architecture

The eventual backend will use:

- FastAPI
- Python
- Pydantic
- PostgreSQL
- JWT authentication
- NVIDIA NIM
- AI orchestration
- Emergency pre-screening
- Structured output validation
- Function/tool calling where appropriate
- Real-time notifications using SSE/WebSockets

Conceptually:

    React + TypeScript
            ↓
        FastAPI API
            ↓
    Authentication / Routing
            ↓
       Core Services
       /     |      \
      AI   Hospital  Notifications
       |      |          |
      NIM  PostgreSQL   SSE

The frontend should therefore use an API/service layer instead of hard-coding business logic into components.

---

## 18. Frontend Technology Requirements

Use:

- React
- TypeScript
- Tailwind CSS
- React Router
- Reusable components
- Service/API layer
- Typed data models/interfaces
- Responsive layouts

Suggested structure:

    src/
    ├── components/
    ├── layouts/
    ├── pages/
    │   ├── patient/
    │   ├── doctor/
    │   └── hospital-admin/
    ├── routes/
    ├── services/
    ├── types/
    ├── hooks/
    ├── data/
    └── utils/

Keep mock data separate from UI components.

The service layer should make it easy to replace mock data with FastAPI API calls later.

---

## 19. Design Direction

The UI should feel like a **real healthcare application**, not a futuristic AI website.

### Desired style

- Professional
- Clean
- Trustworthy
- Simple
- Slightly retro-modern
- Healthcare-focused
- Highly readable
- Suitable for college exhibition/project demonstration

### Color direction

Use:

- Warm off-white / cream
- Deep navy
- Charcoal
- Muted teal
- Muted green
- Muted red for emergency states

### Avoid

- Neon colors
- Excessive gradients
- Glassmorphism
- Glowing cards
- AI robots
- Brain graphics
- Sci-fi interfaces
- Excessive animations
- Huge decorative elements
- Overly rounded UI everywhere

The design should prioritize usability and information hierarchy.

---

## 20. Responsiveness

The application must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Patient screens should be especially mobile-friendly.

Doctor and Hospital Admin dashboards should be optimized for desktop/tablet.

---

## 21. Main Exhibition Demonstration

The main demonstration should be:

    Patient logs in
          ↓
    Opens AI Health Assistant
          ↓
    Speaks or types symptoms
          ↓
    Voice is transcribed if voice is used
          ↓
    Emergency pre-screening
          ↓
    Medical context considered
          ↓
    AI-assisted analysis
          ↓
    Severity displayed
          ↓
    Healthcare pathway recommended
          ↓
    Suitable hospital displayed
          ↓
    Emergency/care request created
          ↓
    Hospital Admin receives request
          ↓
    Hospital accepts request
          ↓
    Doctor is notified
          ↓
    Patient sees status

### Main emergency demo

Patient says:

> My father suddenly became unconscious.

Expected conceptual flow:

    Voice
      ↓
    Speech-to-text
      ↓
    Emergency pre-screening
      ↓
    Emergency state
      ↓
    Emergency request
      ↓
    Suitable hospital
      ↓
    Hospital notification
      ↓
    Doctor notification
      ↓
    Status updates

---

## 22. Current Scope vs Future Scope

### Current V1

Focus on:

- Authentication
- Patient profile
- Medical history
- Text symptom input
- Voice input
- AI-assisted assessment
- Severity
- Healthcare recommendation
- Suitable hospital recommendation
- Emergency SOS
- Hospital Admin
- Doctor Dashboard
- Patient Dashboard
- Notifications
- AI patient summary

### Future Scope

Do NOT implement these as current V1 unless explicitly requested:

- Online payments
- Digital prescriptions
- Pharmacy integration
- Laboratory integration
- Telemedicine
- Insurance integration
- Ambulance tracking
- Wearable integration
- IoT monitoring
- Predictive hospital analytics
- Large-scale multi-hospital analytics
- Blood bank integration
- Public health analytics

These are future expansion possibilities.

---

## 23. Important Development Rules for Antigravity

1. First understand the project architecture before implementing.
2. Do not turn MediNexus into a generic chatbot.
3. Do not turn it into only a hospital management system.
4. Keep Patient, Doctor and Hospital Admin portals distinct.
5. Hospital Admin must be hospital-specific.
6. Do not expose API keys in frontend code.
7. Keep AI results clearly labelled as AI-assisted.
8. Do not make definitive medical diagnoses.
9. Keep mock data separate from UI.
10. Create an API/service abstraction for future FastAPI integration.
11. Do not invent unnecessary features.
12. Do not remove required features.
13. Prefer reusable components.
14. Keep the UI responsive.
15. Prioritize readability over decoration.
16. Build V1 before adding future-scope features.

---

## 24. What Antigravity Should Understand About the AI

The LLM is NOT the entire system.

The correct conceptual separation is:

**Speech-to-Text**
→ understands voice

**Emergency Interceptor**
→ fast deterministic pre-screening for obvious emergency phrases

**LLM**
→ understands natural language and provides AI-assisted analysis/recommendations

**Backend**
→ validates AI output and executes actual operations

**Database**
→ stores patient/hospital/doctor information

**Frontend**
→ presents information and collects user input

This separation is important to the project's architecture.

---

## 25. Personal Project Role

The primary technical responsibility for the System Architecture & AI/LLM Pipeline role includes:

- System architecture
- FastAPI integration
- NVIDIA NIM integration
- Prompt engineering
- Structured AI output
- Emergency pre-screening
- LLM orchestration
- Function/tool calling
- AI/backend separation
- Integration between frontend, AI engine and backend

The AI pipeline should therefore be designed as an independent module that can later be connected to FastAPI.

---

## 26. Final Product Concept

MediNexus AI should ultimately feel like one connected ecosystem:

        PATIENT
           │
           │ symptoms / voice
           ↓
      MEDINEXUS AI
           │
     ┌─────┼─────┐
     ↓     ↓     ↓
    AI   Hospital Doctor
     │     │     │
     └─────┼─────┘
           ↓
     Connected Care

The central message of the project is:

> **Healthcare, connected.**

The objective is not to replace doctors.

The objective is to make the healthcare workflow more connected, responsive, context-aware and accessible.
