import os
import json
import cv2
import numpy as np
import mediapipe as mp
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel

# 1. Cargar variables de entorno
load_dotenv()

# 2. Configuración de Base de Datos
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("❌ Error: DATABASE_URL no encontrada en el archivo .env")

engine = create_engine(db_url, pool_pre_ping=True, pool_size=10, max_overflow=20)
mp_pose = mp.solutions.pose

# 3. Inicializar la APP (necesario si este archivo también corre FastAPI, si no, se puede omitir)
app = FastAPI()

# Modelo de datos
class AnalysisRequest(BaseModel):
    job_id: str
    video_url: str
    exercise: str
    video_id: str = None

# --- FUNCIONES DE LÓGICA (MATEMÁTICAS) ---

def format_time(ms):
    seconds = int(ms / 1000)
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes:02d}:{seconds:02d}"

def calculate_angle(a, b, c):
    a = np.array([a.x, a.y])
    b = np.array([b.x, b.y])
    c = np.array([c.x, c.y])
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def compile_results(reps, scores, errors, log, exercise_name):
    if reps == 0:
        return {
            "reps": 0, "score": 0.0,
            "details": {"summary": f"No detectamos repeticiones de {exercise_name}. Ajusta la cámara.", "feedback_list": [], "total_errors": errors}
        }
    avg = sum(scores) / len(scores)
    final_score = round(avg, 1)
    summary = f"Hiciste {reps} {exercise_name}."
    if final_score >= 8.5: summary += " ¡Técnica sólida!"
    elif final_score >= 6.0: summary += " Buen esfuerzo, pero cuida los detalles."
    else: summary += " La técnica necesita trabajo."
    return {"reps": reps, "score": final_score, "details": {"summary": summary, "feedback_list": log, "total_errors": errors}}

# --- MOTORES DE ANÁLISIS ---

def analyze_squat(video_url):
    cap = cv2.VideoCapture(video_url)
    if not cap.isOpened(): raise RuntimeError(f"No abre video: {video_url}")
    reps, phase = 0, "up"
    feedback_log, rep_scores = [], []
    min_knee, max_back = 180, 0
    errors = {"depth": 0, "back": 0}

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ok, frame = cap.read()
            if not ok: break
            ts = format_time(cap.get(cv2.CAP_PROP_POS_MSEC))
            res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if not res.pose_landmarks: continue
            lm = res.pose_landmarks.landmark
            
            hip, knee, ankle = lm[24], lm[26], lm[28]
            shoulder = lm[12]
            knee_angle = calculate_angle(hip, knee, ankle)
            vertical = type('o', (object,), {'x': hip.x, 'y': hip.y - 0.5})
            back_angle = calculate_angle(vertical, hip, shoulder)

            if phase == "up" and knee_angle < 160:
                phase, min_knee, max_back = "down", 180, 0
            if phase == "down":
                if knee_angle < min_knee: min_knee = knee_angle
                if back_angle > max_back: max_back = back_angle
                if knee_angle > 165:
                    phase = "up"
                    reps += 1
                    s, msgs = 10.0, []
                    if min_knee > 100: s -= 3.0; errors["depth"]+=1; msgs.append("Baja más.")
                    if max_back > 45: s -= 2.0; errors["back"]+=1; msgs.append("Pecho arriba.")
                    rep_scores.append(max(0, s))
                    feedback_log.append({"rep": reps, "time": ts, "score": max(0, s), "type": "correction" if msgs else "success", "message": " ".join(msgs) or "¡Bien!"})
    cap.release()
    return compile_results(reps, rep_scores, errors, feedback_log, "Sentadilla")

def analyze_pushup(video_url):
    cap = cv2.VideoCapture(video_url)
    reps, phase = 0, "up"
    feedback_log, rep_scores = [], []
    min_elbow, min_body = 180, 180
    errors = {"rom": 0, "hip_sag": 0}

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ok, frame = cap.read()
            if not ok: break
            ts = format_time(cap.get(cv2.CAP_PROP_POS_MSEC))
            res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if not res.pose_landmarks: continue
            lm = res.pose_landmarks.landmark
            
            sh, el, wr = lm[12], lm[14], lm[16]
            hip, ank = lm[24], lm[28]
            elbow_angle = calculate_angle(sh, el, wr)
            body_angle = calculate_angle(sh, hip, ank)

            if phase == "up" and elbow_angle < 150:
                phase, min_elbow, min_body = "down", 180, 180
            if phase == "down":
                if elbow_angle < min_elbow: min_elbow = elbow_angle
                if body_angle < min_body: min_body = body_angle
                if elbow_angle > 160:
                    phase = "up"
                    reps += 1
                    s, msgs = 10.0, []
                    if min_elbow > 95: s -= 3.0; errors["rom"]+=1; msgs.append("Baja el pecho.")
                    if min_body < 160: s -= 2.0; errors["hip_sag"]+=1; msgs.append("Aprieta abdomen.")
                    rep_scores.append(max(0, s))
                    feedback_log.append({"rep": reps, "time": ts, "score": max(0, s), "type": "correction" if msgs else "success", "message": " ".join(msgs) or "¡Bien!"})
    cap.release()
    return compile_results(reps, rep_scores, errors, feedback_log, "Flexiones")

