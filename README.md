# MediNexus AI: An AI-Powered Unified Smart Healthcare Ecosystem

**Healthcare, connected.**

MediNexus AI is a comprehensive healthcare ecosystem designed to connect patients, doctors, and multiple hospitals through an intelligent, AI-assisted workflow. It streamlines symptom analysis, urgency assessment, and emergency routing to ensure patients receive the right care at the right time.

## 🌟 Core Features

- **AI-Assisted Triage:** Analyzes patient symptoms (text or voice) to determine severity and recommend healthcare pathways.
- **Multi-Hospital Network:** Distinct portals for individual hospitals to manage incoming requests, bed availability, and staff.
- **Unified Portals:** Tailored experiences for Patients, Doctors, and Hospital Administrators.
- **Emergency SOS & Routing:** Swift identification of critical cases with automated routing to the nearest suitable hospital.

---

## 🏗️ Architecture & Microservices

This project is built using a modern microservices architecture:

- **Patient Frontend (React/Vite):** User-facing application for patients.
- **Admin/Doctor Frontend (React/Vite):** Portal for hospital staff and administrators.
- **Backend API (FastAPI):** Core API handling business logic and routing.
- **AI Engine (Python):** Dedicated service for NLP, symptom assessment, and triage.
- **Database (PostgreSQL):** Relational database managing users, hospitals, and medical records.

---

## 🚀 Local Development Setup

This repository utilizes Docker Compose to orchestrate our microservices. **Do not install Node or Python on your local machines.** Docker will handle all dependencies.

### 1. Prerequisites
* Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and ensure the engine is running.
* Install Git.

### 2. Booting the Ecosystem
Clone the repository and spin up the infrastructure:
```bash
git clone https://github.com/YOUR_USERNAME/MediNexus-AI.git
cd MediNexus-AI
docker-compose up --build
```

### 3. Service Access

Once the containers are running, you can access the services at the following local URLs:

* **Patient Frontend (React):** [http://localhost:3000](http://localhost:3000)
* **Admin/Doctor Portal (React):** [http://localhost:3001](http://localhost:3001)
* **Backend API (FastAPI):** [http://localhost:8000](http://localhost:8000)
* **AI Engine:** [http://localhost:8080](http://localhost:8080)
* **Database (PostgreSQL):** Port `5432`

---

## 🔒 Git Workflow (Strict)
1. **Do not push directly to main.**
2. Create a branch for your feature: 
```bash  
git checkout -b feature/your-name-task
```
3. Submit a Pull Request for review before merging.