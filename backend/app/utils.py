# utils.py

import os
import uuid
from fastapi import UploadFile
import aiofiles
from .supabase_client import supabase

BUCKET_NAME = "audio"

async def save_uploaded_file(file: UploadFile, upload_folder: str = None) -> tuple:
    """
    Upload a file to Supabase storage and return the file path and public URL.
    
    Args:
        file: The uploaded file
        upload_folder: Ignored, kept for backward compatibility
        
    Returns:
        Tuple containing (file path in bucket, public URL)
    """
    # Generate a unique filename to avoid collisions
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Get content type from file or infer from extension
    content_type = file.content_type
    if not content_type:
        # Map extensions to MIME types
        content_types = {
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4', 
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac',
        }
        content_type = content_types.get(file_extension.lower(), 'application/octet-stream')
    
    print(f"Uploading file with content type: {content_type}")
    
    # Read file content
    content = await file.read()
    
    # Upload to Supabase
    supabase.storage.from_(BUCKET_NAME).upload(
        unique_filename, 
        content,
        {"content-type": content_type}
    )
    
    # Get the public URL
    # file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)

    supabase_url = os.getenv("SUPABASE_URL")
    file_url = f"{supabase_url}/storage/v1/object/public/{BUCKET_NAME}/{unique_filename}"
    
    return unique_filename, file_url

