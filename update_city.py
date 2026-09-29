import subprocess
subprocess.run(['docker', 'exec', '-i', 'medinexus_db', 'psql', '-U', 'admin', '-d', 'medinexus', '-c', 'UPDATE patients SET history = \'{"city": "Bhopal"}\' WHERE id = \'p-demo-ananya\';'])
