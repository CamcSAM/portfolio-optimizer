from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

USERS = {"admin": "admin123"}


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(req: LoginRequest):
    if USERS.get(req.username) != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": f"token-{req.username}", "username": req.username}
