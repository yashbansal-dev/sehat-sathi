import app.main
print("App imported and tables created successfully!")
from app.database import SessionLocal
from app.data.synthetic_samples import seed_synthetic_patient_data
db = SessionLocal()
u = seed_synthetic_patient_data(db)
print(f"Seed complete: User={u.full_name}, Email={u.email}")
db.close()
