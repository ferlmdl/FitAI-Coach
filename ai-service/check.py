# check.py
import sys
import os

# Asegura que estamos mirando la carpeta actual
sys.path.append(os.getcwd())

print("🔍 Buscando archivo y función...")

try:
    # Intenta importar tal cual lo hace el worker
    from app import tasks
    print(f"✅ Archivo 'tasks.py' encontrado en: {tasks.__file__}")

    if hasattr(tasks, 'run_analysis'):
        print("✅ ¡ÉXITO! La función 'run_analysis' existe y es accesible.")
    else:
        print("❌ ERROR: El archivo 'tasks.py' existe, pero NO tiene la función 'run_analysis'.")
        print("   --> Posiblemente editaste 'task.py' pero el worker lee 'tasks.py'.")
        print("   --> O el archivo no se guardó correctamente.")

except ImportError as e:
    print(f"❌ ERROR DE IMPORTACIÓN: {e}")
    if os.path.exists("app/task.py"):
        print("💡 AVISO: Tienes un archivo 'app/task.py' (singular).")
        print("   El worker busca 'tasks.py' (plural).")
    else:
        print("   No encuentro ni 'task.py' ni 'tasks.py'.")