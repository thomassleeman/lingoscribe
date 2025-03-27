FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to utilize Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app files
COPY . .

# Create directories needed for the app
RUN mkdir -p storage/uploads

# Create a startup script
RUN echo '#!/bin/bash\n\
echo "Starting application..."\n\
echo "Current directory: $(pwd)"\n\
echo "Directory listing:"\n\
ls -la\n\
echo "App directory listing:"\n\
ls -la app\n\
echo "Starting uvicorn server..."\n\
uvicorn app.main:app --host 0.0.0.0 --port 8080\n\
' > start.sh && chmod +x start.sh

EXPOSE 8080

CMD ["./start.sh"]