import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import User, PatientProfile
from app.schemas.all_schemas import UserRegister, UserLogin, FirebaseLoginRequest, Token, UserOut, PatientProfileUpdate
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user
from app.data.synthetic_samples import seed_synthetic_patient_data

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    role = user_in.role if user_in.role in ["patient", "doctor"] else "patient"
    new_user = User(
        id=user_id,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=role,
        firebase_uid=user_in.firebase_token
    )
    db.add(new_user)

    # Empty patient profile
    profile = PatientProfile(
        id=str(uuid.uuid4()),
        user_id=user_id
    )
    db.add(profile)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if login_in.password and not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/firebase-login", response_model=Token)
def firebase_login(req: FirebaseLoginRequest, db: Session = Depends(get_db)):
    """Bridge Firebase Authentication with Sehat Sathi backend session"""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Create new user associated with Firebase
        user_id = str(uuid.uuid4())
        user_role = req.role if req.role in ["patient", "doctor"] else "patient"
        name = req.full_name if req.full_name else req.email.split("@")[0].capitalize()
        user = User(
            id=user_id,
            email=req.email,
            hashed_password=hash_password(str(uuid.uuid4())),
            full_name=name,
            role=user_role,
            firebase_uid=req.firebase_uid
        )
        db.add(user)
        profile = PatientProfile(id=str(uuid.uuid4()), user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(user)
    else:
        # Link firebase_uid if not set
        if not user.firebase_uid:
            user.firebase_uid = req.firebase_uid
            db.commit()

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """One-click demo login seeded with comprehensive patient medical history"""
    demo_user = seed_synthetic_patient_data(db)
    token = create_access_token({"sub": demo_user.id, "email": demo_user.email, "role": demo_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": demo_user.id,
            "email": demo_user.email,
            "full_name": demo_user.full_name,
            "role": demo_user.role
        }
    }

@router.post("/demo-doctor-login", response_model=Token)
def demo_doctor_login(db: Session = Depends(get_db)):
    """One-click demo login for doctor clinician workstation"""
    patient_user = seed_synthetic_patient_data(db)
    doctor = db.query(User).filter(User.email == "doctor.demo@sehatsathi.ai").first()
    if not doctor:
        doctor = User(
            id=str(uuid.uuid4()),
            email="doctor.demo@sehatsathi.ai",
            hashed_password=hash_password("DemoPassword2026!"),
            full_name="Dr. Arvind Verma, MD",
            role="doctor"
        )
        db.add(doctor)
        db.commit()
        db.refresh(doctor)

    token = create_access_token({"sub": patient_user.id, "email": doctor.email, "role": "doctor"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": doctor.id,
            "email": doctor.email,
            "full_name": doctor.full_name,
            "role": "doctor"
        }
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return current_user

@router.put("/profile")
def update_profile(
    profile_update: PatientProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(id=str(uuid.uuid4()), user_id=current_user.id)
        db.add(profile)

    for field, value in profile_update.dict(exclude_unset=True).items():
        if value is not None:
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return {"status": "success", "profile": profile}
