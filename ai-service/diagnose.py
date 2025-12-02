import sys
import os
import traceback

print("--- 1. VERIFICACIÓN DE ARCHIVOS ---")
print(f"Directorio actual: {os.getcwd()}")
if os.path.exists("app/tasks.py"):
    print("✅ El archivo 'app/tasks.py' EXISTE.")
else:
    print("❌ El archivo 'app/tasks.py' NO EXISTE. (Revisa el nombre)")

print("\n--- 2. PRUEBA DE IMPORTACIÓN (Aquí saldrá la verdad) ---")
try:
    # Intentamos importar manualmente para ver si explota
    import app.tasks
    print("✅ Importación exitosa.")
    
    if hasattr(app.tasks, 'run_analysis'):
        print("✅ La función 'run_analysis' está disponible.")
    else:
        print("❌ El archivo carga, pero NO TIENE la función 'run_analysis'.")
        
except Exception:
    print("🔥 ERROR CRÍTICO AL IMPORTAR 'app.tasks':")
    print("Este es el error que el worker te estaba ocultando:")
    print("-" * 30)
    traceback.print_exc()
    print("-" * 30)