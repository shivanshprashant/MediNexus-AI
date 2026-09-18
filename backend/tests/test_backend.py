import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add backend root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

class TestBackendEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_root_and_health(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("Operational", res.json().get("status", ""))

        health_res = self.client.get("/health")
        self.assertEqual(health_res.status_code, 200)
        self.assertEqual(health_res.json().get("status"), "HEALTHY")

    def test_02_auth_patient_login(self):
        payload = {
            "email": "ananya.sharma@example.com",
            "password": "password123",
            "role": "patient"
        }
        res = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("access_token", body)
        self.assertEqual(body.get("role"), "patient")

    def test_03_auth_hospital_admin_login(self):
        payload = {
            "hospital_code": "HSP-001",
            "email": "admin@citycare.org",
            "password": "adminpassword"
        }
        res = self.client.post("/api/auth/login/hospital-admin", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("access_token", body)
        self.assertEqual(body.get("role"), "hospital_admin")
        self.assertEqual(body.get("hospital_id"), "hsp-001")

    def test_04_patient_list_and_detail(self):
        res = self.client.get("/api/patients")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        detail_res = self.client.get("/api/patients/pt-demo-01")
        self.assertEqual(detail_res.status_code, 200)
        patient_data = detail_res.json()
        self.assertTrue(patient_data.get("id") in ["pt-demo-01", "p1", "p-demo-ananya"])

    def test_05_doctor_list_and_status(self):
        res = self.client.get("/api/doctors?hospital_id=hsp-001")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        status_res = self.client.put("/api/doctors/doc-001/status?availability=ON%20DUTY")
        self.assertEqual(status_res.status_code, 200)

    def test_06_hospital_beds_and_occupancy(self):
        res = self.client.get("/api/hospitals/hsp-001/beds")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        bed_res = self.client.put("/api/hospitals/hsp-001/beds/b-cardio-1?is_occupied=true")
        self.assertEqual(bed_res.status_code, 200)

    def test_07_emergency_sos_flow(self):
        sos_payload = {
            "mode": "ambulance",
            "target_hospital_id": "hsp-001",
            "complaint": "Acute onset shortness of breath and chest pressure"
        }
        res = self.client.post("/api/emergency/sos", json=sos_payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("id", body)
        self.assertEqual(body.get("status"), "HOSPITAL NOTIFIED")
        self.assertIn("emergencyContact", body)
        self.assertIn("ambulanceContact", body)

        reqs_res = self.client.get("/api/emergency/requests?hospital_id=hsp-001")
        self.assertEqual(reqs_res.status_code, 200)

    def test_08_appointment_workflow(self):
        booking_payload = {
            "doctor_id": "doc-001",
            "date": "2026-09-15",
            "time": "04:00 PM",
            "modality": "In-person",
            "reason": "Follow-up Cardiology Evaluation"
        }
        res = self.client.post("/api/appointments", json=booking_payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("id", body)
        self.assertEqual(body.get("status"), "UPCOMING")

        list_res = self.client.get("/api/appointments")
        self.assertEqual(list_res.status_code, 200)

    def test_09_ai_symptom_analysis_contract(self):
        payload = {
            "symptom_text": "Sudden sharp chest pain with dizziness",
            "medical_context": "Asthma, Allergy to Penicillin"
        }
        res = self.client.post("/api/ai/symptom-analysis", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("severity", body)
        self.assertIn("recommendation", body)
        self.assertIn("ai_summary", body)

    def test_10_notifications(self):
        res = self.client.get("/api/notifications")
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

        read_res = self.client.put("/api/notifications/notif-001/read")
        self.assertEqual(read_res.status_code, 200)
        self.assertEqual(read_res.json().get("unread"), False)

    def test_11_patient_profile_update(self):
        update_payload = {
            "allergies": "Penicillin, Sulfa Drugs, Dust",
            "meds": "Lisinopril 10mg daily",
            "history": "Age: 29, Gender: Female, City: New Delhi",
            "name": "Ananya Sharma"
        }
        res = self.client.put("/api/patients/me", json=update_payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body.get("allergies"), "Penicillin, Sulfa Drugs, Dust")

        get_res = self.client.get("/api/patients/me")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json().get("allergies"), "Penicillin, Sulfa Drugs, Dust")

    def test_12_cors_preflight_and_registration(self):
        # Preflight CORS OPTIONS request
        opts_res = self.client.options(
            "/api/auth/register/patient",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type"
            }
        )
        self.assertEqual(opts_res.status_code, 200)
        self.assertEqual(opts_res.headers.get("access-control-allow-origin"), "http://localhost:3000")
        self.assertEqual(opts_res.headers.get("access-control-allow-credentials"), "true")

        # Registration contract test
        reg_payload = {
            "full_name": "Priya Verma",
            "email": "priya.verma@example.com",
            "phone": "+91 98765 43210",
            "password": "password123",
            "age": 28,
            "gender": "Female",
            "blood": "A+",
            "allergies": "Dust",
            "meds": "None",
            "history": "None"
        }
        reg_res = self.client.post("/api/auth/register/patient", json=reg_payload)
        self.assertEqual(reg_res.status_code, 200)
        reg_body = reg_res.json()
        self.assertIn("access_token", reg_body)
        token = reg_body["access_token"]

        # GET /api/patients/me with Bearer token
        me_res = self.client.get(
            "/api/patients/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(me_res.status_code, 200)

        # PATCH /api/patients/me with Bearer token
        patch_res = self.client.patch(
            "/api/patients/me",
            json={"allergies": "Dust, Pollen"},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json().get("allergies"), "Dust, Pollen")

if __name__ == "__main__":
    unittest.main()
