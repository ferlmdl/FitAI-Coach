"""
Unified pipeline (classification + squat evaluation)

1) Entrena un clasificador desde angulos_dataset.csv (por video).
2) Procesa un video nuevo y calcula ángulos por frame.
3) Predice el ejercicio.
4) Si detecta/sospecha "Sentadilla", corre SquatEvaluator y entrega feedback.

Requisitos:
    pip install numpy pandas scikit-learn mediapipe opencv-python
(o headless en servidores):
    pip install numpy pandas scikit-learn mediapipe opencv-python-headless
"""

from pathlib import Path
import cv2
import numpy as np
import pandas as pd
from dataclasses import dataclass

import mediapipe as mp
mp_pose = mp.solutions.pose

CSV_PATH      = "/home/imsebs/mediapipe-env/angulos_dataset.csv"
VIDEO_PATH    = "/home/imsebs/mediapipe-env/videos/Sentadilla/sentadilla1.mp4"

# Procesar 1 de cada N frames (para acelerar)
SKIP_FRAMES   = 5

# Umbral de confianza para considerar "predicción segura"
CONFIDENCE_THRESHOLD = 0.70

# Forzar ejecución del evaluador de sentadilla (para pruebas rápidas)
FORCE_SQUAT_EVAL = False
# DEFINICIÓN DE ÁNGULOS
ANGLE_DEFS = {
    "elbow_right":    (mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_ELBOW, mp_pose.PoseLandmark.RIGHT_WRIST),
    "elbow_left":     (mp_pose.PoseLandmark.LEFT_SHOULDER,  mp_pose.PoseLandmark.LEFT_ELBOW,  mp_pose.PoseLandmark.LEFT_WRIST),
    "shoulder_right": (mp_pose.PoseLandmark.RIGHT_ELBOW,    mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP),
    "shoulder_left":  (mp_pose.PoseLandmark.LEFT_ELBOW,     mp_pose.PoseLandmark.LEFT_SHOULDER,  mp_pose.PoseLandmark.LEFT_HIP),
    "hip_right":      (mp_pose.PoseLandmark.RIGHT_SHOULDER, mp_pose.PoseLandmark.RIGHT_HIP,   mp_pose.PoseLandmark.RIGHT_KNEE),
    "hip_left":       (mp_pose.PoseLandmark.LEFT_SHOULDER,  mp_pose.PoseLandmark.LEFT_HIP,    mp_pose.PoseLandmark.LEFT_KNEE),
    "knee_right":     (mp_pose.PoseLandmark.RIGHT_HIP,      mp_pose.PoseLandmark.RIGHT_KNEE,  mp_pose.PoseLandmark.RIGHT_ANKLE),
    "knee_left":      (mp_pose.PoseLandmark.LEFT_HIP,       mp_pose.PoseLandmark.LEFT_KNEE,   mp_pose.PoseLandmark.LEFT_ANKLE),
    "ankle_right":    (mp_pose.PoseLandmark.RIGHT_KNEE,     mp_pose.PoseLandmark.RIGHT_ANKLE, mp_pose.PoseLandmark.RIGHT_FOOT_INDEX),
    "ankle_left":     (mp_pose.PoseLandmark.LEFT_KNEE,      mp_pose.PoseLandmark.LEFT_ANKLE,  mp_pose.PoseLandmark.LEFT_FOOT_INDEX),
}

LM_KEYS = {
    "LS":  mp_pose.PoseLandmark.LEFT_SHOULDER,
    "RS":  mp_pose.PoseLandmark.RIGHT_SHOULDER,
    "LH":  mp_pose.PoseLandmark.LEFT_HIP,
    "RH":  mp_pose.PoseLandmark.RIGHT_HIP,
    "LK":  mp_pose.PoseLandmark.LEFT_KNEE,
    "RK":  mp_pose.PoseLandmark.RIGHT_KNEE,
    "LA":  mp_pose.PoseLandmark.LEFT_ANKLE,
    "RA":  mp_pose.PoseLandmark.RIGHT_ANKLE,
    "LFI": mp_pose.PoseLandmark.LEFT_FOOT_INDEX,
    "RFI": mp_pose.PoseLandmark.RIGHT_FOOT_INDEX,
}

