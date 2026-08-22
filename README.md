# MediNexus AI 

## Local Development Setup

This repository utilizes Docker Compose to orchestrate our microservices. Do not install Node or Python on your local machines. Docker will handle all dependencies.

### 1. Prerequisites
* Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and ensure the engine is running.
* Install Git.

### 2. Booting the Ecosystem
Clone the repository and spin up the infrastructure:
```bash
git clone [https://github.com/YOUR_USERNAME/MediNexus-AI.git](https://github.com/YOUR_USERNAME/MediNexus-AI.git)
cd MediNexus-AI
docker-compose up --build
```

### 3. Service Access

* #### Frontend (React): 
    * http://localhost:3001
* #### Backend (FastAPI): 
    * http://localhost:8000
* #### Database (PostgreSQL):
    * Port 5432    

### 4. Git Workflow (Strict)
1. Do not push directly to main.
2. Create a branch for your feature: 

```bash  
git checkout -b feature/your-name-task
```