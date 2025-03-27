# routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from .whisper_service import process_youtube_video, transcribe_audio
from .utils import save_uploaded_file
import os
from openai import OpenAI
import traceback
from pydantic import BaseModel
import asyncio

router = APIRouter()

class YouTubeRequest(BaseModel):
    url: str
    client_id: str

@router.post("/transcribe-youtube/")
async def transcribe_youtube(request: YouTubeRequest):
    try:
        print("Received YouTube transcription request...")
        transcript_data, audio_url, original_url = await process_youtube_video(request.url, request.client_id)
        return {
            "transcript": transcript_data["text"], 
            "segments": transcript_data["segments"],
            "audioUrl": audio_url, 
            "sourceUrl": original_url
        }
    except Exception as e:
        print(f"Exception occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing YouTube video: {str(e)}")

@router.post("/upload/")
async def upload_file(file: UploadFile = File(...), client_id: str = Form(...)):
    """
    Upload an audio/video file and get its transcript with timestamps.
    """
    try:
        print("Received file upload request...")
        # Step 1: Save the uploaded file to Supabase
        filename, file_url = await save_uploaded_file(file)
        print(f"File uploaded to Supabase: {filename}")
        
        # Step 2: Transcribe the audio
        transcript_data = await transcribe_audio(file_url, client_id)
        
        print("File processing complete.")
        return {
            "transcript": transcript_data["text"], 
            "segments": transcript_data["segments"],
            "audioUrl": file_url
        }
    except Exception as e:
        error_message = f"Error processing uploaded file: {str(e)}"
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_message)
    
class ChatRequest(BaseModel):
    transcript: str
    user_message: str
    selected_text: str = ""

client = OpenAI()

@router.post("/chat")
async def chat_with_transcript(request: ChatRequest):
    """
    Chat with GPT-4o-mini using the transcript and user message.
    """
    print("request: ", request)
    try:
        # Call OpenAI API
        # Prepare system message with transcript and highlight selected text if available
        system_message = f"You are a language learning teacher helping the user to improve their target language by talking to them about this text: {request.transcript} which is in their target language. The text is a transcript of some audio or video content that they are using to study. Your only role is to help the user to improve in their target language, you cannot help with anything that is unrelated to this role."
        
        # Add context about the selected text if it exists
        messages = [{"role": "system", "content": system_message}]
        
        if request.selected_text:
            messages.append({"role": "system", "content": f"The user has selected/highlighted this specific part of the text: \"{request.selected_text}\". They may be asking about this particular section."})
        
        messages.append({"role": "user", "content": request.user_message})
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
        )
        print("OpenAI Response:", response)
        # Extract the chatbot's response
        assistant_message = response.choices[0].message.content  # Access the `content` property directly
        return {"response": assistant_message}
    except Exception as e:
        print(f"Error: {str(e)}")  # Add this line
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")



# from fastapi import APIRouter, UploadFile, File, HTTPException, Form
# from .whisper_service import process_youtube_video, transcribe_audio
# from .utils import save_uploaded_file
# import os
# from openai import OpenAI
# import traceback
# from pydantic import BaseModel
# import asyncio
# # from .websockets import manager



# UPLOAD_FOLDER = "storage/uploads/"

# router = APIRouter()

# class YouTubeRequest(BaseModel):
#     url: str
#     client_id: str

# @router.post("/transcribe-youtube/")
# async def transcribe_youtube(request: YouTubeRequest):
#     try:
#         print("Received YouTube transcription request...")
#         transcript_data, audio_url, original_url = await process_youtube_video(request.url, request.client_id)
#         return {
#             "transcript": transcript_data["text"], 
#             "segments": transcript_data["segments"],
#             "audioUrl": audio_url, 
#             "sourceUrl": original_url
#         }
#     except Exception as e:
#         print(f"Exception occurred: {e}")
#         raise HTTPException(status_code=500, detail=f"Error processing YouTube video: {str(e)}")

# @router.post("/upload/")
# async def upload_file(file: UploadFile = File(...), client_id: str = Form(...)):
#     """
#     Upload an audio/video file and get its transcript with timestamps.
#     """
#     try:
#         print("Received file upload request...")
#         # Step 1: Save the uploaded file
#         file_path = await save_uploaded_file(file, UPLOAD_FOLDER)
#         print(f"File saved at {file_path}")
#         # Step 2: Transcribe the audio
#         transcript_data = await transcribe_audio(file_path, client_id)
        
#         # Generate a URL path for the audio file
#         file_name = os.path.basename(file_path)
#         audio_url = f"/audio/{file_name}"
        
#         print("File processing complete.")
#         return {
#             "transcript": transcript_data["text"], 
#             "segments": transcript_data["segments"],
#             "audioUrl": audio_url
#         }
#     except Exception as e:
#         error_message = f"Error processing uploaded file: {str(e)}"
#         print(traceback.format_exc())
#         raise HTTPException(status_code=500, detail=error_message)


# class ChatRequest(BaseModel):
#     transcript: str
#     user_message: str
#     selected_text: str = ""

# client = OpenAI()

# @router.post("/chat/")
# async def chat_with_transcript(request: ChatRequest):
#     """
#     Chat with GPT-4o-mini using the transcript and user message.
#     """
#     print("request: ", request)
#     try:
#         # Call OpenAI API
#         # Prepare system message with transcript and highlight selected text if available
#         system_message = f"You are a language learning teacher helping the user to improve their target language by talking to them about this text: {request.transcript} which is in their target language. The text is a transcript of some audio or video content that they are using to study. Your only role is to help the user to improve in their target language, you cannot help with anything that is unrelated to this role."
        
#         # Add context about the selected text if it exists
#         messages = [{"role": "system", "content": system_message}]
        
#         if request.selected_text:
#             messages.append({"role": "system", "content": f"The user has selected/highlighted this specific part of the text: \"{request.selected_text}\". They may be asking about this particular section."})
        
#         messages.append({"role": "user", "content": request.user_message})
        
#         response = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=messages,
#         )
#         print("OpenAI Response:", response)
#         # Extract the chatbot's response
#         assistant_message = response.choices[0].message.content  # Access the `content` property directly
#         return {"response": assistant_message}
#     except Exception as e:
#         print(f"Error: {str(e)}")  # Add this line
#         raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")


