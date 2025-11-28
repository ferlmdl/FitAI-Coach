# ai-service/diagnostico.py
from dotenv import load_dotenv
import sys
import os

print("--- INICIANDO DIAGNÓSTICO ---")
load_dotenv()

print(f"1. Directorio actual: {os.getcwd()}")
print(f"2. PYTHONPATH: {sys.path[0]}")

try:
    print("3. Intentando importar app.tasks...")
    import app.tasks
    print("   ✅ Módulo 'app.tasks' importado correctamente.")
    
    print("4. Buscando función 'run_analysis'...")
    if hasattr(app.tasks, 'run_analysis'):
        print("   ✅ Función 'run_analysis' encontrada.")
    else:
        print("   ❌ ERROR: La función 'run_analysis' NO existe en 'app.tasks'.")
        print("   Contenido del archivo:", dir(app.tasks))

except ImportError as e:
    print(f"❌ ERROR DE IMPORTACIÓN: {e}")
except Exception as e:
    print(f"❌ EL ARCHIVO CRASHEÓ AL CARGARSE: {e}")
    import traceback
    traceback.print_exc()

print("--- FIN DEL DIAGNÓSTICO ---")