def compute_angle(a, b, c):
    """
    Calcula el ángulo en grados ∠ABC a partir de 3 puntos 3D (x,y,z).
    Maneja casos degenerados devolviendo NaN si no hay magnitud.
    """
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba, bc = a - b, c - b
    nba, nbc = np.linalg.norm(ba), np.linalg.norm(bc)
    if nba == 0 or nbc == 0:
        return np.nan
    cos_ang = np.dot(ba, bc) / (nba * nbc)
    cos_ang = np.clip(cos_ang, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_ang)))

def lm_point(landmarks, lm_enum):
    """ Convierte un landmark de MediaPipe a tupla (x, y, z). """
    lm = landmarks[lm_enum.value]
    return (lm.x, lm.y, lm.z)

def process_video(video_path, skip=SKIP_FRAMES):
    """
    Procesa el video con MediaPipe Pose y devuelve:
      - df_angles: DataFrame con ángulos por frame (columnas = ANGLE_DEFS.keys()).
      - df_lm:     DataFrame con x,y de landmarks clave (sufijos _x/_y).
    Solo se procesan frames cada 'skip' para acelerar.
    """
    angle_cols = list(ANGLE_DEFS.keys())
    rows_angles, rows_lm = [], []

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as pose:
        cap = cv2.VideoCapture(str(video_path))
        idx = 0
        while cap.isOpened():
            ok, frame = cap.read()
            if not ok:
                break
            idx += 1
            if idx % skip != 0:
                continue

            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)
            if results.pose_landmarks is None:
                continue

            lms = results.pose_landmarks.landmark

            # Ángulos por frame
            angle_row = {}
            for name, (p1, p2, p3) in ANGLE_DEFS.items():
                a = lm_point(lms, p1); b = lm_point(lms, p2); c = lm_point(lms, p3)
                ang = compute_angle(a, b, c)
                angle_row[name] = np.nan if np.isnan(ang) else round(ang, 3)
            rows_angles.append(angle_row)

            # Landmarks clave (x,y) por frame
            lm_row = {}
            for key, enumv in LM_KEYS.items():
                x, y, _ = lm_point(lms, enumv)
                lm_row[f"{key}_x"] = x
                lm_row[f"{key}_y"] = y
            rows_lm.append(lm_row)

        cap.release()

    # Construcción de DataFrames (evitando filas con NaN en ángulos)
    df_angles = pd.DataFrame(rows_angles).dropna(axis=0, how="any") if rows_angles else pd.DataFrame(columns=angle_cols)
    df_lm     = pd.DataFrame(rows_lm) if rows_lm else pd.DataFrame(columns=[f"{k}_{c}" for k in LM_KEYS.keys() for c in ("x","y")])
    return df_angles, df_lm

def extract_basic_features(df_angles):
    """
    Resume todos los frames del video en un vector de features:
      - mean, std y range de cada ángulo
      - promedios de rango parte superior vs inferior
      - diferencia lower-upper (movilidad de piernas - movilidad de brazos)
    """
    if df_angles is None or df_angles.empty:
        return {}
    feats = {}
    for col in df_angles.columns:
        s = df_angles[col].astype(float)
        feats[f"{col}_mean"] = float(np.nanmean(s))
        feats[f"{col}_std"]  = float(np.nanstd(s))
        feats[f"{col}_rng"]  = float(np.nanmax(s) - np.nanmin(s))

    upper = ["elbow_right","elbow_left","shoulder_right","shoulder_left"]
    lower = ["hip_right","hip_left","knee_right","knee_left","ankle_right","ankle_left"]

    def agg(cols):
        vals = [feats.get(f"{c}_rng", 0.0) for c in cols]
        return float(np.mean(vals)) if vals else 0.0

    feats["upper_body_range_mean"] = agg(upper)
    feats["lower_body_range_mean"] = agg(lower)
    feats["lower_minus_upper_range"] = feats["lower_body_range_mean"] - feats["upper_body_range_mean"]
    return feats

