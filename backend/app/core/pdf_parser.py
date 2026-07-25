from pypdf import PdfReader
from pypdf.errors import FileNotDecryptedError
from fastapi import HTTPException, status

def read_pdf(file_bytes: bytes, password: str | None = None) -> PdfReader:
    reader = PdfReader(io.BytesIO(file_bytes))

    if reader.is_encrypted:
        if not password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="PDF_PASSWORD_REQUIRED",
            )
        result = reader.decrypt(password)
        if result == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="PDF_PASSWORD_INCORRECT",
            )

    return reader
