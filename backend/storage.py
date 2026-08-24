import datetime
import os
import uuid
from pathlib import Path

from fastapi import UploadFile
from minio import Minio

from backend.metrics import log_creation_event, logger

RAW_ENDPOINT = os.getenv("MINIO_ENDPOINT", "storage:9000")
MINIO_ENDPOINT = RAW_ENDPOINT.replace("http://", "").replace("https://", "")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "marcenaria-uploads")


class StorageManager:
    def __init__(self):
        self.bucket = MINIO_BUCKET
        # Inicializa o cliente oficial assinando os requests S3
        self.client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False,  # HTTP local sem SSL
        )

    def save_file(
        self,
        upload_file: UploadFile,
        content_type: str = "application/octet-stream",
    ) -> dict:
        file_id = str(uuid.uuid4())
        ext = Path(upload_file.filename).suffix if upload_file.filename else ""
        stored_filename = f"{file_id}{ext}"

        upload_file.file.seek(0, os.SEEK_END)
        file_size = upload_file.file.tell()
        upload_file.file.seek(0)

        try:
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=stored_filename,
                data=upload_file.file,
                length=file_size,
                content_type=content_type or "application/octet-stream",
            )
            logger.info(f"Arquivo salvo com sucesso no MinIO: {stored_filename}")
        except Exception as e:
            logger.error(f"Erro ao salvar arquivo no MinIO: {str(e)}")
            raise e

        metadata = {
            "minio_filename_id": stored_filename,
            "content_type": content_type or "application/octet-stream",
            "size": file_size,
            "url": f"/api/files/{file_id}",
            "created_at": datetime.datetime.utcnow().isoformat() + "Z",
        }

        return metadata

    def get_file(self, filename: str) -> bytes:
        try:
            response = self.client.get_object(self.bucket, filename)
            content = response.read()
            response.close()
            response.release_conn()
            return content
        except Exception as err:
            logger.error(f"Erro ao buscar arquivo no MinIO: {str(err)}")
            raise FileNotFoundError("Arquivo não encontrado no armazenamento.")

    def delete_file(self, filename: str) -> bool:
        try:
            self.client.remove_object(self.bucket, filename)
            return True
        except Exception as err:
            logger.error(f"Erro ao deletar arquivo: {str(err)}")
            return False


storage_manager = StorageManager()
