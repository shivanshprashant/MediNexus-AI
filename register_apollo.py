import requests
import json

url = "http://localhost:8000/api/hospitals/register"
payload = {
  "hospitalCode": "HSP-APOLLO",
  "name": "Apollo Hospital",
  "type": "Multispecialty Hospital",
  "phone": "+91 800 123 4567",
  "emergencyPhone": "+91 800 123 4567",
  "ambulancePhone": "+91 800 123 4567",
  "email": "contact@apolloashta.com",
  "website": "https://www.apollohospitals.com",
  "establishedYear": 2010,
  "employeeCount": 150,
  "description": "Apollo Hospital in Ashta, providing world-class multispecialty care.",
  "address": "Kannod Road, Ashta",
  "city": "Ashta, Bhopal",
  "state": "Madhya Pradesh",
  "pincode": "466116",
  "adminName": "Admin Apollo",
  "adminEmail": "admin@apolloashta.com",
  "adminPassword": "password123"
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, headers=headers, json=payload)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
