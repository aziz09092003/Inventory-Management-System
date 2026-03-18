from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from myapp.database.session import engine, Base

# Routers
from myapp.api.items import router as items
from myapp.api.customer import router as customers
from myapp.api.sales import router as sales
from myapp.api.udhar import router as udhar
from myapp.api.udhaar_item import router as udhaar_item
from myapp.api.bill import router as bill
from myapp.api.user import router as user
from myapp.api.shop import router as shop
from myapp.api.report import router as report
from myapp.api.forcasting import router as forcast
from myapp.api.bill_item import router as bill_item

# Database lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

# Create app
myapp = FastAPI(lifespan=lifespan)

# CORS setup
origins = ["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174", "null"]
myapp.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# error_map is defined in myapp.utils.errors to avoid circular imports
from myapp.utils.errors import error_map

# Helper: add CORS headers to error responses so the browser doesn't block them
def _cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin", "")
    allowed = {"http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174"}
    if origin in allowed:
        return {
            "access-control-allow-origin": origin,
            "access-control-allow-credentials": "true",
        }
    return {}

# ✅ HTTPException handler
@myapp.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    error_label = error_map.get(exc.status_code, "نامعلوم مسئلہ")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_label, "detail": exc.detail},
        headers=_cors_headers(request),
    )

# ✅ ValueError handler (common for manual checks)
@myapp.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"error": "غلط ویلیو", "detail": str(exc)},
        headers=_cors_headers(request),
    )

# ✅ Request validation errors (body/query/path validation)
from fastapi.exceptions import RequestValidationError

@myapp.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    cleaned_errors = []
    for err in exc.errors():
        if "ctx" in err:
            err["ctx"] = {k: str(v) for k, v in err["ctx"].items()}
        cleaned_errors.append(err)

    return JSONResponse(
        status_code=422,
        content={"error": "غلط ڈیٹا", "detail": cleaned_errors},
        headers=_cors_headers(request),
    )

# ✅ General Exception handler
@myapp.exception_handler(Exception)
async def custom_general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "سرور کی خرابی", "detail": str(exc)},
        headers=_cors_headers(request),
    )

# Routers
myapp.include_router(user)
myapp.include_router(shop)
myapp.include_router(items)
myapp.include_router(customers)
myapp.include_router(udhaar_item)
myapp.include_router(bill_item)
myapp.include_router(sales)
myapp.include_router(udhar)
myapp.include_router(bill)
myapp.include_router(report)
myapp.include_router(forcast)

# Alias for uvicorn default convention: uvicorn myapp.main:app
app = myapp
