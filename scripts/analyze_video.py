import sys
import json

def analyze_video(video_path):
    # Aquí va tu lógica real con MediaPipe
    # Ejemplo de respuesta simulada:
    analysis = {
        "errors": [
            {"minute": 1, "exercise": "sentadilla", "mistake": "espalda encorvada"},
            {"minute": 3, "exercise": "lagartija", "mistake": "codos muy abiertos"}
        ],
        "summary": "Se detectaron errores en la postura en 2 ejercicios."
    }
    return analysis

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No se proporcionó el path del video"}))
        sys.exit(1)
    video_path = sys.argv[1]
    result = analyze_video(video_path)
    print(json.dumps(result))