def train_model(csv_path):
    """
    Entrena RandomForest por video:
      - Lee CSV (frames con ángulos y label).
      - Agrupa por (video,label) y calcula features del grupo.
      - Ajusta el modelo y retorna (modelo, columnas_features).
    """
    from sklearn.ensemble import RandomForestClassifier
    df = pd.read_csv(csv_path)
    if "video" not in df.columns or "label" not in df.columns:
        raise ValueError("Invalid CSV: missing 'video' or 'label'.")

    # Columnas de ángulos = todo excepto metadatos
    angle_cols = [c for c in df.columns if c not in ["video","frame","label"]]
    for c in angle_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df = df.dropna(axis=0, how="any")

    groups = []
    for (video, label), sub in df.groupby(["video","label"]):
        feats = extract_basic_features(sub[angle_cols])
        if feats:
            feats["video"] = video
            feats["label"] = label
            groups.append(feats)
    if not groups:
        raise ValueError("Could not build per-video features from CSV.")

    feats_df = pd.DataFrame(groups)
    X = feats_df.drop(columns=["video","label"])
    y = feats_df["label"]

    model = RandomForestClassifier(n_estimators=300, random_state=42)
    model.fit(X, y)
    return model, list(X.columns)

def predict_topk(model, feat_cols, df_angles, k=3):
    """
    Predice y devuelve:
      - pred (clase principal)
      - conf (probabilidad de esa clase)
      - topk: lista [(clase, prob), ...] ordenada desc
    """
    feats = extract_basic_features(df_angles)
    # Construye el vector en el MISMO orden de feat_cols que vio el modelo
    x = np.array([feats.get(col, 0.0) for col in feat_cols], dtype=float).reshape(1, -1)
    classes = model.classes_
    try:
        probs = model.predict_proba(x)[0]
    except Exception:
        # Fallback si no hay predict_proba
        pred = model.predict(x)[0]
        return pred, None, [(pred, None)]

    order = np.argsort(probs)[::-1]
    top_idx = order[:k]
    topk = [(classes[i], float(probs[i])) for i in top_idx]
    pred, conf = topk[0]
    return pred, conf, topk

@dataclass
class EvalResult:
    ok: bool
    score: float
    messages: list  # feedback textual

