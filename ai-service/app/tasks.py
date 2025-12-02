import os
import json
import cv2
import numpy as np
import mediapipe as mp
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Configuración de Base de Datos
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("❌ Error: No se encontró DATABASE_URL en el archivo .env")

engine = create_engine(
    db_url, 
    pool_pre_ping=True, 
    pool_size=10, 
    max_overflow=20
)

mp_pose = mp.solutions.pose

def format_time(ms):
    seconds = int(ms / 1000)
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes:02d}:{seconds:02d}"

def analyze_squat(video_url: str):
    cap = cv2.VideoCapture(video_url)
    if not cap.isOpened():
        raise RuntimeError(f"No se pudo abrir el video: {video_url}")

    reps = 0
    phase = "up"
    feedback_log = []  
    current_rep_min_knee_angle = 180
    current_rep_max_back_angle = 0
    errors_count = {"depth": 0, "back": 0} 
    rep_scores = []

    with mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ok, frame = cap.read()
            if not ok: break
            
            timestamp_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
            timestamp_str = format_time(timestamp_ms)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = pose.process(rgb)

            if not res.pose_landmarks: continue
            lm = res.pose_landmarks.landmark
            
            # Puntos clave (Derechos)
            shoulder = lm[12]
            hip = lm[24]
            knee = lm[26]
            ankle = lm[28]
            
            # Vectores
            v_femur = np.array([hip.x - knee.x, hip.y - knee.y])
            v_tibia = np.array([ankle.x - knee.x, ankle.y - knee.y])
            mag_femur = np.linalg.norm(v_femur)
            mag_tibia = np.linalg.norm(v_tibia)
            if mag_femur * mag_tibia == 0: continue
            
            dot_prod = np.dot(v_femur, v_tibia)
            angle_rad = np.arccos(np.clip(dot_prod / (mag_femur * mag_tibia), -1.0, 1.0))
            knee_angle = float(np.degrees(angle_rad))

            # Inclinación espalda
            v_vertical = np.array([0, -1]) 
            v_back = np.array([shoulder.x - hip.x, shoulder.y - hip.y])
            mag_back = np.linalg.norm(v_back)
            back_angle = 0
            if mag_back > 0:
                back_dot = np.dot(v_back, v_vertical)
                back_angle = float(np.degrees(np.arccos(np.clip(back_dot / mag_back, -1.0, 1.0))))

            # Detección repetición
            if knee_angle < 160 and phase == "up":
                phase = "down"
                current_rep_min_knee_angle = 180
                current_rep_max_back_angle = 0

            if phase == "down":
                if knee_angle < current_rep_min_knee_angle: current_rep_min_knee_angle = knee_angle
                if back_angle > current_rep_max_back_angle: current_rep_max_back_angle = back_angle

                if knee_angle > 165: 
                    reps += 1
                    phase = "up"
                    rep_score = 10.0
                    feedbacks = []

                    if current_rep_min_knee_angle > 100: 
                        rep_score -= 3.0
                        errors_count["depth"] += 1
                        feedbacks.append("Baja más la cadera.")
                    elif current_rep_min_knee_angle < 75: pass 

                    if current_rep_max_back_angle > 45: 
                        rep_score -= 2.0
                        errors_count["back"] += 1
                        feedbacks.append("Mantén el pecho arriba.")

                    rep_score = max(0, rep_score)
                    rep_scores.append(rep_score)
                    
                    type_msg = "success" if rep_score >= 9 else "correction"
                    msg_text = "¡Buena!" if not feedbacks else " ".join(feedbacks)
                    feedback_log.append({
                        "rep": reps, "time": timestamp_str, "type": type_msg, "message": msg_text, "score": rep_score
                    })

    cap.release()
    
    if reps == 0:
        final_score = 0.0
        summary = "No se detectaron repeticiones válidas. Asegúrate de que tu cuerpo completo sea visible."
    else:
        avg_score = sum(rep_scores) / len(rep_scores)
        final_score = round(avg_score, 1)
        if final_score >= 9.0: summary = f"¡Excelente! Realizaste {reps} repeticiones con técnica casi perfecta."
        elif final_score >= 6.0: 
            detalles = []
            if errors_count["depth"] > 0: detalles.append("mejorar la profundidad")
            if errors_count["back"] > 0: detalles.append("mantener la espalda recta")
            summary = f"Buen trabajo ({reps} reps). Para llegar al 10, enfócate en: {', '.join(detalles)}."
        else: summary = f"Detectamos {reps} repeticiones, pero la técnica necesita ajustes importantes."

    return {
        "reps": reps, 
        "score": final_score, 
        "details": {"summary": summary, "feedback_list": feedback_log, "total_errors": errors_count}
    }

# ESTA ES LA FUNCIÓN QUE LE FALTABA A TU ARCHIVO ANTERIOR
def run_analysis(job_id: str, video_url: str, exercise: str, video_id: str = None):
    print(f"Iniciando análisis para: {exercise} (Job ID: {job_id})")
    exercise_clean = exercise.lower().strip()
    
    # 1. Marcar Job como 'running'
    try:
        with engine.begin() as conn:
            conn.execute(text("UPDATE jobs SET status = 'running', updated_at = now() WHERE id = :id"), {"id": job_id})
    except Exception as e:
        print(f"Error BD inicio: {e}")
        return

    try:
        # 2. Ejecutar Análisis (Solo sentadilla soportado por ahora)
        if "sentadilla" in exercise_clean or "squat" in exercise_clean:
            result = analyze_squat(video_url)
        else:
            raise ValueError(f"Ejercicio no soportado: {exercise}")

        final_json = json.dumps({
            "reps": result["reps"], "score": result["score"],
            "details": result["details"], "exercise": exercise_clean
        })

        # 3. Guardar Resultados
        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO analyses(job_id, exercise, reps, score, details) VALUES (:j, :e, :r, :s, :d)"),
                {"j": job_id, "e": exercise_clean, "r": result["reps"], "s": result["score"], "d": json.dumps(result["details"])}
            )
            if video_id:
                conn.execute(text("UPDATE video SET analysis = :ana WHERE id = :vid"), {"ana": final_json, "vid": video_id})
            
            conn.execute(text("UPDATE jobs SET status = 'succeeded', updated_at = now() WHERE id = :id"), {"id": job_id})
            print(f"Análisis completado. Score: {result['score']}")

    except Exception as e:
        print(f"Error crítico: {e}")
        try:
            with engine.begin() as conn:
                conn.execute(text("UPDATE jobs SET status = 'failed' WHERE id = :id"), {"id": job_id})
        except: pass
        raise e