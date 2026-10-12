from app.routers.auth import router as auth_router
from app.routers.documents import router as documents_router
from app.routers.timeline import router as timeline_router
from app.routers.briefing import router as briefing_router
from app.routers.verification import router as verification_router
from app.routers.sharing import router as sharing_router
from app.routers.audit import router as audit_router

__all__ = [
    "auth_router",
    "documents_router",
    "timeline_router",
    "briefing_router",
    "verification_router",
    "sharing_router",
    "audit_router"
]
