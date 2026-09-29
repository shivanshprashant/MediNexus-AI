import requests
import json

url = "http://localhost:8000/api/hospitals/register"
payload = {
  "hospitalCode": "HSP-005",
  "name": "Dr. Morepen Clinic",
  "type": "Primary Care Clinic",
  "phone": "+91 755 123 4567",
  "emergencyPhone": "+91 755 123 4567",
  "ambulancePhone": "+91 755 123 4567",
  "email": "info@morepenvit.com",
  "website": "",
  "establishedYear": 2020,
  "employeeCount": 20,
  "description": "Dr. Morepen Clinic located at VIT Bhopal University.",
  "address": "VIT Bhopal University, Kothri Kalan, Ashta",
  "city": "Bhopal",
  "state": "Madhya Pradesh",
  "pincode": "466114",
  "adminName": "Admin Morepen",
  "adminEmail": "admin@morepenvit.com",
  "adminPassword": "password123"
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, headers=headers, json=payload)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
