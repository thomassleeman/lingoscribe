# whisper_service.py

from openai import OpenAI
from dotenv import load_dotenv
import os
import traceback
import ffmpeg
from .websockets import manager
import asyncio
from fastapi import BackgroundTasks
import aiofiles
import uuid
import tempfile
from .supabase_client import supabase
import httpx


load_dotenv()

# Initialize OpenAI client
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
http_client = httpx.Client()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), http_client=http_client)

BUCKET_NAME = "audio"

async def send_progress(message: str, client_id: str):
    await manager.send_message(message, client_id)

# async def download_youtube_audio(url: str, output_path: str, client_id: str = None) -> str:
#     """Download YouTube audio to a temporary file"""
#     if client_id:
#         await send_progress("Processing video...", client_id)
#     print("Starting YouTube audio download...")

#     # Create a temp directory that will be automatically cleaned up
#     with tempfile.TemporaryDirectory() as temp_dir:
#         temp_output_path = os.path.join(temp_dir, "audio.%(ext)s")
        
#         ydl_opts = {
#             'format': 'bestaudio/best',
#             'postprocessors': [{
#                 'key': 'FFmpegExtractAudio',
#                 'preferredcodec': 'mp3',
#                 'preferredquality': '192',
#             }],
#             'outtmpl': temp_output_path,
#         }

#         # Run the blocking yt_dlp code in a thread
#         def download():
#             with yt_dlp.YoutubeDL(ydl_opts) as ydl:
#                 ydl.download([url])

#         loop = asyncio.get_running_loop()
#         await loop.run_in_executor(None, download)

#         if client_id:
#             await send_progress("Processing audio...", client_id)
        
#         # Find the downloaded file
#         downloaded_files = [f for f in os.listdir(temp_dir)]
#         if not downloaded_files:
#             raise Exception("Audio file not found after download.")
        
#         downloaded_file_path = os.path.join(temp_dir, downloaded_files[0])
        
#         # Upload to Supabase
#         filename = f"yt_{client_id}.mp3"
        
#         with open(downloaded_file_path, 'rb') as f:
#             supabase.storage.from_(BUCKET_NAME).upload(
#                 filename,
#                 f.read(),
#                 {"content-type": "audio/mpeg"}
#             )
        
#         # Get the public URL
#         file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        
#         print("YouTube audio download complete.")
#         return filename, file_url

async def transcribe_audio(file_path: str, client_id: str = None) -> dict:
    """
    Transcribe audio using OpenAI Whisper API
    """
    if client_id:
        await send_progress("Transcribing...", client_id)
    print("Starting transcription...")

    try:
        # Get proper file extension, strip any query parameters
        if file_path.startswith("http"):
            # Extract just the path part of the URL, removing query parameters
            from urllib.parse import urlparse
            parsed_url = urlparse(file_path)
            path_only = parsed_url.path
            file_extension = os.path.splitext(path_only)[1]
        else:
            file_extension = os.path.splitext(file_path)[1]
        
        # Default to .mp3 if we couldn't determine the extension
        if not file_extension:
            file_extension = '.mp3'
            
        print(f"File extension: {file_extension}")

        if file_path.startswith("http"):
            # It's a URL, download it to a temp file
            print(f"Downloading file from URL: {file_path}")
            temp_fd, temp_path = tempfile.mkstemp(suffix=file_extension)
            os.close(temp_fd)
            
            import httpx
            async with httpx.AsyncClient() as http_client:
                async with http_client.stream('GET', file_path) as r:
                    if r.status_code != 200:
                        raise Exception(f"Failed to download file: HTTP {r.status_code}")
                    
                    with open(temp_path, 'wb') as f:
                        async for chunk in r.aiter_bytes():
                            f.write(chunk)
            
            print(f"Downloaded to temp file: {temp_path}, size: {os.path.getsize(temp_path)} bytes")
        else:
            # It's a filename in the bucket, download it
            print(f"Downloading file from Supabase bucket: {file_path}")
            temp_fd, temp_path = tempfile.mkstemp(suffix=file_extension)
            os.close(temp_fd)
            
            try:
                # Download file from Supabase to temp file
                file_data = supabase.storage.from_(BUCKET_NAME).download(file_path)
                print(f"Downloaded data from Supabase, size: {len(file_data)} bytes")
                
                with open(temp_path, 'wb') as f:
                    f.write(file_data)
                
                print(f"Wrote to temp file: {temp_path}, size: {os.path.getsize(temp_path)} bytes")
            except Exception as download_error:
                print(f"Error downloading from Supabase: {str(download_error)}")
                raise

        # Since OpenAI client does not support async, use run_in_executor
        def transcribe():
            print(f"Opening file for transcription: {temp_path}")
            with open(temp_path, "rb") as audio_file_sync:
                response = client.audio.transcriptions.create(
                    file=audio_file_sync,
                    model="whisper-1",
                    response_format="verbose_json"
                )
            
            # Extract the full transcript and segments with timing information
            full_text = response.text
            
            # Process segments with timing information
            segments = []
            for segment in response.segments:
                segments.append({
                    "text": segment.text,
                    "start": segment.start,
                    "end": segment.end
                })
            
            return {
                "text": full_text,
                "segments": segments
            }

        loop = asyncio.get_running_loop()
        transcript_data = await loop.run_in_executor(None, transcribe)

        # Clean up the temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        if client_id:
            await send_progress("Transcription complete.", client_id)
        print("Transcription complete.")
        return transcript_data
    except Exception as e:
        error_message = f"Error during transcription: {str(e)}"
        print(traceback.format_exc())
        if client_id:
            await send_progress(error_message, client_id)
        return {"text": error_message, "segments": []}


# async def process_youtube_video(url: str, client_id: str = None) -> tuple:
#     try:
#         print("Processing YouTube video...")
#         if client_id:
#             await send_progress("Processing YouTube video...", client_id)

#         # Step 1: Download the YouTube audio and upload to Supabase
#         unique_filename = f"yt_{client_id}"
#         filename, file_url = await download_youtube_audio(url, unique_filename, client_id)

#         # Step 2: Transcribe the audio
#         transcript_data = await transcribe_audio(file_url, client_id)

#         if client_id:
#             await send_progress("YouTube video processing complete.", client_id)
#         print("YouTube video processing complete.")

#         return transcript_data, file_url, url
#     except Exception as e:
#         error_message = f"Error processing YouTube video: {str(e)}"
#         print(traceback.format_exc())
#         if client_id:
#             await send_progress(error_message, client_id)
#         return {"text": error_message, "segments": []}, "", ""




