from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="Budget Tracker API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class CategoryType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    settings: Dict[str, Any] = Field(default_factory=dict)

class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    settings: Dict[str, Any]

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: CategoryType
    color: str = "#3B82F6"
    icon: str = "💰"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    type: CategoryType
    color: str = "#3B82F6"
    icon: str = "💰"

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    type: TransactionType
    category_id: str
    description: str
    date: datetime
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None  # "daily", "weekly", "monthly", "yearly"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    category_id: str
    description: str
    date: datetime
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None

class Budget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category_id: str
    amount: float
    period: str = "monthly"  # "weekly", "monthly", "yearly"
    start_date: datetime
    end_date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BudgetCreate(BaseModel):
    category_id: str
    amount: float
    period: str = "monthly"
    start_date: datetime
    end_date: datetime

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    target_amount: float
    current_amount: float = 0.0
    target_date: datetime
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GoalCreate(BaseModel):
    title: str
    target_amount: float
    target_date: datetime
    description: str = ""

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Authentication routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        settings={
            "currency": "USD",
            "theme": "light",
            "notifications": True
        }
    )
    
    await db.users.insert_one(user.dict())
    
    # Create default categories
    default_categories = [
        # Income categories
        {"name": "Salary", "type": "income", "color": "#10B981", "icon": "💰"},
        {"name": "Freelance", "type": "income", "color": "#059669", "icon": "💼"},
        {"name": "Investment Returns", "type": "income", "color": "#047857", "icon": "📈"},
        {"name": "Bank Interest", "type": "income", "color": "#065F46", "icon": "🏦"},
        {"name": "Cash Income", "type": "income", "color": "#064E3B", "icon": "💵"},
        {"name": "Bonus", "type": "income", "color": "#34D399", "icon": "🎁"},
        
        # Expense categories
        {"name": "Food & Dining", "type": "expense", "color": "#EF4444", "icon": "🍕"},
        {"name": "Transportation", "type": "expense", "color": "#F59E0B", "icon": "🚗"},
        {"name": "Shopping", "type": "expense", "color": "#8B5CF6", "icon": "🛒"},
        {"name": "Entertainment", "type": "expense", "color": "#EC4899", "icon": "🎬"},
        {"name": "Bills & Utilities", "type": "expense", "color": "#6B7280", "icon": "⚡"},
        {"name": "Healthcare", "type": "expense", "color": "#14B8A6", "icon": "🏥"},
        {"name": "Gas & Fuel", "type": "expense", "color": "#F97316", "icon": "⛽"},
        {"name": "Groceries", "type": "expense", "color": "#84CC16", "icon": "🛍️"},
        {"name": "Rent/Mortgage", "type": "expense", "color": "#DC2626", "icon": "🏠"},
        {"name": "Coffee & Drinks", "type": "expense", "color": "#A3A3A3", "icon": "☕"},
        {"name": "Technology", "type": "expense", "color": "#3B82F6", "icon": "💻"},
        {"name": "Cash Expenses", "type": "expense", "color": "#6366F1", "icon": "💳"},
    ]
    
    for cat_data in default_categories:
        category = Category(user_id=user.id, **cat_data)
        await db.categories.insert_one(category.dict())
    
    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict())
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user)
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

