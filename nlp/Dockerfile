# 1. Start with a stable, slim Python base image
FROM python:3.10-slim

# 2. Install necessary system dependencies (needed for compilation of some libraries)
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Copy the list of dependencies
COPY requirements.txt .

# 5. Install pip upgrade and all main dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- NEW STEP: Install Spacy Model Robustly ---
# This uses Spacy's built-in download command which is more reliable than direct URLs in this environment.
RUN python -m spacy download en_core_web_sm

# 6. Copy the application code
COPY app.py .

# 7. Expose the port where Flask will run (5000)
EXPOSE 5000

# 8. Define the command to start the application using Gunicorn
CMD exec gunicorn --bind 0.0.0.0:5000 --workers 4 app:app