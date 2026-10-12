import os
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile
from app.config import settings

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.SYNTHETIC_DIR, exist_ok=True)

class StorageService:
    @staticmethod
    def validate_file(file: UploadFile):
        ext = Path(file.filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

    @staticmethod
    async def save_uploaded_file(file: UploadFile, user_id: str) -> tuple[str, str, int]:
        """
        Saves file securely, preventing path traversal.
        Returns: (stored_filename, storage_path, file_size)
        """
        StorageService.validate_file(file)
        
        # User-isolated folder
        user_dir = os.path.join(settings.UPLOAD_DIR, user_id)
        os.makedirs(user_dir, exist_ok=True)

        ext = Path(file.filename).suffix.lower()
        stored_filename = f"{uuid.uuid4()}{ext}"
        storage_path = os.path.join(user_dir, stored_filename)

        content = await file.read()
        file_size = len(content)

        if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        with open(storage_path, "wb") as f:
            f.write(content)

        return stored_filename, storage_path, file_size

    @staticmethod
    def get_secure_file_path(storage_path: str) -> str:
        # Prevent path traversal
        norm_path = os.path.abspath(storage_path)
        norm_upload_dir = os.path.abspath(settings.UPLOAD_DIR)
        norm_synth_dir = os.path.abspath(settings.SYNTHETIC_DIR)

        if not (norm_path.startswith(norm_upload_dir) or norm_path.startswith(norm_synth_dir)):
            raise HTTPException(status_code=403, detail="Forbidden file access attempt detected")

        if not os.path.exists(norm_path):
            raise HTTPException(status_code=404, detail="Requested file was not found")

        return norm_path

storage_service = StorageService()