class SquatEvaluator:
    """
    Reglas simples:
      - Base: ancho de pies / ancho de hombros en [0.9, 1.3] (mediana del video).
      - Espalda en la parte baja: inclinación <= 12° (percentil 25 de los frames "bottom").
      - Profundidad: min(ángulo de rodilla) < 85° o cadera_y >= rodilla_y - 0.02.
    """
    FEET_SHOULDERS_MIN = 0.90
    FEET_SHOULDERS_MAX = 1.30
    BACK_TILT_MAX_DEG  = 12.0
    KNEE_MIN_ANGLE     = 85.0
    HIP_KNEE_Y_MARGIN  = 0.02  # coordenadas normalizadas; y crece hacia abajo

    def evaluate(self, df_angles: pd.DataFrame, df_lm: pd.DataFrame) -> EvalResult:
        msgs = []
        if df_angles.empty or df_lm.empty:
            return EvalResult(False, 0.0, ["No se detectó pose suficiente para evaluar."])

        # --- A) Base: ancho de pies vs hombros (mediana)
        feet_w = np.abs(df_lm["RFI_x"] - df_lm["LFI_x"])
        sh_w   = np.abs(df_lm["RS_x"]  - df_lm["LS_x"])
        ratio  = np.median((feet_w / (sh_w + 1e-6)).clip(0, 5))
        if ratio < self.FEET_SHOULDERS_MIN:
            msgs.append(f"Base muy angosta: pies/hombros={ratio:.2f} (<{self.FEET_SHOULDERS_MIN}). Abre un poco más los pies.")
            base_ok = False
        elif ratio > self.FEET_SHOULDERS_MAX:
            msgs.append(f"Base muy ancha: pies/hombros={ratio:.2f} (>{self.FEET_SHOULDERS_MAX}). Cierra un poco la base.")
            base_ok = False
        else:
            msgs.append(f"✅ Base adecuada (pies/hombros≈{ratio:.2f}).")
            base_ok = True

        # --- B) Frames "bottom": donde el ángulo de rodilla es mínimo
        knee_cols = [c for c in df_angles.columns if "knee" in c]
        knee_mean = df_angles[knee_cols].mean(axis=1) if knee_cols else pd.Series(np.full(len(df_angles), 180.0))
        thresh = np.percentile(knee_mean, 15)
        bottom_idx = knee_mean.index[knee_mean <= thresh]
        if len(bottom_idx) == 0:
            bottom_idx = knee_mean.index

        # --- C) Inclinación de espalda (medida como ángulo agudo contra vertical)
        sh_cx = (df_lm.loc[bottom_idx, "LS_x"] + df_lm.loc[bottom_idx, "RS_x"]) / 2.0
        sh_cy = (df_lm.loc[bottom_idx, "LS_y"] + df_lm.loc[bottom_idx, "RS_y"]) / 2.0
        hip_cx = (df_lm.loc[bottom_idx, "LH_x"] + df_lm.loc[bottom_idx, "RH_x"]) / 2.0
        hip_cy = (df_lm.loc[bottom_idx, "LH_y"] + df_lm.loc[bottom_idx, "RH_y"]) / 2.0

        vx = sh_cx.values - hip_cx.values
        vy = sh_cy.values - hip_cy.values
        # Compara el vector tronco con la vertical hacia abajo (0,1)
        cosines = np.clip(vy / (np.sqrt(vx**2 + vy**2) + 1e-6), -1.0, 1.0)
        trunk_deg = np.degrees(np.arccos(cosines))
        # Hacerlo agudo (0..90) para que sea interpretable (evita 146°, etc.)
        trunk_deg = np.minimum(trunk_deg, 180.0 - trunk_deg)
        trunk_stat = np.percentile(trunk_deg, 25)

        if trunk_stat > self.BACK_TILT_MAX_DEG:
            msgs.append(f"Espalda inclinada en la fase baja (~{trunk_stat:.1f}°). Mantén el tronco más vertical (<= {self.BACK_TILT_MAX_DEG}°).")
            back_ok = False
        else:
            msgs.append(f"✅ Espalda relativamente recta en la fase baja (~{trunk_stat:.1f}°).")
            back_ok = True

        # --- D) Profundidad: por rodilla y por línea cadera/rodilla
        min_knee = float(np.min(knee_mean)) if len(knee_mean) else 180.0
        hip_y_bottom = np.median(hip_cy.values) if len(hip_cy) else 0.0
        knee_y_bottom = np.median(((df_lm.loc[bottom_idx, "LK_y"] + df_lm.loc[bottom_idx, "RK_y"]) / 2.0).values) if len(bottom_idx) else 0.0

        depth_ok = False
        if min_knee < self.KNEE_MIN_ANGLE:
            depth_ok = True
            msgs.append(f"✅ Profundidad por ángulo de rodilla (mín ≈ {min_knee:.1f}° < {self.KNEE_MIN_ANGLE}°).")
        else:
            msgs.append(f"Profundidad insuficiente por ángulo de rodilla (mín ≈ {min_knee:.1f}°, objetivo < {self.KNEE_MIN_ANGLE}°).")

        if hip_y_bottom >= (knee_y_bottom - self.HIP_KNEE_Y_MARGIN):
            depth_ok = True
            msgs.append("✅ Cadera alcanza/superpone la línea de la rodilla en la fase baja.")
        else:
            msgs.append("Cadera no alcanza la línea de la rodilla; baja un poco más controlado.")

        # --- E) Puntaje total simple (0..100)
        score = (35 if base_ok else 0) + (35 if back_ok else 0) + (30 if depth_ok else 0)
        ok = score >= 75
        if ok:
            msgs.append(f"🏁 Evaluación general: CORRECTA (score {score}/100).")
        else:
            msgs.append(f"🏁 Evaluación general: MEJORABLE (score {score}/100).")
        if not base_ok:
            msgs.append("• Ajusta la base: busca que el ancho de pies ≈ ancho de hombros.")
        if not back_ok:
            msgs.append("• Mantén el pecho erguido y la espalda neutra (evita inclinarte adelante).")
        if not depth_ok:
            msgs.append("• Trabaja profundidad: baja con control hasta que la cadera quede a la altura de las rodillas o por debajo.")

        return EvalResult(ok, float(score), msgs)


