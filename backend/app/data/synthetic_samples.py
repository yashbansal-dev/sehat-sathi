import os
import uuid
import datetime
from sqlalchemy.orm import Session
from app.config import settings
from app.models.all_models import (
    User,
    PatientProfile,
    MedicalDocument,
    DocumentProcessingJob,
    MedicalTimelineEvent,
    MedicationRecord,
    LabResultRecord,
    DiagnosisRecord,
    UncertaintyRecord,
    AuditEvent
)
from app.services.auth_service import hash_password

def seed_synthetic_patient_data(db: Session) -> User:
    """
    Seeds a realistic synthetic patient (Rajesh Sharma, 54M)
    demonstrating:
    - Multiple medical records (Cardiology Consult, Comprehensive Lab Panel, Discharge Summary, Follow-up Prescription)
    - Chronic conditions (Type 2 Diabetes, Essential Hypertension, Dyslipidemia)
    - Active vs Historical medications
    - Abnormal lab trends (HbA1c 7.8%, Fasting Blood Sugar 142 mg/dL, Total Cholesterol 215 mg/dL)
    - OCR uncertainties (dosage ambiguity, missing stamp date)
    - Clinical questions and source traceable facts
    """
    user = db.query(User).filter(User.email == "patient.demo@sehatsathi.ai").first()
    if user:
        return user

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email="patient.demo@sehatsathi.ai",
        hashed_password=hash_password("DemoPassword2026!"),
        full_name="Rajesh Sharma",
        role="patient",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=90)
    )
    db.add(user)

    profile = PatientProfile(
        id=str(uuid.uuid4()),
        user_id=user_id,
        date_of_birth="1972-04-14",
        gender="Male",
        blood_group="B+",
        emergency_contact="+91 98765 43210 (Pooja Sharma - Spouse)",
        known_allergies="No known drug allergies (NKDA) explicitly recorded; Penicillin sensitivity noted in 2018 verbal history",
        chronic_conditions="Type 2 Diabetes Mellitus (diagnosed 2018), Essential Hypertension (diagnosed 2020), Dyslipidemia"
    )
    db.add(profile)

    # Synthetic Document 1: Comprehensive Metabolic & Lipid Lab Report
    doc1_id = str(uuid.uuid4())
    doc1 = MedicalDocument(
        id=doc1_id,
        user_id=user_id,
        filename="metabolic_lipid_panel_oct2026.pdf",
        original_filename="Apex_Diagnostics_Metabolic_Lipid_Panel_Oct2026.pdf",
        file_type="application/pdf",
        file_size=245120,
        storage_path=os.path.join(settings.SYNTHETIC_DIR, "Apex_Diagnostics_Metabolic_Lipid_Panel_Oct2026.pdf"),
        category="Lab Report",
        document_date="2026-10-02",
        facility_name="Apex Diagnostic & Pathology Center, New Delhi",
        doctor_name="Dr. Sunita Rao, MD (Pathology)",
        status="completed",
        ocr_text="""APEX DIAGNOSTIC & PATHOLOGY LABS
Patient Name: Rajesh Sharma | Age: 54 Yrs | Gender: Male
Ref By: Dr. Arvind Mehta | Date: 02-Oct-2026
----------------------------------------------------------------------
TEST NAME                     RESULT       UNIT      REFERENCE RANGE
----------------------------------------------------------------------
HbA1c (Glycated Hemoglobin)   7.8 [High]   %         4.0 - 5.6
Fasting Blood Sugar (FBS)     142 [High]   mg/dL     70 - 99
Post Prandial Sugar (PPBS)    205 [High]   mg/dL     < 140
Serum Creatinine              1.05         mg/dL     0.7 - 1.3
Total Cholesterol             218 [High]   mg/dL     125 - 200
Triglycerides                 185 [High]   mg/dL     < 150
HDL Cholesterol               38 [Low]     mg/dL     > 40
LDL Cholesterol               132 [High]   mg/dL     < 100
Hemoglobin                    14.6         g/dL      13.0 - 17.0
----------------------------------------------------------------------
Clinical Interpretation: Suboptimal glycemic and lipid control under current therapy.""",
        ocr_confidence=0.98,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=10)
    )
    db.add(doc1)

    # Synthetic Document 2: Inpatient Discharge Summary
    doc2_id = str(uuid.uuid4())
    doc2 = MedicalDocument(
        id=doc2_id,
        user_id=user_id,
        filename="inpatient_discharge_summary_sep2026.pdf",
        original_filename="MaxCare_Hospital_Discharge_Summary_Sep2026.pdf",
        file_type="application/pdf",
        file_size=382400,
        storage_path=os.path.join(settings.SYNTHETIC_DIR, "MaxCare_Hospital_Discharge_Summary_Sep2026.pdf"),
        category="Discharge Summary",
        document_date="2026-09-18",
        facility_name="MaxCare Super Specialty Hospital",
        doctor_name="Dr. Arvind Mehta, DM (Cardiology)",
        status="completed",
        ocr_text="""MAXCARE SUPER SPECIALTY HOSPITAL - DISCHARGE SUMMARY
IP No: MC-90412 | Admission: 15-Sep-2026 | Discharge: 18-Sep-2026
Patient: Rajesh Sharma | 54 Y / Male
Primary Diagnosis: Hypertensive Urgency, Uncontrolled Type 2 Diabetes Mellitus
Clinical Course: Patient presented with severe headache, palpitations, and BP 178/104 mmHg.
Managed with IV Labetalol, oral antihypertensives, and glycemic regulation.
ECG: Sinus rhythm, Left Ventricular Hypertrophy (LVH). 2D Echo: EF 58%, normal wall motion.
Discharge Advice Medications:
1. Telmisartan 40mg - 1 tab Once daily morning
2. Amlodipine 5mg - 1 tab Once daily bedtime
3. Metformin 500mg - 1 tab Twice daily after meals
4. Atorvastatin 20mg - 1 tab At bedtime
Follow up in Cardiology OPD after 3 weeks with fresh Lipid Profile and HbA1c.""",
        ocr_confidence=0.97,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=24)
    )
    db.add(doc2)

    # Synthetic Document 3: Outpatient Prescription
    doc3_id = str(uuid.uuid4())
    doc3 = MedicalDocument(
        id=doc3_id,
        user_id=user_id,
        filename="cardio_consultation_prescription_oct2026.pdf",
        original_filename="Dr_Mehta_Cardiology_FollowUp_Oct2026.pdf",
        file_type="application/pdf",
        file_size=194300,
        storage_path=os.path.join(settings.SYNTHETIC_DIR, "Dr_Mehta_Cardiology_FollowUp_Oct2026.pdf"),
        category="Prescription",
        document_date="2026-10-05",
        facility_name="Mehta Heart & Vascular Clinic",
        doctor_name="Dr. Arvind Mehta, DM (Cardiology)",
        status="completed",
        ocr_text="""MEHTA HEART & VASCULAR CLINIC
Reg No: MH-3391 | Date: 05-Oct-2026
Patient: Rajesh Sharma | BP: 134/84 mmHg | Pulse: 76 bpm | Weight: 79 kg
Rx (Current Regimen Adjusted):
1. Tab. Telmisartan 40mg - 1-0-0 (OD after breakfast)
2. Tab. Amlodipine 5mg - 0-0-1 (Bedtime)
3. Tab. Metformin 500mg - 1-0-1 (BD after breakfast and dinner)
4. Tab. Atorvastatin 20mg - 0-0-1 (Night)
5. Tab. Pantoprazole 40mg - 1-0-0 (Empty stomach 30 mins before breakfast for 14 days)
Advice: Moderate aerobic exercise 30 min/day, reduce dietary sodium, repeat fasting blood sugar.""",
        ocr_confidence=0.96,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=7)
    )
    db.add(doc3)

    # Synthetic Document 4: Historical Prescription (Acute episode last year)
    doc4_id = str(uuid.uuid4())
    doc4 = MedicalDocument(
        id=doc4_id,
        user_id=user_id,
        filename="gastro_prescription_nov2025.pdf",
        original_filename="City_Clinic_Gastroenteritis_Rx_Nov2025.pdf",
        file_type="application/pdf",
        file_size=165200,
        storage_path=os.path.join(settings.SYNTHETIC_DIR, "City_Clinic_Gastroenteritis_Rx_Nov2025.pdf"),
        category="Prescription",
        document_date="2025-11-12",
        facility_name="City Community Healthcare Clinic",
        doctor_name="Dr. K. S. Verma, MBBS",
        status="completed",
        ocr_text="""CITY COMMUNITY HEALTHCARE CLINIC
Date: 12-Nov-2025 | Patient: Rajesh Sharma
Diagnosis: Acute Gastroenteritis
Rx:
1. Cap. Amoxicillin 500mg - 1-0-1 for 5 days [COMPLETED]
2. Tab. Paracetamol 650mg - SOS for fever
3. ORS sachets - 2 liters/day
Review if vomiting persists.""",
        ocr_confidence=0.94,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=330)
    )
    db.add(doc4)

    # 4. Timeline Events
    events_data = [
        ("2026-10-05", "Prescription", "Cardiology Follow-Up & Medication Revision", "Mehta Heart Clinic", "BP stabilized at 134/84 mmHg. Telmisartan, Amlodipine, Metformin, and Atorvastatin continued with Pantoprazole added.", doc3_id, "verified"),
        ("2026-10-02", "Lab Test", "Comprehensive Metabolic & Lipid Profile", "Apex Diagnostic Labs", "HbA1c 7.8% (elevated), FBS 142 mg/dL, Total Cholesterol 218 mg/dL.", doc1_id, "verified"),
        ("2026-09-18", "Discharge", "Hospital Discharge - Hypertensive Urgency", "MaxCare Super Specialty Hospital", "Discharged in stable condition following 3-day inpatient stabilization for hypertensive urgency (BP 178/104).", doc2_id, "verified"),
        ("2026-09-15", "Hospitalization", "Emergency Admission for Hypertensive Crisis", "MaxCare Emergency Ward", "Admitted with headache, chest discomfort, and elevated blood pressure.", doc2_id, "verified"),
        ("2025-11-12", "Prescription", "Acute Gastroenteritis Outpatient Encounter", "City Community Clinic", "Prescribed short course Amoxicillin 500mg and Paracetamol. Historical resolved episode.", doc4_id, "verified")
    ]
    for dt, etype, title, fac, desc, did, vstat in events_data:
        ev = MedicalTimelineEvent(
            id=str(uuid.uuid4()),
            user_id=user_id,
            document_id=did,
            event_date=dt,
            event_type=etype,
            title=title,
            description=desc,
            facility_or_doctor=fac,
            source_page=1,
            source_snippet=desc,
            verification_status=vstat,
            created_at=datetime.datetime.utcnow()
        )
        db.add(ev)

    # 5. Medications (Active vs Historical)
    meds_data = [
        ("Telmisartan", "40mg", "Once daily morning", "Ongoing", True, "active", "2026-10-05", "Essential Hypertension", doc3_id, "verified"),
        ("Amlodipine", "5mg", "Once daily at bedtime", "Ongoing", True, "active", "2026-10-05", "Essential Hypertension", doc3_id, "verified"),
        ("Metformin", "500mg", "Twice daily after meals", "Ongoing", True, "active", "2026-10-05", "Type 2 Diabetes Mellitus", doc3_id, "verified"),
        ("Atorvastatin", "20mg", "Once daily at bedtime", "Ongoing", True, "active", "2026-10-05", "Dyslipidemia", doc3_id, "verified"),
        ("Pantoprazole", "40mg", "Once daily 30m before breakfast", "14 days", True, "active", "2026-10-05", "Gastric protection", doc3_id, "verified"),
        ("Amoxicillin", "500mg", "Twice daily for 5 days", "Completed (Nov 2025)", False, "historical", "2025-11-12", "Bacterial Gastroenteritis", doc4_id, "verified"),
        ("Paracetamol", "650mg", "As needed (SOS)", "Historical / PRN", False, "historical", "2025-11-12", "Fever relief", doc4_id, "verified")
    ]
    for mname, dose, freq, dur, is_curr, stat, pdate, ind, did, vstat in medss_data if 'medss_data' in locals() else meds_data:
        mrec = MedicationRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            document_id=did,
            medicine_name=mname,
            dosage=dose,
            frequency=freq,
            duration=dur,
            is_current=is_curr,
            status=stat,
            prescribed_date=pdate,
            indication=ind,
            source_page=1,
            source_snippet=f"Prescribed: {mname} {dose} {freq}",
            verification_status=vstat
        )
        db.add(mrec)

    # 6. Lab Results (with numeric values for Recharts trends)
    labs_data = [
        ("HbA1c", "7.8 %", 7.8, "%", "4.0 - 5.6", True, "2026-10-02", doc1_id),
        ("Fasting Blood Sugar", "142 mg/dL", 142.0, "mg/dL", "70 - 99", True, "2026-10-02", doc1_id),
        ("Post Prandial Sugar", "205 mg/dL", 205.0, "mg/dL", "< 140", True, "2026-10-02", doc1_id),
        ("Total Cholesterol", "218 mg/dL", 218.0, "mg/dL", "125 - 200", True, "2026-10-02", doc1_id),
        ("Triglycerides", "185 mg/dL", 185.0, "mg/dL", "< 150", True, "2026-10-02", doc1_id),
        ("HDL Cholesterol", "38 mg/dL", 38.0, "mg/dL", "> 40", True, "2026-10-02", doc1_id),
        ("LDL Cholesterol", "132 mg/dL", 132.0, "mg/dL", "< 100", True, "2026-10-02", doc1_id),
        ("Serum Creatinine", "1.05 mg/dL", 1.05, "mg/dL", "0.7 - 1.3", False, "2026-10-02", doc1_id),
        ("Hemoglobin", "14.6 g/dL", 14.6, "g/dL", "13.0 - 17.0", False, "2026-10-02", doc1_id),
        ("Blood Pressure", "134/84 mmHg", 134.0, "mmHg", "120/80", False, "2026-10-05", doc3_id),
        ("Blood Pressure", "178/104 mmHg", 178.0, "mmHg", "120/80", True, "2026-09-15", doc2_id)
    ]
    for tname, rval, numval, unit, rrange, is_ab, tdate, did in labs_data:
        lrec = LabResultRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            document_id=did,
            test_name=tname,
            result_value=rval,
            numeric_value=numval,
            unit=unit,
            reference_range=rrange,
            is_abnormal=is_ab,
            test_date=tdate,
            source_page=1,
            source_snippet=f"{tname}: {rval} (Reference range: {rrange})",
            verification_status="verified"
        )
        db.add(lrec)

    # 7. Diagnoses
    diag_data = [
        ("Type 2 Diabetes Mellitus", "2018-05-10", True, "active", doc1_id),
        ("Essential Hypertension", "2020-03-22", True, "active", doc2_id),
        ("Dyslipidemia", "2026-10-02", True, "active", doc1_id),
        ("Acute Gastroenteritis", "2025-11-12", False, "resolved", doc4_id)
    ]
    for cname, ddate, is_chr, dstat, did in diag_data:
        drec = DiagnosisRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            document_id=did,
            condition_name=cname,
            diagnosed_date=ddate,
            is_chronic=is_chr,
            status=dstat,
            source_page=1,
            source_snippet=f"Confirmed clinical condition: {cname}",
            verification_status="verified"
        )
        db.add(drec)

    # 8. Flagged Uncertainties (Ready for the Verification Center!)
    unc1 = UncertaintyRecord(
        id=str(uuid.uuid4()),
        user_id=user_id,
        document_id=doc3_id,
        entity_type="medication",
        field_name="Pantoprazole duration",
        detected_value="14 days (handwritten)",
        reason="Faded handwriting on prescription slip suggests 14 days or 30 days. Verify with clinician.",
        suggested_options=["14 days", "30 days", "Ongoing"],
        resolved=False
    )
    unc2 = UncertaintyRecord(
        id=str(uuid.uuid4()),
        user_id=user_id,
        document_id=doc1_id,
        entity_type="lab_result",
        field_name="Fasting status for lipid profile",
        detected_value="10 hours stated by patient",
        reason="Apex lab report did not print explicit fasting hours timestamp.",
        suggested_options=["10 hours fasting", "12 hours fasting", "Random non-fasting"],
        resolved=False
    )
    db.add(unc1)
    db.add(unc2)

    # 9. Audit event
    db.add(AuditEvent(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action="synthetic_seed",
        entity_type="patient_history",
        entity_id=user_id,
        details={"message": "Seeded synthetic demonstration patient record for Rajesh Sharma"}
    ))

    db.commit()
    return user
