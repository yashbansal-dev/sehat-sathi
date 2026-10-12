import os
import fitz

def generate_sample_pdfs():
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage", "synthetic")
    os.makedirs(output_dir, exist_ok=True)

    docs = [
        ('Apex_Diagnostics_Metabolic_Lipid_Panel_Oct2026.pdf', """APEX DIAGNOSTIC & PATHOLOGY LABS
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
Clinical Interpretation: Suboptimal glycemic and lipid control under current therapy."""),

        ('MaxCare_Hospital_Discharge_Summary_Sep2026.pdf', """MAXCARE SUPER SPECIALTY HOSPITAL - DISCHARGE SUMMARY
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
Follow up in Cardiology OPD after 3 weeks with fresh Lipid Profile and HbA1c."""),

        ('Dr_Mehta_Cardiology_FollowUp_Oct2026.pdf', """MEHTA HEART & VASCULAR CLINIC
Reg No: MH-3391 | Date: 05-Oct-2026
Patient: Rajesh Sharma | BP: 134/84 mmHg | Pulse: 76 bpm | Weight: 79 kg
Rx (Current Regimen Adjusted):
1. Tab. Telmisartan 40mg - 1-0-0 (OD after breakfast)
2. Tab. Amlodipine 5mg - 0-0-1 (Bedtime)
3. Tab. Metformin 500mg - 1-0-1 (BD after breakfast and dinner)
4. Tab. Atorvastatin 20mg - 0-0-1 (Night)
5. Tab. Pantoprazole 40mg - 1-0-0 (Empty stomach 30 mins before breakfast for 14 days)
Advice: Moderate aerobic exercise 30 min/day, reduce dietary sodium, repeat fasting blood sugar."""),

        ('City_Clinic_Gastroenteritis_Rx_Nov2025.pdf', """CITY COMMUNITY HEALTHCARE CLINIC
Date: 12-Nov-2025 | Patient: Rajesh Sharma
Diagnosis: Acute Gastroenteritis
Rx:
1. Cap. Amoxicillin 500mg - 1-0-1 for 5 days [COMPLETED]
2. Tab. Paracetamol 650mg - SOS for fever
3. ORS sachets - 2 liters/day
Review if vomiting persists.""")
    ]

    for filename, content in docs:
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 72), content, fontsize=11)
        out_path = os.path.join(output_dir, filename)
        doc.save(out_path)
        doc.close()
        print(f"Generated {out_path}")

if __name__ == "__main__":
    generate_sample_pdfs()
