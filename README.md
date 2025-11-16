# FitAI - Coach

**Tu entrenador personal de IA para perfeccionar tu técnica de ejercicio.**

<img width="1089" height="709" alt="image" src="https://github.com/user-attachments/assets/c13d5d4c-306f-4d46-bc59-cfc8c6b8e13e" />


FitAI - Coach es una plataforma web que utiliza inteligencia artificial para analizar videos de tus rutinas de ejercicio. Sube un video y recibe un reporte detallado con correcciones, sugerencias y marcas de tiempo exactas para ayudarte a mejorar tu forma y prevenir lesiones.

## Características Principales

* **Análisis de Postura:** Detección precisa de la forma y el movimiento mediante IA.
* **Reportes Detallados:** Recibe feedback específico sobre tus ejercicios (ej. sentadillas, peso muerto, etc.).
* **Correcciones y Sugerencias:** Identifica errores comunes (ej. "rodillas valgas", "espalda baja arqueada") y te muestra cómo mejorar.
* **Marcas de Tiempo:** Salta directamente al minuto y segundo exacto del error en tu video.
* **Interfaz Sencilla:** Un flujo simple de carga y visualización de resultados.

---

## Tecnología y Funcionamiento

El núcleo de FitAI - Coach está potenciado por **MediaPipe** (de Google) para el análisis y estimación de posturas (Pose Estimation).

El flujo de trabajo es el siguiente:
1.  **Carga:** El usuario sube un video de su rutina a la plataforma web.
2.  **Procesamiento:** El backend procesa el video frame por frame utilizando MediaPipe para extraer los puntos clave (landmarks) del cuerpo.
3.  **Análisis:** Nuestros algoritmos comparan los ángulos y posiciones del cuerpo detectados con un modelo ideal del ejercicio.
4.  **Reporte:** Se genera un reporte detallado que se presenta al usuario, indicando los errores detectados, las sugerencias de mejora y los timestamps.

### Stack Tecnológico
* **Frontend:** Motor de plantillas de hbs
* **Backend:** Node.js
* **IA / Visión por Computadora:** MediaPipe, OpenCV
* **Base de Datos:** Supabase (SQL)
* **Despliegue:** Render

---

## Cómo Empezar (Getting Started)

Sigue estos pasos para correr el proyecto en tu máquina local.

### Prerrequisitos
Asegúrate de tener instalados:
* Node.js v18 o superior

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone [https://github.com/](https://github.com/)[TU_USUARIO]/FitAI-Coach.git
    ```
2.  Navega al directorio del proyecto:
    ```bash
    cd FitAI-Coach
    ```
3.  Instala las dependencias:
    ```bash
    # Ejemplo para el backend
    cd backend
    pip install -r requirements.txt
    
    # Ejemplo para el frontend
    cd ../frontend
    npm install
    ```
4.  Configura tus variables de entorno:
    ```bash
    el env con las claves desde tu base de datos supabase
    ```

### Ejecución

1.  Inicia el servidor backend (desde la carpeta `/backend`):
    ```bash
    
    ```
2.  Inicia la aplicación frontend (desde la carpeta `/frontend`):
    ```bash
    npm start
    ```
3.  Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Uso de la Aplicación

1.  Visita la página principal.
2.  Arrastra y suelta o selecciona tu archivo de video.
3.  Espera a que el análisis se complete.
4.  ¡Revisa tu reporte y mejora tu técnica!

---

## Contribuciones

Las contribuciones son bienvenidas. Si quieres mejorar FitAI - Coach, por favor:
1.  Haz un "Fork" del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3.  Haz tus cambios y haz "Commit" (`git commit -m 'Añade nueva funcionalidad'`).
4.  Haz "Push" a la rama (`git push origin feature/nueva-funcionalidad`).
5.  Abre un "Pull Request".

---

## Extra

Este proyecto es un trabajo universitario.
