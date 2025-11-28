import os
import json
import cv2
import numpy as np
import mediapipe as mp
import uuid
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Configuración de BD
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("❌ Error: No se encontró DATABASE_URL en el archivo .env")

engine = create_engine(db_url, pool_pre_ping=True)
mp_pose = mp.solutions.pose

def format_time(ms):
    """Convierte milisegundos a formato MM:SS"""
    seconds = int(ms / 1000)
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes:02d}:{seconds:02d}"

def analyze_squat(video_url: str):
    """
    Analiza sentadillas detectando errores específicos por repetición
    y generando un reporte en lenguaje natural.
    """
    cap = cv2.VideoCapture(video_url)
    if not cap.isOpened():
        raise RuntimeError(f"No se pudo abrir el video: {video_url}")

    reps = 0
    phase = "up"
    
    # Variables para el análisis detallado
    feedback_log = []  # Aquí guardaremos el "minuto a minuto"
    current_rep_min_angle = 180  # Para saber qué tanto bajó en LA repetición actual
    errors_count = {"depth": 0, "form": 0} # Contadores de errores

    with mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            
            # Obtener tiempo actual del video
            timestamp_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
            timestamp_str = format_time(timestamp_ms)

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = pose.process(rgb)

            if not res.pose_landmarks:
                continue

            lm = res.pose_landmarks.landmark
            
            # Puntos clave: 24=Cadera, 26=Rodilla, 28=Tobillo
            hip, knee, ankle = lm[24], lm[26], lm[28]
            
            # Geometría para ángulo de rodilla
            v1 = np.array([hip.x - knee.x, hip.y - knee.y])
            v2 = np.array([ankle.x - knee.x, ankle.y - knee.y])
            
            dot_prod = np.dot(v1, v2)
            mag_v1 = np.linalg.norm(v1)
            mag_v2 = np.linalg.norm(v2)
            
            if mag_v1 * mag_v2 == 0: continue
                
            angle_rad = np.arccos(np.clip(dot_prod / (mag_v1 * mag_v2), -1.0, 1.0))
            angle = float(np.degrees(angle_rad))

            # --- LÓGICA DE DETECCIÓN DE ERRORES ---
            
            # 1. Detectar fase de bajada (Down)
            if angle < 160 and phase == "up":
                phase = "down"
                current_rep_min_angle = 180 # Reiniciamos el rastreo de profundidad

            # 2. Mientras está bajando, buscamos el punto más profundo
            if phase == "down":
                if angle < current_rep_min_angle:
                    current_rep_min_angle = angle

                # 3. Detectar subida (Up) -> Fin de la repetición
                if angle > 160:
                    reps += 1
                    phase = "up"
                    
                    # --- EVALUACIÓN DE LA REPETICIÓN TERMINADA ---
                    
                    # Criterio: Profundidad (Sentadilla paralela es aprox < 90 grados)
                    # Damos un margen hasta 100 grados para principiantes
                    if current_rep_min_angle > 100:
                        msg = "Falta profundidad. Intenta bajar hasta que tus muslos estén paralelos al suelo."
                        tipo = "error"
                        errors_count["depth"] += 1
                        
                        feedback_log.append({
                            "rep": reps,
                            "time": timestamp_str,
                            "type": "Mala Profundidad",
                            "message": msg
                        })
                    
                    elif current_rep_min_angle < 70:
                        # Si baja demasiado podría ser "buttwink" o excelente, depende. 
                        # Lo marcaremos como muy bueno por ahora.
                        feedback_log.append({
                            "rep": reps,
                            "time": timestamp_str,
                            "type": "success",
                            "message": "¡Excelente profundidad!"
                        })
                    else:
                        # Repetición estándar correcta
                        feedback_log.append({
                            "rep": reps,
                            "time": timestamp_str,
                            "type": "success",
                            "message": "Buena repetición."
                        })

    cap.release()

    # --- GENERACIÓN DEL PUNTAJE Y RESUMEN ---
    
    # El puntaje baja si hubo muchos errores de profundidad
    base_score = 10.0
    penalty = (errors_count["depth"] * 1.5) # Restamos 1.5 puntos por cada sentadilla mal hecha
    final_score = max(0, round(base_score - penalty, 1))

    # Crear un resumen escrito para el usuario
    if reps == 0:
        summary = "No pudimos detectar repeticiones. Asegúrate de que tu cuerpo completo sea visible en el video."
    elif errors_count["depth"] > (reps / 2):
        summary = f"Detectamos {reps} repeticiones, pero la mayoría tuvo poca profundidad. Enfócate en bajar más la cadera en cada intento."
    elif errors_count["depth"] > 0:
        summary = f"Buen trabajo general. Hiciste {reps} repeticiones, aunque en {errors_count['depth']} de ellas te faltó bajar un poco más."
    else:
        summary = f"¡Ejecución perfecta! Realizaste {reps} repeticiones con excelente rango de movimiento."

    return {
        "reps": reps, 
        "score": final_score, 
        "details": {
            "summary": summary,            # El texto que mostrarás arriba
            "feedback_list": feedback_log, # La lista detallada minuto a minuto
            "total_errors": errors_count
        }
    }

def run_analysis(job_id: str, video_url: str, exercise: str, video_id: str = None):
    print(f"🔄 Iniciando análisis detallado para: {exercise} (ID: {video_id})")
    
    exercise_clean = exercise.lower().strip()
    
    # Mapeo de ejercicios
    exercise_map = {
        "sentadilla": analyze_squat,
        "squat": analyze_squat
    }

    analyze_fn = exercise_map.get(exercise_clean)

    # Actualizar estado a RUNNING
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE jobs SET status = 'running', updated_at = now() WHERE id = :id"),
            {"id": job_id}
        )

    try:
        if not analyze_fn:
            raise ValueError(f"Ejercicio no soportado: {exercise}")

        # Ejecutar análisis
        result = analyze_fn(video_url)

        # Preparar JSON
        final_analysis_json = json.dumps({
            "reps": result["reps"],
            "score": result["score"],
            "details": result["details"], # Aquí va el feedback log
            "exercise": exercise_clean
        })

        print(f"✅ Análisis completado. Reps: {result['reps']} - Score: {result['score']}")

        # Guardar en BD
        with engine.begin() as conn:
            # Insertar en tabla histórica
            conn.execute(
                text("INSERT INTO analyses(job_id, exercise, reps, score, details) VALUES (:j, :e, :r, :s, :d)"),
                {
                    "j": job_id, 
                    "e": exercise_clean, 
                    "r": result["reps"], 
                    "s": result["score"], 
                    "d": json.dumps(result["details"])
                }
            )
            
            # Actualizar video del usuario
            if video_id:
                conn.execute(
                    text("UPDATE video SET analysis = :ana WHERE id = :vid"),
                    {"ana": final_analysis_json, "vid": video_id}
                )

            # Marcar éxito
            conn.execute(
                text("UPDATE jobs SET status = 'succeeded', updated_at = now() WHERE id = :id"),
                {"id": job_id}
            )

    except Exception as e:
        print(f"❌ Error crítico en análisis: {e}")
        try:
            with engine.begin() as conn:
                conn.execute(text("UPDATE jobs SET status = 'failed' WHERE id = :id"), {"id": job_id})
        except: pass
        raise e