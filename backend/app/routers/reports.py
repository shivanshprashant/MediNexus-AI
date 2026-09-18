import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import asyncpg

from app.core.database import get_db_pool
from app.routers.patients import get_user_id_from_header
from fastapi import Header

router = APIRouter(prefix="/patient-reports", tags=["patient-reports"])

UPLOAD_DIR = "uploads/patient_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("")
async def upload_patient_report(
    file: UploadFile = File(...),
    pool: asyncpg.Pool = Depends(get_db_pool),
    authorization: str = Header(None)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    async with pool.acquire() as conn:
        patient_row = await conn.fetchrow("SELECT id FROM patients WHERE user_id = $1 OR id = $1", user_id)
        if not patient_row:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        patient_id = patient_row["id"]

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type. Please upload PDF, JPG, PNG, or WEBP.")

    report_id = f"rpt-{uuid.uuid4().hex[:8]}"
    stored_file_name = f"patient_{patient_id}_{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, stored_file_name)

    with open(stored_path, "wb") as f:
        f.write(contents)

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO patient_reports (id, patient_id, file_name, stored_file_name, file_type, file_size)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            report_id, patient_id, file.filename, stored_file_name, file.content_type, len(contents)
        )

    return {
        "id": report_id,
        "fileName": file.filename,
        "message": "Report uploaded successfully"
    }

@router.get("")
async def list_patient_reports(
    pool: asyncpg.Pool = Depends(get_db_pool),
    authorization: str = Header(None)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    async with pool.acquire() as conn:
        patient_row = await conn.fetchrow("SELECT id FROM patients WHERE user_id = $1 OR id = $1", user_id)
        if not patient_row:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        patient_id = patient_row["id"]

        rows = await conn.fetch(
            "SELECT id, file_name, file_type, file_size, uploaded_at, stored_file_name FROM patient_reports WHERE patient_id = $1 ORDER BY uploaded_at DESC",
            patient_id
        )
        
        return [
            {
                "id": r["id"],
                "fileName": r["file_name"],
                "fileType": r["file_type"],
                "fileSize": r["file_size"],
                "uploadedAt": r["uploaded_at"].isoformat() if r["uploaded_at"] else None,
                "url": f"/uploads/patient_reports/{r['stored_file_name']}"
            }
            for r in rows
        ]

@router.delete("/{report_id}")
async def delete_patient_report(
    report_id: str,
    pool: asyncpg.Pool = Depends(get_db_pool),
    authorization: str = Header(None)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    async with pool.acquire() as conn:
        patient_row = await conn.fetchrow("SELECT id FROM patients WHERE user_id = $1 OR id = $1", user_id)
        if not patient_row:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        patient_id = patient_row["id"]

        report = await conn.fetchrow("SELECT * FROM patient_reports WHERE id = $1 AND patient_id = $2", report_id, patient_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        stored_path = os.path.join(UPLOAD_DIR, report["stored_file_name"])
        try:
            if os.path.exists(stored_path):
                os.remove(stored_path)
        except Exception:
            pass

        await conn.execute("DELETE FROM patient_reports WHERE id = $1", report_id)

    return {"detail": "Report deleted successfully"}

@router.get("/patient/{patient_id}")
async def list_patient_reports_for_doctor(
    patient_id: str,
    pool: asyncpg.Pool = Depends(get_db_pool),
    authorization: str = Header(None)
):
    user_id = get_user_id_from_header(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    async with pool.acquire() as conn:
        # Check if patient exists
        patient = await conn.fetchrow("SELECT id FROM patients WHERE id = $1", patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        rows = await conn.fetch(
            "SELECT id, file_name, file_type, file_size, uploaded_at, stored_file_name FROM patient_reports WHERE patient_id = $1 ORDER BY uploaded_at DESC",
            patient_id
        )
        
        return [
            {
                "id": r["id"],
                "fileName": r["file_name"],
                "fileType": r["file_type"],
                "fileSize": r["file_size"],
                "uploadedAt": r["uploaded_at"].isoformat() if r["uploaded_at"] else None,
                "url": f"/uploads/patient_reports/{r['stored_file_name']}"
            }
            for r in rows
        ]
