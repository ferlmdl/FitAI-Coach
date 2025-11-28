# ai-service/app/deps.py
import os
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
JWT_ALGORITHM = "HS256"

async def get_current_user(authorization: str | None = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing Bearer token")
    
    token = authorization.split(" ")[1]
    token = token.replace('"', '').strip()

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},
        )
        print("Token validado y firma verificada correctamente.")
        
    except Exception as e:
        print(f"Error validando: {e}")
        raise HTTPException(401, "Invalid token")
    
    return {"id": payload.get("sub"), "email": payload.get("email")}
