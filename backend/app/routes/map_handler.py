from fastapi import APIRouter, File, UploadFile
import os

router = APIRouter()

@router.post("/upload/map")
async def upload_map(file: UploadFile = File(...)):
    contents = await file.read()
    os.makedirs("public/maps", exist_ok=True)
    path = f"public/maps/{file.filename}"
    with open(path, "wb") as f:
        f.write(contents)
    return {"filename": file.filename} 