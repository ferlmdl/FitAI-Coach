#  FitAI Coach - Entrenador Inteligente con Visión Artificial

<img width="1144" height="743" alt="image" src="https://github.com/user-attachments/assets/2a1127a7-05be-48ca-9a31-d4571095d3ab" />


**FitAI Coach** es una plataforma web full-stack diseñada para analizar la técnica de ejercicios físicos mediante Inteligencia Artificial. El sistema procesa videos subidos por el usuario, detecta la pose humana frame a frame, evalúa la ejecución (como la profundidad en sentadillas) y genera un reporte detallado con feedback segundo a segundo.

---

## Tabla de Contenidos

1. [Características](#-características)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#-tecnologías)
4. [Instalación y Configuración](#-instalación-y-configuración)
5. [Base de Datos](#-base-de-datos)
6. [Ejecución](#-ejecución)
7. [Capturas de Pantalla](#-capturas-de-pantalla)

---

## Características

* **Análisis Biomecánico:** Detección de esqueleto humano usando MediaPipe.
* **Feedback Inteligente:** El sistema indica *en qué segundo* ocurrió el error y por qué (ej: "Falta profundidad").
* **Procesamiento Asíncrono:** Uso de colas (Redis) para evitar tiempos de carga en la web.
* **Gestión de Videos:** Subida, almacenamiento y reproducción de historial de entrenamientos.
* **Seguridad:** Autenticación robusta y validación de tokens JWT entre microservicios.

---

## Arquitectura del Sistema

El proyecto sigue una arquitectura de microservicios híbrida:

1.  **Web Backend (Node.js):** Gestiona la autenticación, la subida de archivos y la interfaz de usuario.
2.  **AI Service (Python FastAPI):** API interna que recibe solicitudes de análisis.
3.  **Worker (Python RQ):** Proceso en segundo plano que descarga el video, ejecuta los algoritmos de visión y guarda los resultados.

---

##  Tecnologías

### Backend & Frontend
* **Node.js / Express:** Servidor principal.
* **Handlebars (.hbs):** Motor de plantillas.
* **JavaScript Vanilla & CSS3:** Interactividad y diseño responsive.

### Inteligencia Artificial & Microservicio
* **Python 3.12**
* **FastAPI:** API REST.
* **OpenCV & MediaPipe:** Procesamiento de imagen.
* **Redis (Upstash) & RQ:** Cola de tareas.
* **SQLAlchemy:** ORM.

### Infraestructura
* **Supabase:** PostgreSQL (Base de datos) + Storage (Videos) + Auth.
* **Upstash:** Redis en la nube.

---

## Instalación y Configuración

### Prerrequisitos
* Node.js (v18+)
* Python (v3.10+)
* Cuenta en Supabase y Upstash.

### 1. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/fitai-coach.git](https://github.com/tu-usuario/fitai-coach.git)
cd fitai-coach
```

### 2. Configurar Web App (Node.js)
```bash
cd web-app/Backend
npm install
```

### 3. Crea un archivo .env en web-app/Backend/:
```Ini, TOML
PORT=3000
SUPABASE_URL=[https://tu-proyecto.supabase.co](https://tu-proyecto.supabase.co)
SUPABASE_KEY=tu-anon-key
AI_SERVICE_URL=http://localhost:8000
```

### 4. Crea un archivo .env en ai-service/:
```Ini, TOML
API_HOST=0.0.0.0
API_PORT=8000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
REDIS_URL=rediss://default:[TOKEN]@tus-redis.upstash.io:6379
SUPABASE_JWT_SECRET=[TU_LEGACY_JWT_SECRET]
```

---

## Base de Datos

Ejecuta este SQL en tu panel de Supabase para crear las tablas necesarias para la IA:
```SQL
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    status TEXT NOT NULL,
    input_video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    exercise TEXT,
    reps INTEGER,
    score FLOAT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

---

## Ejecución

El sistema requiere 3 terminales simultáneas:
### Terminal 1
```bash
cd web-app/Backend
npm start
```

### Terminal 2
```bash
cd ai-service
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 3
```bash
cd ai-service
python -m worker.worker
```

Visita http://localhost:3000 para usar la aplicación.


---

## Captura de pantalla análisis

![Imagen de WhatsApp 2025-11-27 a las 23 25 08_671729ae](https://github.com/user-attachments/assets/37b16881-3256-4b7a-832f-874c8145360c)

---

## Autor

FitAi - Coach -- Desarrollo fullstack para proyecto universitario
