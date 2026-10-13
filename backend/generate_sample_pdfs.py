import os
import shutil
import pymupdf as fitz

os.makedirs('sample_medical_documents', exist_ok=True)
os.makedirs('backend/storage/synthetic', exist_ok=True)

def create_pdf(filepath, title, header_info, sections):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4 format
    
    # Header Banner
    page.draw_rect(fitz.Rect(36, 36, 559, 100), color=(0.05, 0.58, 0.53), fill=(0.94, 0.98, 0.98), width=1.5)
    page.insert_text(fitz.Point(50, 65), title, fontsize=15, fontname='helv', color=(0.05, 0.45, 0.42))
    
    y = 85
    for h in header_info:
        page.insert_text(fitz.Point(50, y), h, fontsize=9, fontname='helv', color=(0.3, 0.35, 0.4))
        y += 12

    # Draw separator
    page.draw_line(fitz.Point(36, 115), fitz.Point(559, 115), color=(0.8, 0.85, 0.88), width=1)
    
    curr_y = 135
    for sec_title, lines in sections:
        page.draw_rect(fitz.Rect(36, curr_y - 12, 559, curr_y + 4), color=(0.9, 0.92, 0.95), fill=(0.95, 0.96, 0.98), width=0.5)
        page.insert_text(fitz.Point(42, curr_y), sec_title.upper(), fontsize=10, fontname='helv', color=(0.1, 0.15, 0.2))
        curr_y += 20
        
        for line in lines:
            if isinstance(line, tuple):
                page.insert_text(fitz.Point(45, curr_y), line[0], fontsize=9, fontname='helv', color=(0.15, 0.2, 0.25))
                page.insert_text(fitz.Point(260, curr_y), line[1], fontsize=9, fontname='helv', color=(0.1, 0.15, 0.2))
                if len(line) > 2:
                    page.insert_text(fitz.Point(370, curr_y), line[2], fontsize=9, fontname='helv', color=(0.35, 0.4, 0.45))
                if len(line) > 3:
                    page.insert_text(fitz.Point(450, curr_y), line[3], fontsize=9, fontname='helv', color=(0.35, 0.4, 0.45))
            else:
                page.insert_text(fitz.Point(45, curr_y), line, fontsize=9, fontname='helv', color=(0.25, 0.3, 0.35))
            curr_y += 15
        curr_y += 12
        
    # Footer disclaimer
    page.draw_line(fitz.Point(36, 790), fitz.Point(559, 790), color=(0.85, 0.88, 0.9), width=0.5)
    page.insert_text(fitz.Point(36, 805), 'CONFIDENTIAL MEDICAL RECORD • SEHAT SATHI OPEN SOURCE CLINICAL TEST FIXTURE', fontsize=8, fontname='helv', color=(0.5, 0.55, 0.6))
    page.insert_text(fitz.Point(36, 818), 'This synthetic document is designed for personal health record AI verification and evaluation.', fontsize=7.5, fontname='helv', color=(0.6, 0.65, 0.7))
    
    doc.save(filepath)
    doc.close()

# 1. Cardiology Consultation & Prescription
create_pdf(
    'sample_medical_documents/1_Prescription_Dr_Mehta_Cardiology_Oct2026.pdf',
    'MAXCARE HEART INSTITUTE — OUTPATIENT CLINICAL RECORD',
    ['Consultant: Dr. Arvind Mehta, MD, DM (Cardiology) | Reg No: DMC-38491', 'Patient: Rajesh Sharma | Age/Gender: 54 Yrs / Male | Date: 12-Oct-2026'],
    [
        ('Clinical Diagnosis & Chronic Conditions', [
            '• Essential Hypertension (Diagnosed 2020) — Currently grade 1',
            '• Type 2 Diabetes Mellitus (Diagnosed 2018) — Suboptimal glycemic regulation',
            '• Dyslipidemia (Elevated LDL & Total Cholesterol)'
        ]),
        ('Documented Drug Allergies', [
            '⚠️ Penicillin Allergy: Patient experienced urticarial cutaneous rash in 2018. Avoid beta-lactams.'
        ]),
        ('Prescription & Medication Orders', [
            ('Medication', 'Dosage & Frequency', 'Duration', 'Instructions'),
            ('Tab Telmisartan', '40 mg OD (Morning)', '90 Days', 'Take with water after breakfast'),
            ('Tab Metformin SR', '500 mg BD (Twice daily)', '90 Days', 'Take with meals morning & evening'),
            ('Tab Atorvastatin', '20 mg HS (Bedtime)', '90 Days', 'Take at bedtime for lipid reduction'),
            ('Tab Pantoprazole', '40 mg OD (Faded entry)', '14 Days', 'Empty stomach in morning')
        ]),
        ('Physician Advice & Follow-Up', [
            '1. Maintain daily blood pressure monitoring target < 130/80 mmHg.',
            '2. Restrict dietary sodium (< 2g/day) and refined carbohydrates.',
            '3. Repeat HbA1c, Fasting Blood Sugar, and Lipid Profile in 3 months.'
        ])
    ]
)