if __name__ == "__main__":
    # Validación de rutas
    csv_path = Path(CSV_PATH).expanduser().resolve()
    vid_path = Path(VIDEO_PATH).expanduser().resolve()
    if not csv_path.exists():
        raise FileNotFoundError(f"No existe el CSV: {csv_path}")
    if not vid_path.exists():
        raise FileNotFoundError(f"No existe el video: {vid_path}")

    # 1) Entrenamiento del modelo
    print(f"[INFO] Entrenando clasificador con: {csv_path}")
    model, feat_cols = train_model(str(csv_path))

    # 2) Procesamiento del video nuevo
    print(f"[INFO] Procesando video: {vid_path}")
    df_angles, df_lm = process_video(str(vid_path), skip=SKIP_FRAMES)
    print(f"[INFO] Frames válidos con pose: {len(df_angles)}")
    if df_angles.empty:
        print("[ERROR] MediaPipe no detectó pose suficiente en el video.")
        raise SystemExit(1)

    # 3) Clasificación con top-3 + umbral
    label, conf, top3 = predict_topk(model, feat_cols, df_angles, k=3)

    print("\n=== PROBABILIDADES (top-3) ===")
    for cls, prob in top3:
        if prob is None:
            print(f"  {cls}: N/A")
        else:
            print(f"  {cls}: {prob:.2f}")

    conf_txt = f" (conf {conf:.2f})" if conf is not None else ""
    print(f"\n=== CLASIFICACIÓN ===\nEjercicio detectado: {label}{conf_txt}")

    # 4) Cuándo correr el evaluador de sentadilla:
    #    - si el label empieza con "sentad"
    #    - o si "sentadilla" está en el top-2
    #    - o si la confianza es baja pero "sentadilla" aparece en el top-3
    #    - o si FORCE_SQUAT_EVAL = True
    top2_classes = [c for c, _ in top3[:2]]
    has_squat_in_top2 = any(str(c).lower().startswith("sentad") for c in top2_classes)

    should_eval_squat = (
        FORCE_SQUAT_EVAL
        or str(label).lower().startswith("sentad")
        or has_squat_in_top2
        or (conf is not None and conf < CONFIDENCE_THRESHOLD and "sentadilla" in [str(c).lower() for c, _ in top3])
    )

    if should_eval_squat:
        print("\n=== EVALUACIÓN DE SENTADILLA ===")
        evaluator = SquatEvaluator()
        result = evaluator.evaluate(df_angles, df_lm)
        for m in result.messages:
            print(m)
    else:
        print("\n(No se ejecuta evaluador específico. Si quieres forzarlo, pon FORCE_SQUAT_EVAL=True)")
