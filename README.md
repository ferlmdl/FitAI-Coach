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