# 2. Lab Report (Nov 2025 Baseline)
create_pdf(
    'sample_medical_documents/2_Lab_Report_Metropolis_Metabolic_Nov2025.pdf',
    'METROPOLIS DIAGNOSTICS & CLINICAL LABORATORY',
    ['Accreditation: NABL / CAP Certified | Lab Ref: MET-2025-94812', 'Patient: Rajesh Sharma | Age: 53 Yrs | Date of Collection: 12-Nov-2025'],
    [
        ('Glycemic & Metabolic Profile', [
            ('Test Name', 'Recorded Result', 'Unit', 'Reference Range'),
            ('HbA1c (Glycated Hemoglobin)', '7.2 [High]', '%', '< 5.7 (Normal: 4.0-5.6)'),
            ('Fasting Blood Glucose (FBS)', '138 [High]', 'mg/dL', '70 - 99'),
            ('Post Prandial Glucose (PPBS)', '192 [High]', 'mg/dL', '< 140'),
            ('Serum Creatinine', '1.05', 'mg/dL', '0.70 - 1.20')
        ]),
        ('Lipid Profile', [
            ('Test Name', 'Recorded Result', 'Unit', 'Reference Range'),
            ('Total Cholesterol', '218 [High]', 'mg/dL', '< 200'),
            ('Triglycerides', '182 [High]', 'mg/dL', '< 150'),
            ('HDL Cholesterol', '39 [Low]', 'mg/dL', '> 40'),
            ('LDL Cholesterol', '135 [High]', 'mg/dL', '< 100')
        ]),
        ('Pathologist Remarks', [
            'Findings indicate baseline moderate hyperglycemia and hypercholesterolemia. Clinical correlation recommended.'
        ])
    ]
)

# 3. Lab Report (Sep 2026 Follow-up - Comparison Target)
create_pdf(
    'sample_medical_documents/3_Lab_Report_Apex_Metabolic_Sep2026.pdf',
    'APEX COMPREHENSIVE PATHOLOGY & DIAGNOSTIC LABS',
    ['NABL Accredited Clinical Laboratory | Barcode: APX-841920', 'Patient: Rajesh Sharma | Age: 54 Yrs | Date: 17-Sep-2026'],
    [
        ('Follow-Up Glycemic Profile', [
            ('Test Name', 'Recorded Result', 'Unit', 'Reference Range'),
            ('HbA1c (Glycated Hemoglobin)', '7.8 [High]', '%', '< 5.7 (Changed +0.6%)'),
            ('Fasting Blood Glucose (FBS)', '154 [High]', 'mg/dL', '70 - 99 (Changed +16 mg/dL)'),
            ('Post Prandial Glucose (PPBS)', '215 [High]', 'mg/dL', '< 140'),
            ('Serum Creatinine', '1.12', 'mg/dL', '0.70 - 1.20')
        ]),
        ('Follow-Up Lipid Profile', [
            ('Test Name', 'Recorded Result', 'Unit', 'Reference Range'),
            ('Total Cholesterol', '194 [Normal]', 'mg/dL', '< 200 (Decreased from 218)'),
            ('Triglycerides', '168 [Borderline]', 'mg/dL', '< 150'),
            ('HDL Cholesterol', '42 [Normal]', 'mg/dL', '> 40'),
            ('LDL Cholesterol', '118 [Mildly High]', 'mg/dL', '< 100')
        ]),
        ('Biochemical Trajectory Summary', [
            'Compared to baseline: HbA1c elevation from 7.2% to 7.8% indicates progressive insulin resistance.',
            'Total cholesterol reduction from 218 mg/dL to 194 mg/dL confirms therapeutic efficacy of statin therapy.'
        ])
    ]
)

