# youtube_transcript_service.py

import os
import requests
from dotenv import load_dotenv
from .websockets import manager
import asyncio
import traceback
from typing import Tuple, Dict, List, Optional

load_dotenv()

YOUTUBE_TRANSCRIPT_API_URL = "https://www.youtube-transcript.io/api/transcripts"
YOUTUBE_TRANSCRIPT_API_KEY = os.getenv("YOUTUBE_TRANSCRIPT_IO_API_KEY")

async def send_progress(message: str, client_id: str):
    """Send progress update via WebSocket"""
    await manager.send_message(message, client_id)

def extract_video_id(url: str) -> Optional[str]:
    """
    Extract video ID from various YouTube URL formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/v/VIDEO_ID
    """
    import re
    
    # Pattern for various YouTube URL formats
    # patterns = [
    #     r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
    #     r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
    # ]

    patterns = [
        r'(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If it's just a video ID (11 characters)
    if len(url) == 11 and url.isalnum():
        return url
    
    return None

async def fetch_youtube_transcript(video_id: str, client_id: str = None) -> Tuple[Dict, str]:
    """
    Fetch transcript from youtube-transcript.io API
    
    Args:
        video_id: YouTube video ID
        client_id: Optional client ID for progress updates
        
    Returns:
        Tuple of (transcript_data, video_id)
        transcript_data has format: {"text": str, "segments": List[Dict]}
        
    Raises:
        Exception: If API request fails or transcript is not available
    """
    if not YOUTUBE_TRANSCRIPT_API_KEY:
        raise Exception("YOUTUBE_TRANSCRIPT_IO_API_KEY not set in environment variables")
    
    if client_id:
        await send_progress("Fetching transcript from YouTube...", client_id)
    
    print(f"Fetching transcript for video ID: {video_id}")
    
    try:
        # Make API request
        headers = {
            "Authorization": f"Basic {YOUTUBE_TRANSCRIPT_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "ids": [video_id]
        }
        
        # Run blocking request in executor to avoid blocking async loop
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: requests.post(
                YOUTUBE_TRANSCRIPT_API_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
        )
        
        if response.status_code == 429:
            raise Exception("Rate limit exceeded. Please wait a moment and try again.")
        
        if response.status_code != 200:
            error_detail = response.text
            raise Exception(f"API request failed with status {response.status_code}: {error_detail}")
        
        data = response.json()
        
        # Check if we got transcript data
        if not data or not isinstance(data, list) or len(data) == 0:
            raise Exception("No transcript available for this video")
        
        video_data = data[0]
        
        # Check if transcript exists in tracks
        if "tracks" not in video_data or not video_data["tracks"]:
            raise Exception("Unfortunately, there is no transcript available for this video")
        
        # Get the first track (usually the primary language)
        first_track = video_data["tracks"][0]
        if "transcript" not in first_track or not first_track["transcript"]:
            raise Exception("Unfortunately, there is no transcript available for this video")
        
        transcript_segments = first_track["transcript"]
        
        # Convert to our expected format
        segments = []
        full_text_parts = []
        
        for segment in transcript_segments:
            # youtube-transcript.io returns format: {"text": str, "start": str, "dur": str}
            # We need: {"text": str, "start": float, "end": float}
            text = segment.get("text", "").strip()
            start = float(segment.get("start", 0))
            dur = float(segment.get("dur", 0))
            end = start + dur
            
            if text:
                segments.append({
                    "text": text,
                    "start": start,
                    "end": end
                })
                full_text_parts.append(text)
        
        full_text = " ".join(full_text_parts)
        
        if not full_text:
            raise Exception("Transcript is empty")
        
        if client_id:
            await send_progress("Transcript fetched successfully!", client_id)
        
        print(f"Successfully fetched transcript with {len(segments)} segments")
        
        return {
            "text": full_text,
            "segments": segments
        }, video_id
        
    except requests.exceptions.Timeout:
        error_msg = "Request timed out. Please try again."
        print(f"Error: {error_msg}")
        if client_id:
            await send_progress(error_msg, client_id)
        raise Exception(error_msg)
    
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error: {str(e)}"
        print(f"Error: {error_msg}")
        if client_id:
            await send_progress(error_msg, client_id)
        raise Exception(error_msg)
    
    except Exception as e:
        error_msg = str(e)
        print(f"Error: {error_msg}")
        print(traceback.format_exc())
        if client_id:
            await send_progress(error_msg, client_id)
        raise

async def process_youtube_video(url: str, client_id: str = None) -> Tuple[Dict, str, str]:
    """
    Process YouTube video URL and fetch transcript
    
    Args:
        url: YouTube video URL or video ID
        client_id: Optional client ID for progress updates
        
    Returns:
        Tuple of (transcript_data, video_id, original_url)
        
    Raises:
        Exception: If video ID extraction fails or transcript fetch fails
    """
    try:
        if client_id:
            await send_progress("Processing YouTube video...", client_id)
        
        print(f"Processing YouTube URL: {url}")
        
        # Extract video ID
        video_id = extract_video_id(url)
        
        if not video_id:
            raise Exception("Invalid YouTube URL. Please provide a valid YouTube video link.")
        
        print(f"Extracted video ID: {video_id}")
        
        # Fetch transcript
        transcript_data, video_id = await fetch_youtube_transcript(video_id, client_id)
        
        if client_id:
            await send_progress("Processing complete!", client_id)
        
        print("YouTube video processing complete")
        
        # Return video ID instead of audio URL for YouTube videos
        return transcript_data, video_id, url
        
    except Exception as e:
        error_message = f"Error processing YouTube video: {str(e)}"
        print(error_message)
        print(traceback.format_exc())
        if client_id:
            await send_progress(error_message, client_id)
        raise