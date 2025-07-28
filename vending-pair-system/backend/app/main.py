from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import jwt
import hashlib
from datetime import datetime, timedelta, timezone
import asyncio
from contextlib import asynccontextmanager


SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

users_db = {}
pairs_db = []
user_id_counter = 1
pair_id_counter = 1

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: int
    name: str
    email: str

class PairCreate(BaseModel):
    partner_id: int

class Pair(BaseModel):
    id: int
    user_id_1: int
    user_id_2: int
    pair_date: str

class Token(BaseModel):
    access_token: str
    token_type: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = users_db.get(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_week_start(date: datetime) -> datetime:
    days_since_monday = date.weekday()
    week_start = date - timedelta(days=days_since_monday)
    return week_start.replace(hour=0, minute=0, second=0, microsecond=0)

def is_same_week(date1: datetime, date2: datetime) -> bool:
    return get_week_start(date1) == get_week_start(date2)

async def weekly_reset_task():
    while True:
        now = datetime.now(timezone.utc)
        if now.weekday() == 0 and now.hour == 0 and now.minute == 0:
            global pairs_db
            week_start = get_week_start(now)
            pairs_db = [pair for pair in pairs_db if not is_same_week(datetime.fromisoformat(pair["pair_date"]), now)]
        await asyncio.sleep(60)

def init_sample_data():
    global user_id_counter, users_db
    sample_users = [
        {"name": "田中太郎", "email": "tanaka@company.com", "password": "password123"},
        {"name": "佐藤花子", "email": "sato@company.com", "password": "password123"},
        {"name": "鈴木一郎", "email": "suzuki@company.com", "password": "password123"},
        {"name": "高橋美咲", "email": "takahashi@company.com", "password": "password123"},
        {"name": "山田健太", "email": "yamada@company.com", "password": "password123"},
    ]
    
    for user_data in sample_users:
        users_db[user_id_counter] = {
            "id": user_id_counter,
            "name": user_data["name"],
            "email": user_data["email"],
            "password": hash_password(user_data["password"])
        }
        user_id_counter += 1

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_sample_data()
    task = asyncio.create_task(weekly_reset_task())
    yield
    task.cancel()

app = FastAPI(title="Vending Pair Management System", lifespan=lifespan)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/api/register", response_model=Token)
async def register(user: UserCreate):
    global user_id_counter
    
    for existing_user in users_db.values():
        if existing_user["email"] == user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    users_db[user_id_counter] = {
        "id": user_id_counter,
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password)
    }
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id_counter}, expires_delta=access_token_expires
    )
    user_id_counter += 1
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
async def login(user: UserLogin):
    for db_user in users_db.values():
        if db_user["email"] == user.email and verify_password(user.password, db_user["password"]):
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(db_user["id"])}, expires_delta=access_token_expires
            )
            return {"access_token": access_token, "token_type": "bearer"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.get("/api/users/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"]
    )

@app.get("/api/users", response_model=List[User])
async def get_all_users(current_user: dict = Depends(get_current_user)):
    return [
        User(id=user["id"], name=user["name"], email=user["email"])
        for user in users_db.values()
    ]

@app.get("/api/users/unpaired", response_model=List[User])
async def get_unpaired_users(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    
    paired_user_ids = set()
    for pair in pairs_db:
        if pair["pair_date"] == today:
            paired_user_ids.add(pair["user_id_1"])
            paired_user_ids.add(pair["user_id_2"])
    
    unpaired_users = [
        User(id=user["id"], name=user["name"], email=user["email"])
        for user in users_db.values()
        if user["id"] not in paired_user_ids
    ]
    
    return unpaired_users

@app.post("/api/pairs", response_model=Pair)
async def create_pair(pair_data: PairCreate, current_user: dict = Depends(get_current_user)):
    global pair_id_counter
    
    today = datetime.now(timezone.utc).date().isoformat()
    user_id = current_user["id"]
    partner_id = pair_data.partner_id
    
    if user_id == partner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot pair with yourself"
        )
    
    if partner_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner user not found"
        )
    
    for pair in pairs_db:
        if pair["pair_date"] == today and (
            (pair["user_id_1"] == user_id) or (pair["user_id_2"] == user_id)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already paired today"
            )
    
    for pair in pairs_db:
        if pair["pair_date"] == today and (
            (pair["user_id_1"] == partner_id) or (pair["user_id_2"] == partner_id)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Partner has already paired today"
            )
    
    new_pair = {
        "id": pair_id_counter,
        "user_id_1": min(user_id, partner_id),
        "user_id_2": max(user_id, partner_id),
        "pair_date": today
    }
    
    pairs_db.append(new_pair)
    pair_id_counter += 1
    
    return Pair(**new_pair)

@app.get("/api/pairs/history", response_model=List[dict])
async def get_pair_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    week_start = get_week_start(now)
    
    user_pairs = []
    for pair in pairs_db:
        pair_date = datetime.fromisoformat(pair["pair_date"] + "T00:00:00")
        if is_same_week(pair_date, now) and (pair["user_id_1"] == user_id or pair["user_id_2"] == user_id):
            partner_id = pair["user_id_2"] if pair["user_id_1"] == user_id else pair["user_id_1"]
            partner = users_db.get(partner_id)
            
            user_pairs.append({
                "id": pair["id"],
                "partner_name": partner["name"] if partner else "Unknown",
                "partner_id": partner_id,
                "pair_date": pair["pair_date"]
            })
    
    return sorted(user_pairs, key=lambda x: x["pair_date"], reverse=True)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