# 4. Inpatient Discharge Summary
create_pdf(
    'sample_medical_documents/4_Hospital_Discharge_Summary_MaxCare_Sep2026.pdf',
    'MAXCARE SUPER SPECIALTY HOSPITAL — DISCHARGE SUMMARY',
    ['IPD No: MC-2026-8192 | Consultant: Dr. S. K. Gupta, MD (Int. Med.)', 'Patient: Rajesh Sharma | Admitted: 18-Sep-2026 | Discharged: 21-Sep-2026'],
    [
        ('Admission & Discharge Diagnosis', [
            '• Hypertensive Urgency (Blood Pressure on admission: 178/104 mmHg)',
            '• Uncontrolled Type 2 Diabetes Mellitus with osmotic symptoms',
            '• Resolution: Regulated to 134/84 mmHg under supervised dual antihypertensives'
        ]),
        ('Allergies & Adverse Drug Reactions (CONTRADICTION FLAG)', [
            '• Stated on Hospital Admission Sheet: NKDA (No Known Drug Allergies)',
            '⚠️ Note for Sehat Sathi: Contradicts clinic record of 2018 Penicillin sensitivity.'
        ]),
        ('Hospital Treatment Summary & Discharge Meds', [
            ('Medication', 'Dose & Route', 'Frequency', 'Status'),
            ('Tab Telmisartan', '40 mg Oral', 'OD Morning', 'Continued on discharge'),
            ('Tab Amlodipine', '5 mg Oral', 'OD Evening', 'Added for BP optimization'),
            ('Tab Metformin', '500 mg Oral', 'BD Post-meals', 'Continued on discharge'),
            ('Inj Regular Insulin', 'Subcutaneous', 'Sliding scale', 'Discontinued upon discharge')
        ]),
        ('Discharge Vitals & Instructions', [
            'Vitals on discharge: BP 130/82 mmHg, Pulse 74/min, SpO2 98% room air.',
            'Review with Primary Cardiologist in 2 weeks with home blood pressure diary.'
        ])
    ]
)

# 5. Complete Blood Count (Haemoglobin Trend)
create_pdf(
    'sample_medical_documents/5_CBC_Hematology_Haemoglobin_Report_Mar2026.pdf',
    'NATIONAL CLINICAL HEMATOLOGY LABORATORY',
    ['Sample ID: HEM-2026-4401 | Ref: Dr. A. Mehta', 'Patient: Rajesh Sharma | Age: 54 Yrs | Date of Report: 22-Mar-2026'],
    [
        ('Complete Blood Count (CBC) Findings', [
            ('Parameter', 'Result', 'Unit', 'Biological Reference'),
            ('Haemoglobin (Hb)', '12.1 [Mild Anemia]', 'g/dL', '13.0 - 17.0 (Jan: 11.2 g/dL, +0.9 g/dL)'),
            ('Total Leukocyte Count (TLC)', '7,400', 'cells/uL', '4,000 - 11,000'),
            ('Platelet Count', '245,000', 'cells/uL', '150,000 - 450,000'),
            ('Packed Cell Volume (PCV)', '37.8', '%', '40.0 - 50.0'),
            ('Mean Corpuscular Volume (MCV)', '82.4', 'fL', '80.0 - 100.0')
        ]),
        ('Hematological Observations', [
            'Haemoglobin demonstrates favorable upward trajectory (+0.9 g/dL over 60 days following iron supplementation).',
            'No evidence of hemolysis or acute hematological pathology.'
        ])
    ]
)

# Copy into backend storage synthetic directory
for f in os.listdir('sample_medical_documents'):
    shutil.copy(os.path.join('sample_medical_documents', f), os.path.join('backend/storage/synthetic', f))

print('SUCCESS: Created 5 medical PDFs in sample_medical_documents/ and backend/storage/synthetic/')