def analyze_pullup(video_url):
    cap = cv2.VideoCapture(video_url)
    reps, phase = 0, "down"
    feedback_log, rep_scores = [], []
    min_elbow = 180
    errors = {"rom_up": 0, "rom_down": 0}

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ok, frame = cap.read()
            if not ok: break
            ts = format_time(cap.get(cv2.CAP_PROP_POS_MSEC))
            res = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if not res.pose_landmarks: continue
            lm = res.pose_landmarks.landmark
            
            wr, el, sh, nose = lm[16], lm[14], lm[12], lm[0]
            elbow_angle = calculate_angle(sh, el, wr)
            chin_cleared = nose.y < wr.y

            if phase == "down" and elbow_angle < 150:
                phase, min_elbow = "up", 180
            if phase == "up":
                if elbow_angle < min_elbow: min_elbow = elbow_angle
                if elbow_angle > 150:
                    phase = "down"
                    reps += 1
                    s, msgs = 10.0, []
                    if min_elbow > 45 and not chin_cleared: s -= 3.0; errors["rom_up"]+=1; msgs.append("Sube más.")
                    if elbow_angle < 160: s -= 2.0; errors["rom_down"]+=1; msgs.append("Estira brazos al bajar.")
                    rep_scores.append(max(0, s))
                    feedback_log.append({"rep": reps, "time": ts, "score": max(0, s), "type": "correction" if msgs else "success", "message": " ".join(msgs) or "¡Potente!"})
    cap.release()
    return compile_results(reps, rep_scores, errors, feedback_log, "Dominadas")

# --- FUNCIÓN PRINCIPAL DE EJECUCIÓN (Corregido: renombrado a run_analysis) ---

def run_analysis(job_id: str, video_url: str, exercise: str, video_id: str = None):
    """
    Función que ejecuta el Worker.
    NOTA: Se llama 'run_analysis' para coincidir con la llamada que hace la cola (RQ).
    """
    print(f"🔄 Procesando Job {job_id} - {exercise}")
    ex = exercise.lower().strip()
    
    # 1. Update running en BD
    try:
        with engine.begin() as conn:
            conn.execute(text("UPDATE jobs SET status = 'running', updated_at = now() WHERE id = :id"), {"id": job_id})
    except Exception as e:
        print(f"⚠️ Error BD Inicial: {e}")
        return

    try:
        # 2. Enrutador de ejercicios
        if any(x in ex for x in ["sentadilla", "squat"]): result = analyze_squat(video_url)
        elif any(x in ex for x in ["flexion", "pushup", "lagartija"]): result = analyze_pushup(video_url)
        elif any(x in ex for x in ["dominada", "pullup"]): result = analyze_pullup(video_url)
        else: raise ValueError(f"Ejercicio no soportado: {exercise}")

        # 3. Guardar Resultados
        final_json = json.dumps({"reps": result["reps"], "score": result["score"], "details": result["details"], "exercise": ex})
        
        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO analyses(job_id, exercise, reps, score, details) VALUES (:j, :e, :r, :s, :d)"),
                {"j": job_id, "e": ex, "r": result["reps"], "s": result["score"], "d": json.dumps(result["details"])}
            )
            if video_id:
                conn.execute(text("UPDATE video SET analysis = :ana WHERE id = :vid"), {"ana": final_json, "vid": video_id})
            
            conn.execute(text("UPDATE jobs SET status = 'succeeded', updated_at = now() WHERE id = :id"), {"id": job_id})
            
        print(f"✅ Job {job_id} completado con éxito. Score: {result['score']}")

    except Exception as e:
        print(f"❌ Error Job {job_id}: {e}")
        try:
            with engine.begin() as conn:
                conn.execute(text("UPDATE jobs SET status = 'failed' WHERE id = :id"), {"id": job_id})
        except: pass