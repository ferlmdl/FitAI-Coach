import os
import redis
from rq import SimpleWorker
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL")
if not redis_url:
    raise RuntimeError("No se encontró REDIS_URL en el archivo .env")

conn = redis.from_url(redis_url)

if __name__ == "__main__":
    try:
        print(f"Worker (Modo Windows) conectado a Redis...")
        
        w = SimpleWorker(["fitai"], connection=conn)
        
        print("Escuchando tareas en la cola 'fitai'...")
        w.work(with_scheduler=True)
        
    except Exception as e:
        print(f"❌ Error iniciando el worker: {e}")