FROM python:3.11-slim

# Dependencias del sistema para opencv/mediapipe
RUN apt-get update && apt-get install -y \
    libgl1 libglib2.0-0 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code
ENV PYTHONUNBUFFERED=1

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el proyecto
COPY . .

# Para que los imports "app.algo" funcionen
ENV PYTHONPATH=/code