# Categories routes
@api_router.get("/categories", response_model=List[Category])
async def get_categories(current_user_id: str = Depends(get_current_user)):
    categories = await db.categories.find({"user_id": current_user_id}).to_list(1000)
    return [Category(**cat) for cat in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, current_user_id: str = Depends(get_current_user)):
    category = Category(user_id=current_user_id, **category_data.dict())
    await db.categories.insert_one(category.dict())
    return category

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user_id: str = Depends(get_current_user)):
    # Check if category belongs to user
    category = await db.categories.find_one({"id": category_id, "user_id": current_user_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Delete category and associated transactions
    await db.categories.delete_one({"id": category_id})
    await db.transactions.delete_many({"category_id": category_id})
    await db.budgets.delete_many({"category_id": category_id})
    
    return {"message": "Category deleted successfully"}

# Transactions routes
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    limit: int = 100,
    skip: int = 0,
    category_id: Optional[str] = None,
    type: Optional[TransactionType] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user_id: str = Depends(get_current_user)
):
    filter_query = {"user_id": current_user_id}
    
    if category_id:
        filter_query["category_id"] = category_id
    if type:
        filter_query["type"] = type
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        filter_query["date"] = date_filter
    
    transactions = await db.transactions.find(filter_query).sort("date", -1).skip(skip).limit(limit).to_list(limit)
    return [Transaction(**trans) for trans in transactions]

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate, current_user_id: str = Depends(get_current_user)):
    # Verify category belongs to user
    category = await db.categories.find_one({"id": transaction_data.category_id, "user_id": current_user_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    transaction = Transaction(user_id=current_user_id, **transaction_data.dict())
    await db.transactions.insert_one(transaction.dict())
    return transaction

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionCreate,
    current_user_id: str = Depends(get_current_user)
):
    # Check if transaction belongs to user
    existing_transaction = await db.transactions.find_one({"id": transaction_id, "user_id": current_user_id})
    if not existing_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify category belongs to user
    category = await db.categories.find_one({"id": transaction_data.category_id, "user_id": current_user_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated_transaction = Transaction(id=transaction_id, user_id=current_user_id, **transaction_data.dict())
    await db.transactions.replace_one({"id": transaction_id}, updated_transaction.dict())
    return updated_transaction

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user_id: str = Depends(get_current_user)):
    result = await db.transactions.delete_one({"id": transaction_id, "user_id": current_user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}

# Budgets routes
@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(current_user_id: str = Depends(get_current_user)):
    budgets = await db.budgets.find({"user_id": current_user_id}).to_list(1000)
    return [Budget(**budget) for budget in budgets]

@api_router.post("/budgets", response_model=Budget)
async def create_budget(budget_data: BudgetCreate, current_user_id: str = Depends(get_current_user)):
    # Verify category belongs to user
    category = await db.categories.find_one({"id": budget_data.category_id, "user_id": current_user_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    budget = Budget(user_id=current_user_id, **budget_data.dict())
    await db.budgets.insert_one(budget.dict())
    return budget

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str, current_user_id: str = Depends(get_current_user)):
    result = await db.budgets.delete_one({"id": budget_id, "user_id": current_user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted successfully"}

# Goals routes
@api_router.get("/goals", response_model=List[Goal])
async def get_goals(current_user_id: str = Depends(get_current_user)):
    goals = await db.goals.find({"user_id": current_user_id}).to_list(1000)
    return [Goal(**goal) for goal in goals]

@api_router.post("/goals", response_model=Goal)
async def create_goal(goal_data: GoalCreate, current_user_id: str = Depends(get_current_user)):
    goal = Goal(user_id=current_user_id, **goal_data.dict())
    await db.goals.insert_one(goal.dict())
    return goal

@api_router.put("/goals/{goal_id}/progress")
async def update_goal_progress(goal_id: str, amount: float, current_user_id: str = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": current_user_id})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    await db.goals.update_one(
        {"id": goal_id},
        {"$set": {"current_amount": amount}}
    )
    return {"message": "Goal progress updated"}

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user_id: str = Depends(get_current_user)):
    result = await db.goals.delete_one({"id": goal_id, "user_id": current_user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}

# Analytics routes
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(
    period: str = "month",  # "24h", "week", "month", "3months", "6months", "year"
    current_user_id: str = Depends(get_current_user)
):
    # Calculate date range based on period
    now = datetime.utcnow()
    
    if period == "24h":
        start_date = now - timedelta(hours=24)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "3months":
        start_date = now - timedelta(days=90)
    elif period == "6months":
        start_date = now - timedelta(days=180)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get transactions for the selected period
    transactions_cursor = db.transactions.find({
        "user_id": current_user_id,
        "date": {"$gte": start_date}
    })
    transactions = await transactions_cursor.to_list(1000)
    
    # Calculate totals
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
    balance = total_income - total_expenses
    
    # Get spending by category
    category_spending = {}
    for transaction in transactions:
        if transaction["type"] == "expense":
            cat_id = transaction["category_id"]
            category_spending[cat_id] = category_spending.get(cat_id, 0) + transaction["amount"]
    
    # Get categories to map names
    categories_cursor = db.categories.find({"user_id": current_user_id})
    categories = await categories_cursor.to_list(1000)
    category_map = {cat["id"]: cat for cat in categories}
    
    # Format category spending
    category_data = []
    for cat_id, amount in category_spending.items():
        if cat_id in category_map:
            category_data.append({
                "category": category_map[cat_id]["name"],
                "amount": amount,
                "color": category_map[cat_id]["color"]
            })
    
    # Get recent transactions
    recent_cursor = db.transactions.find({
        "user_id": current_user_id
    }).sort("date", -1).limit(5)
    recent_transactions = await recent_cursor.to_list(5)
    
    # Convert ObjectId to string and add category names to recent transactions
    for transaction in recent_transactions:
        # Convert ObjectId _id to string if it exists and remove it
        if "_id" in transaction:
            del transaction["_id"]
        
        cat_id = transaction["category_id"]
        if cat_id in category_map:
            transaction["category_name"] = category_map[cat_id]["name"]
            transaction["category_icon"] = category_map[cat_id]["icon"]
    
    # Format period label
    if period == "24h":
        period_label = "Last 24 Hours"
    elif period == "week":
        period_label = "Last 7 Days"
    elif period == "month":
        period_label = start_date.strftime("%B %Y")
    elif period == "3months":
        period_label = f"Last 3 Months (from {start_date.strftime('%B %d, %Y')})"
    elif period == "6months":
        period_label = f"Last 6 Months (from {start_date.strftime('%B %d, %Y')})"
    elif period == "year":
        period_label = f"Last Year (from {start_date.strftime('%B %d, %Y')})"
    else:
        period_label = start_date.strftime("%B %Y")
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "category_spending": category_data,
        "recent_transactions": recent_transactions,
        "period": period_label
    }

@api_router.get("/analytics/spending-trend")
async def get_spending_trend(
    period: str = "6months",  # "24h", "week", "month", "3months", "6months", "year"
    current_user_id: str = Depends(get_current_user)
):
    # Calculate date range based on period
    now = datetime.utcnow()
    
    if period == "24h":
        start_date = now - timedelta(hours=24)
        grouping_format = "%Y-%m-%d-%H"  # Group by hour
        display_format = "%H:00"  # Display as hour
        label_format = lambda dt_str: datetime.strptime(dt_str, "%Y-%m-%d-%H").strftime("%H:00")
    elif period == "week":
        start_date = now - timedelta(days=7)
        grouping_format = "%Y-%m-%d"  # Group by day
        display_format = "%a"  # Display as day name
        label_format = lambda dt_str: datetime.strptime(dt_str, "%Y-%m-%d").strftime("%a %m/%d")
    elif period == "month":
        start_date = now - timedelta(days=30)
        grouping_format = "%Y-%m-%d"  # Group by day
        display_format = "%m/%d"  # Display as month/day
        label_format = lambda dt_str: datetime.strptime(dt_str, "%Y-%m-%d").strftime("%m/%d")
    elif period == "3months":
        start_date = now - timedelta(days=90)
        grouping_format = "%Y-%W"  # Group by week
        display_format = "Week %W"  # Display as week
        label_format = lambda dt_str: f"Week {datetime.strptime(dt_str + '-1', '%Y-%W-%w').strftime('%m/%d')}"
    elif period == "6months":
        start_date = now - timedelta(days=180)
        grouping_format = "%Y-%m"  # Group by month
        display_format = "%b"  # Display as month name
        label_format = lambda dt_str: datetime.strptime(dt_str, "%Y-%m").strftime("%b %Y")
    elif period == "year":
        start_date = now - timedelta(days=365)
        grouping_format = "%Y-%m"  # Group by month
        display_format = "%b %Y"  # Display as month year
        label_format = lambda dt_str: datetime.strptime(dt_str, "%Y-%m").strftime("%b %Y")
    else:
        # Default to 6 months
        start_date = now - timedelta(days=180)
        grouping_format = "%Y-%m"
        display_format = "%b %Y"
        label_format = lambda dt_str: datetime.strptime(dt_str, "%Y-%m").strftime("%b %Y")
    
    transactions_cursor = db.transactions.find({
        "user_id": current_user_id,
        "date": {"$gte": start_date, "$lte": now}
    })
    transactions = await transactions_cursor.to_list(1000)
    
    # Group by the determined format
    grouped_data = {}
    for transaction in transactions:
        group_key = transaction["date"].strftime(grouping_format)
        if group_key not in grouped_data:
            grouped_data[group_key] = {"income": 0, "expenses": 0}
        
        if transaction["type"] == "income":
            grouped_data[group_key]["income"] += transaction["amount"]
        else:
            grouped_data[group_key]["expenses"] += transaction["amount"]
    
    # Format for chart
    trend_data = []
    for group_key, data in sorted(grouped_data.items()):
        trend_data.append({
            "period": label_format(group_key),
            "income": data["income"],
            "expenses": data["expenses"],
            "net": data["income"] - data["expenses"]
        })
    
    return trend_data

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
