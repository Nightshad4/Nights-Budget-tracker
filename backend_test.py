#!/usr/bin/env python3
import requests
import json
import random
import string
import datetime
import time
import uuid
from typing import Dict, Any, Optional, List

# Backend URL from frontend/.env
BACKEND_URL = "https://d9b61880-aae1-49a3-bd86-9e152639f8e7.preview.emergentagent.com/api"

# Test user credentials
test_user = {
    "name": f"Test User {uuid.uuid4().hex[:8]}",
    "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
    "password": "SecurePassword123!"
}

# Global variables to store test data
access_token = None
user_id = None
test_categories = {}
test_transactions = {}
test_budgets = {}
test_goals = {}

def print_separator(title):
    """Print a separator with a title for better test output readability"""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80 + "\n")

def print_response(response, message="Response"):
    """Print response details in a formatted way"""
    print(f"{message}:")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Body: {response.text}")
    print()

def random_amount():
    """Generate a random amount between 10 and 1000"""
    return round(random.uniform(10, 1000), 2)

def format_datetime(dt):
    """Format datetime for API requests"""
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

def test_auth_register():
    """Test user registration endpoint"""
    print_separator("Testing User Registration")
    
    url = f"{BACKEND_URL}/auth/register"
    response = requests.post(url, json=test_user)
    
    print_response(response, "Register Response")
    
    assert response.status_code == 200, f"Registration failed with status code {response.status_code}"
    
    data = response.json()
    assert "access_token" in data, "Access token not found in response"
    assert "user" in data, "User data not found in response"
    assert data["user"]["email"] == test_user["email"], "Email in response doesn't match"
    
    global access_token, user_id
    access_token = data["access_token"]
    user_id = data["user"]["id"]
    
    print(f"✅ User registration successful. User ID: {user_id}")
    return True

def test_auth_login():
    """Test user login endpoint"""
    print_separator("Testing User Login")
    
    url = f"{BACKEND_URL}/auth/login"
    response = requests.post(url, json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    
    print_response(response, "Login Response")
    
    assert response.status_code == 200, f"Login failed with status code {response.status_code}"
    
    data = response.json()
    assert "access_token" in data, "Access token not found in response"
    assert "user" in data, "User data not found in response"
    assert data["user"]["email"] == test_user["email"], "Email in response doesn't match"
    
    global access_token
    access_token = data["access_token"]
    
    print("✅ User login successful")
    return True

def test_auth_me():
    """Test getting current user info"""
    print_separator("Testing Get Current User")
    
    url = f"{BACKEND_URL}/auth/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(url, headers=headers)
    
    print_response(response, "Get Current User Response")
    
    assert response.status_code == 200, f"Get current user failed with status code {response.status_code}"
    
    data = response.json()
    assert data["email"] == test_user["email"], "Email in response doesn't match"
    assert data["name"] == test_user["name"], "Name in response doesn't match"
    
    print("✅ Get current user successful")
    return True

def test_auth_middleware():
    """Test authentication middleware"""
    print_separator("Testing Auth Middleware")
    
    # Test with valid token
    url = f"{BACKEND_URL}/categories"
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(url, headers=headers)
    
    print_response(response, "With Valid Token")
    assert response.status_code == 200, f"Request with valid token failed with status code {response.status_code}"
    
    # Test with invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = requests.get(url, headers=headers)
    
    print_response(response, "With Invalid Token")
    assert response.status_code == 401, f"Request with invalid token should fail but got status code {response.status_code}"
    
    # Test with no token
    response = requests.get(url)
    
    print_response(response, "With No Token")
    assert response.status_code == 403, f"Request with no token should fail but got status code {response.status_code}"
    
    print("✅ Authentication middleware working correctly")
    return True

def test_get_categories():
    """Test getting user categories"""
    print_separator("Testing Get Categories")
    
    url = f"{BACKEND_URL}/categories"
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(url, headers=headers)
    
    print_response(response, "Get Categories Response")
    
    assert response.status_code == 200, f"Get categories failed with status code {response.status_code}"
    
    categories = response.json()
    assert isinstance(categories, list), "Response is not a list"
    assert len(categories) >= 8, "Default categories not created during registration"
    
    # Store categories for later use
    global test_categories
    for category in categories:
        test_categories[category["type"]] = test_categories.get(category["type"], [])
        test_categories[category["type"]].append(category)
    
    print(f"✅ Get categories successful. Found {len(categories)} categories")
    return True

def test_create_category():
    """Test creating new categories"""
    print_separator("Testing Create Category")
    
    url = f"{BACKEND_URL}/categories"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test creating income category
    income_category = {
        "name": "Investment Returns",
        "type": "income",
        "color": "#047857",
        "icon": "💎"
    }
    
    response = requests.post(url, json=income_category, headers=headers)
    print_response(response, "Create Income Category Response")
    
    assert response.status_code == 200, f"Create income category failed with status code {response.status_code}"
    income_cat = response.json()
    assert income_cat["name"] == income_category["name"], "Category name doesn't match"
    assert income_cat["type"] == income_category["type"], "Category type doesn't match"
    
    # Test creating expense category
    expense_category = {
        "name": "Education",
        "type": "expense",
        "color": "#4F46E5",
        "icon": "📚"
    }
    
    response = requests.post(url, json=expense_category, headers=headers)
    print_response(response, "Create Expense Category Response")
    
    assert response.status_code == 200, f"Create expense category failed with status code {response.status_code}"
    expense_cat = response.json()
    assert expense_cat["name"] == expense_category["name"], "Category name doesn't match"
    assert expense_cat["type"] == expense_category["type"], "Category type doesn't match"
    
    # Store new categories
    global test_categories
    test_categories["income"].append(income_cat)
    test_categories["expense"].append(expense_cat)
    
    print("✅ Create categories successful")
    return True

def test_delete_category():
    """Test deleting a category"""
    print_separator("Testing Delete Category")
    
    # Get a category to delete (use the last one we created)
    global test_categories
    category_to_delete = test_categories["expense"][-1]
    
    url = f"{BACKEND_URL}/categories/{category_to_delete['id']}"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = requests.delete(url, headers=headers)
    print_response(response, "Delete Category Response")
    
    assert response.status_code == 200, f"Delete category failed with status code {response.status_code}"
    
    # Verify category is deleted
    url = f"{BACKEND_URL}/categories"
    response = requests.get(url, headers=headers)
    categories = response.json()
    
    category_ids = [cat["id"] for cat in categories]
    assert category_to_delete["id"] not in category_ids, "Category was not deleted"
    
    # Remove from our test data
    test_categories["expense"].pop()
    
    print("✅ Delete category successful")
    return True

def test_create_transaction():
    """Test creating transactions"""
    print_separator("Testing Create Transaction")
    
    url = f"{BACKEND_URL}/transactions"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create income transaction
    income_category = test_categories["income"][0]
    income_transaction = {
        "amount": random_amount(),
        "type": "income",
        "category_id": income_category["id"],
        "description": "Monthly salary payment",
        "date": format_datetime(datetime.datetime.utcnow() - datetime.timedelta(days=5))
    }
    
    response = requests.post(url, json=income_transaction, headers=headers)
    print_response(response, "Create Income Transaction Response")
    
    assert response.status_code == 200, f"Create income transaction failed with status code {response.status_code}"
    income_trans = response.json()
    assert income_trans["amount"] == income_transaction["amount"], "Transaction amount doesn't match"
    assert income_trans["type"] == income_transaction["type"], "Transaction type doesn't match"
    
    # Create expense transaction
    expense_category = test_categories["expense"][0]
    expense_transaction = {
        "amount": random_amount(),
        "type": "expense",
        "category_id": expense_category["id"],
        "description": "Grocery shopping",
        "date": format_datetime(datetime.datetime.utcnow() - datetime.timedelta(days=2))
    }
    
    response = requests.post(url, json=expense_transaction, headers=headers)
    print_response(response, "Create Expense Transaction Response")
    
    assert response.status_code == 200, f"Create expense transaction failed with status code {response.status_code}"
    expense_trans = response.json()
    assert expense_trans["amount"] == expense_transaction["amount"], "Transaction amount doesn't match"
    assert expense_trans["type"] == expense_transaction["type"], "Transaction type doesn't match"
    
    # Store transactions for later use
    global test_transactions
    test_transactions["income"] = income_trans
    test_transactions["expense"] = expense_trans
    
    print("✅ Create transactions successful")
    return True

def test_get_transactions():
    """Test getting transactions with filters"""
    print_separator("Testing Get Transactions")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test getting all transactions
    url = f"{BACKEND_URL}/transactions"
    response = requests.get(url, headers=headers)
    print_response(response, "Get All Transactions Response")
    
    assert response.status_code == 200, f"Get transactions failed with status code {response.status_code}"
    transactions = response.json()
    assert isinstance(transactions, list), "Response is not a list"
    assert len(transactions) >= 2, "Expected at least 2 transactions"
    
    # Test filtering by type
    url = f"{BACKEND_URL}/transactions?type=income"
    response = requests.get(url, headers=headers)
    print_response(response, "Get Income Transactions Response")
    
    assert response.status_code == 200, f"Get income transactions failed with status code {response.status_code}"
    income_transactions = response.json()
    assert all(t["type"] == "income" for t in income_transactions), "Non-income transactions in filtered results"
    
    # Test filtering by category
    category_id = test_categories["expense"][0]["id"]
    url = f"{BACKEND_URL}/transactions?category_id={category_id}"
    response = requests.get(url, headers=headers)
    print_response(response, "Get Transactions by Category Response")
    
    assert response.status_code == 200, f"Get transactions by category failed with status code {response.status_code}"
    category_transactions = response.json()
    assert all(t["category_id"] == category_id for t in category_transactions), "Transactions from other categories in filtered results"
    
    # Test filtering by date range
    start_date = format_datetime(datetime.datetime.utcnow() - datetime.timedelta(days=10))
    end_date = format_datetime(datetime.datetime.utcnow())
    url = f"{BACKEND_URL}/transactions?start_date={start_date}&end_date={end_date}"
    response = requests.get(url, headers=headers)
    print_response(response, "Get Transactions by Date Range Response")
    
    assert response.status_code == 200, f"Get transactions by date range failed with status code {response.status_code}"
    
    print("✅ Get transactions with filters successful")
    return True

def test_update_transaction():
    """Test updating a transaction"""
    print_separator("Testing Update Transaction")
    
    # Get a transaction to update
    global test_transactions
    transaction_to_update = test_transactions["expense"]
    
    url = f"{BACKEND_URL}/transactions/{transaction_to_update['id']}"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Update transaction data
    updated_data = {
        "amount": random_amount(),
        "type": "expense",
        "category_id": transaction_to_update["category_id"],
        "description": "Updated grocery shopping",
        "date": format_datetime(datetime.datetime.utcnow() - datetime.timedelta(days=1))
    }
    
    response = requests.put(url, json=updated_data, headers=headers)
    print_response(response, "Update Transaction Response")
    
    assert response.status_code == 200, f"Update transaction failed with status code {response.status_code}"
    
    updated_transaction = response.json()
    assert updated_transaction["amount"] == updated_data["amount"], "Updated amount doesn't match"
    assert updated_transaction["description"] == updated_data["description"], "Updated description doesn't match"
    
    # Update our test data
    test_transactions["expense"] = updated_transaction
    
    print("✅ Update transaction successful")
    return True

def test_delete_transaction():
    """Test deleting a transaction"""
    print_separator("Testing Delete Transaction")
    
    # Get a transaction to delete
    global test_transactions
    transaction_to_delete = test_transactions["income"]
    
    url = f"{BACKEND_URL}/transactions/{transaction_to_delete['id']}"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = requests.delete(url, headers=headers)
    print_response(response, "Delete Transaction Response")
    
    assert response.status_code == 200, f"Delete transaction failed with status code {response.status_code}"
    
    # Verify transaction is deleted
    url = f"{BACKEND_URL}/transactions"
    response = requests.get(url, headers=headers)
    transactions = response.json()
    
    transaction_ids = [trans["id"] for trans in transactions]
    assert transaction_to_delete["id"] not in transaction_ids, "Transaction was not deleted"
    
    print("✅ Delete transaction successful")
    return True

def test_dashboard_analytics():
    """Test dashboard analytics endpoint"""
    print_separator("Testing Dashboard Analytics")
    
    url = f"{BACKEND_URL}/analytics/dashboard"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = requests.get(url, headers=headers)
    print_response(response, "Dashboard Analytics Response")
    
    assert response.status_code == 200, f"Get dashboard analytics failed with status code {response.status_code}"
    
    data = response.json()
    assert "total_income" in data, "Total income not found in response"
    assert "total_expenses" in data, "Total expenses not found in response"
    assert "balance" in data, "Balance not found in response"
    assert "category_spending" in data, "Category spending not found in response"
    assert "recent_transactions" in data, "Recent transactions not found in response"
    
    print("✅ Dashboard analytics successful")
    return True

def test_spending_trend():
    """Test spending trend analytics endpoint"""
    print_separator("Testing Spending Trend Analytics")
    
    url = f"{BACKEND_URL}/analytics/spending-trend"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = requests.get(url, headers=headers)
    print_response(response, "Spending Trend Response")
    
    assert response.status_code == 200, f"Get spending trend failed with status code {response.status_code}"
    
    data = response.json()
    assert isinstance(data, list), "Response is not a list"
    
    # Check if we have data for multiple months
    url = f"{BACKEND_URL}/analytics/spending-trend?months=3"
    response = requests.get(url, headers=headers)
    print_response(response, "Spending Trend with Months Parameter")
    
    assert response.status_code == 200, f"Get spending trend with months parameter failed with status code {response.status_code}"
    
    print("✅ Spending trend analytics successful")
    return True

def test_budget_operations():
    """Test budget CRUD operations"""
    print_separator("Testing Budget Operations")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a budget
    expense_category = test_categories["expense"][0]
    budget_data = {
        "category_id": expense_category["id"],
        "amount": 500.00,
        "period": "monthly",
        "start_date": format_datetime(datetime.datetime.utcnow().replace(day=1)),
        "end_date": format_datetime(datetime.datetime.utcnow().replace(day=28))
    }
    
    url = f"{BACKEND_URL}/budgets"
    response = requests.post(url, json=budget_data, headers=headers)
    print_response(response, "Create Budget Response")
    
    assert response.status_code == 200, f"Create budget failed with status code {response.status_code}"
    
    budget = response.json()
    assert budget["amount"] == budget_data["amount"], "Budget amount doesn't match"
    assert budget["category_id"] == budget_data["category_id"], "Budget category doesn't match"
    
    # Get budgets
    response = requests.get(url, headers=headers)
    print_response(response, "Get Budgets Response")
    
    assert response.status_code == 200, f"Get budgets failed with status code {response.status_code}"
    
    budgets = response.json()
    assert isinstance(budgets, list), "Response is not a list"
    assert len(budgets) >= 1, "Expected at least 1 budget"
    
    # Delete budget
    budget_id = budget["id"]
    url = f"{BACKEND_URL}/budgets/{budget_id}"
    response = requests.delete(url, headers=headers)
    print_response(response, "Delete Budget Response")
    
    assert response.status_code == 200, f"Delete budget failed with status code {response.status_code}"
    
    # Verify budget is deleted
    url = f"{BACKEND_URL}/budgets"
    response = requests.get(url, headers=headers)
    budgets = response.json()
    
    budget_ids = [b["id"] for b in budgets]
    assert budget_id not in budget_ids, "Budget was not deleted"
    
    print("✅ Budget operations successful")
    return True

def test_goal_operations():
    """Test goal CRUD operations"""
    print_separator("Testing Goal Operations")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a goal
    goal_data = {
        "title": "New Car",
        "target_amount": 15000.00,
        "target_date": format_datetime(datetime.datetime.utcnow() + datetime.timedelta(days=365)),
        "description": "Saving for a new electric car"
    }
    
    url = f"{BACKEND_URL}/goals"
    response = requests.post(url, json=goal_data, headers=headers)
    print_response(response, "Create Goal Response")
    
    assert response.status_code == 200, f"Create goal failed with status code {response.status_code}"
    
    goal = response.json()
    assert goal["title"] == goal_data["title"], "Goal title doesn't match"
    assert goal["target_amount"] == goal_data["target_amount"], "Goal target amount doesn't match"
    assert goal["current_amount"] == 0.0, "Initial current amount should be 0"
    
    # Get goals
    response = requests.get(url, headers=headers)
    print_response(response, "Get Goals Response")
    
    assert response.status_code == 200, f"Get goals failed with status code {response.status_code}"
    
    goals = response.json()
    assert isinstance(goals, list), "Response is not a list"
    assert len(goals) >= 1, "Expected at least 1 goal"
    
    # Update goal progress
    goal_id = goal["id"]
    url = f"{BACKEND_URL}/goals/{goal_id}/progress"
    response = requests.put(url, params={"amount": 5000.00}, headers=headers)
    print_response(response, "Update Goal Progress Response")
    
    assert response.status_code == 200, f"Update goal progress failed with status code {response.status_code}"
    
    # Verify progress was updated
    url = f"{BACKEND_URL}/goals"
    response = requests.get(url, headers=headers)
    goals = response.json()
    
    updated_goal = next((g for g in goals if g["id"] == goal_id), None)
    assert updated_goal is not None, "Goal not found after update"
    assert updated_goal["current_amount"] == 5000.00, "Goal progress not updated correctly"
    
    # Delete goal
    url = f"{BACKEND_URL}/goals/{goal_id}"
    response = requests.delete(url, headers=headers)
    print_response(response, "Delete Goal Response")
    
    assert response.status_code == 200, f"Delete goal failed with status code {response.status_code}"
    
    # Verify goal is deleted
    url = f"{BACKEND_URL}/goals"
    response = requests.get(url, headers=headers)
    goals = response.json()
    
    goal_ids = [g["id"] for g in goals]
    assert goal_id not in goal_ids, "Goal was not deleted"
    
    print("✅ Goal operations successful")
    return True

def run_all_tests():
    """Run all tests in sequence"""
    test_results = {}
    
    # Authentication tests
    try:
        test_results["User Registration"] = test_auth_register()
    except Exception as e:
        print(f"❌ User Registration test failed: {str(e)}")
        test_results["User Registration"] = False
        # If registration fails, we can't continue with other tests
        return test_results
    
    try:
        test_results["User Login"] = test_auth_login()
    except Exception as e:
        print(f"❌ User Login test failed: {str(e)}")
        test_results["User Login"] = False
    
    try:
        test_results["Get Current User"] = test_auth_me()
    except Exception as e:
        print(f"❌ Get Current User test failed: {str(e)}")
        test_results["Get Current User"] = False
    
    try:
        test_results["Auth Middleware"] = test_auth_middleware()
    except Exception as e:
        print(f"❌ Auth Middleware test failed: {str(e)}")
        test_results["Auth Middleware"] = False
    
    # Categories tests
    try:
        test_results["Get Categories"] = test_get_categories()
    except Exception as e:
        print(f"❌ Get Categories test failed: {str(e)}")
        test_results["Get Categories"] = False
    
    try:
        test_results["Create Category"] = test_create_category()
    except Exception as e:
        print(f"❌ Create Category test failed: {str(e)}")
        test_results["Create Category"] = False
    
    try:
        test_results["Delete Category"] = test_delete_category()
    except Exception as e:
        print(f"❌ Delete Category test failed: {str(e)}")
        test_results["Delete Category"] = False
    
    # Transactions tests
    try:
        test_results["Create Transaction"] = test_create_transaction()
    except Exception as e:
        print(f"❌ Create Transaction test failed: {str(e)}")
        test_results["Create Transaction"] = False
    
    try:
        test_results["Get Transactions"] = test_get_transactions()
    except Exception as e:
        print(f"❌ Get Transactions test failed: {str(e)}")
        test_results["Get Transactions"] = False
    
    try:
        test_results["Update Transaction"] = test_update_transaction()
    except Exception as e:
        print(f"❌ Update Transaction test failed: {str(e)}")
        test_results["Update Transaction"] = False
    
    try:
        test_results["Delete Transaction"] = test_delete_transaction()
    except Exception as e:
        print(f"❌ Delete Transaction test failed: {str(e)}")
        test_results["Delete Transaction"] = False
    
    # Analytics tests
    try:
        test_results["Dashboard Analytics"] = test_dashboard_analytics()
    except Exception as e:
        print(f"❌ Dashboard Analytics test failed: {str(e)}")
        test_results["Dashboard Analytics"] = False
    
    try:
        test_results["Spending Trend"] = test_spending_trend()
    except Exception as e:
        print(f"❌ Spending Trend test failed: {str(e)}")
        test_results["Spending Trend"] = False
    
    # Budget and Goals tests
    try:
        test_results["Budget Operations"] = test_budget_operations()
    except Exception as e:
        print(f"❌ Budget Operations test failed: {str(e)}")
        test_results["Budget Operations"] = False
    
    try:
        test_results["Goal Operations"] = test_goal_operations()
    except Exception as e:
        print(f"❌ Goal Operations test failed: {str(e)}")
        test_results["Goal Operations"] = False
    
    # Print summary
    print_separator("Test Summary")
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    return test_results

def run_focused_tests():
    """Run only the tests for the fixed issues"""
    print_separator("RUNNING FOCUSED TESTS FOR FIXED ISSUES")
    test_results = {}
    
    # Register a new user for testing
    try:
        test_results["User Registration"] = test_auth_register()
    except Exception as e:
        print(f"❌ User Registration test failed: {str(e)}")
        test_results["User Registration"] = False
        # If registration fails, we can't continue with other tests
        return test_results
    
    # Create categories and transactions for testing analytics
    try:
        test_results["Get Categories"] = test_get_categories()
    except Exception as e:
        print(f"❌ Get Categories test failed: {str(e)}")
        test_results["Get Categories"] = False
    
    try:
        test_results["Create Transaction"] = test_create_transaction()
    except Exception as e:
        print(f"❌ Create Transaction test failed: {str(e)}")
        test_results["Create Transaction"] = False
    
    # Test JWT Authentication with invalid tokens
    try:
        print_separator("Testing JWT Authentication with Invalid Tokens")
        url = f"{BACKEND_URL}/categories"
        
        # Test with malformed token
        headers = {"Authorization": "Bearer malformed.token.here"}
        response = requests.get(url, headers=headers)
        print_response(response, "With Malformed Token")
        assert response.status_code == 401, f"Request with malformed token should return 401 but got {response.status_code}"
        
        # Test with expired token (we'll create one manually)
        payload = {
            "sub": "fake_user_id",
            "exp": datetime.datetime.utcnow() - datetime.timedelta(hours=1)
        }
        import jwt
        expired_token = jwt.encode(payload, "fake_secret", algorithm="HS256")
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = requests.get(url, headers=headers)
        print_response(response, "With Expired Token")
        assert response.status_code == 401, f"Request with expired token should return 401 but got {response.status_code}"
        
        # Test with completely invalid token format
        headers = {"Authorization": "Bearer not_even_a_jwt_token"}
        response = requests.get(url, headers=headers)
        print_response(response, "With Invalid Token Format")
        assert response.status_code == 401, f"Request with invalid token format should return 401 but got {response.status_code}"
        
        print("✅ JWT Authentication with invalid tokens working correctly")
        test_results["JWT Authentication"] = True
    except Exception as e:
        print(f"❌ JWT Authentication test failed: {str(e)}")
        test_results["JWT Authentication"] = False
    
    # Test Dashboard Analytics API
    try:
        print_separator("Testing Dashboard Analytics API")
        url = f"{BACKEND_URL}/analytics/dashboard"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(url, headers=headers)
        print_response(response, "Dashboard Analytics Response")
        
        assert response.status_code == 200, f"Get dashboard analytics failed with status code {response.status_code}"
        
        data = response.json()
        assert "total_income" in data, "Total income not found in response"
        assert "total_expenses" in data, "Total expenses not found in response"
        assert "balance" in data, "Balance not found in response"
        assert "category_spending" in data, "Category spending not found in response"
        assert "recent_transactions" in data, "Recent transactions not found in response"
        
        # Check that recent_transactions doesn't contain MongoDB ObjectId fields
        for transaction in data["recent_transactions"]:
            assert "_id" not in transaction, "MongoDB ObjectId (_id) found in transaction data"
        
        print("✅ Dashboard analytics API working correctly without ObjectId serialization issues")
        test_results["Dashboard Analytics API"] = True
    except Exception as e:
        print(f"❌ Dashboard Analytics API test failed: {str(e)}")
        test_results["Dashboard Analytics API"] = False
    
    # Test Spending Trend API
    try:
        print_separator("Testing Spending Trend API")
        url = f"{BACKEND_URL}/analytics/spending-trend"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(url, headers=headers)
        print_response(response, "Spending Trend Response")
        
        assert response.status_code == 200, f"Get spending trend failed with status code {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response is not a list"
        
        # Test with different months parameter
        url = f"{BACKEND_URL}/analytics/spending-trend?months=3"
        response = requests.get(url, headers=headers)
        print_response(response, "Spending Trend with Months Parameter")
        
        assert response.status_code == 200, f"Get spending trend with months parameter failed with status code {response.status_code}"
        
        print("✅ Spending trend API working correctly")
        test_results["Spending Trend API"] = True
    except Exception as e:
        print(f"❌ Spending Trend API test failed: {str(e)}")
        test_results["Spending Trend API"] = False
    
    # Print summary
    print_separator("Test Summary")
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    return test_results

def test_transaction_delete_functionality():
    """
    Focused test for transaction delete functionality.
    This test specifically tests the DELETE /api/transactions/{id} endpoint
    to verify that transactions can be properly deleted.
    """
    print_separator("FOCUSED TEST: TRANSACTION DELETE FUNCTIONALITY")
    
    # Step 1: Create a test user and login
    print("Step 1: Creating test user and logging in...")
    test_user_delete = {
        "name": f"Delete Test User {uuid.uuid4().hex[:8]}",
        "email": f"delete_test_{uuid.uuid4().hex[:8]}@example.com",
        "password": "DeleteTest123!"
    }
    
    # Register the user
    url = f"{BACKEND_URL}/auth/register"
    response = requests.post(url, json=test_user_delete)
    print_response(response, "Register Response")
    
    assert response.status_code == 200, f"Registration failed with status code {response.status_code}"
    
    data = response.json()
    delete_test_token = data["access_token"]
    delete_test_user_id = data["user"]["id"]
    
    print(f"✅ Test user created successfully. User ID: {delete_test_user_id}")
    
    # Step 2: Get categories for creating transactions
    print("\nStep 2: Getting categories for test transactions...")
    url = f"{BACKEND_URL}/categories"
    headers = {"Authorization": f"Bearer {delete_test_token}"}
    response = requests.get(url, headers=headers)
    
    assert response.status_code == 200, f"Get categories failed with status code {response.status_code}"
    
    categories = response.json()
    income_category = next((cat for cat in categories if cat["type"] == "income"), None)
    expense_category = next((cat for cat in categories if cat["type"] == "expense"), None)
    
    assert income_category is not None, "No income category found"
    assert expense_category is not None, "No expense category found"
    
    print(f"✅ Categories retrieved successfully. Using income category: {income_category['name']} and expense category: {expense_category['name']}")
    
    # Step 3: Create multiple test transactions
    print("\nStep 3: Creating test transactions...")
    url = f"{BACKEND_URL}/transactions"
    
    # Create 3 transactions (2 expenses, 1 income)
    test_transactions = []
    
    # Transaction 1 - Expense
    transaction1 = {
        "amount": 75.50,
        "type": "expense",
        "category_id": expense_category["id"],
        "description": "Test expense 1 - Groceries",
        "date": format_datetime(datetime.datetime.utcnow() - datetime.timedelta(days=2))
    }
    
    response = requests.post(url, json=transaction1, headers=headers)
    print_response(response, "Create Transaction 1 Response")
    
    assert response.status_code == 200, f"Create transaction 1 failed with status code {response.status_code}"
    test_transactions.append(response.json())
    
    # Transaction 2 - Expense
    transaction2 = {
        "amount": 120.75,
        "type": "expense",
        "category_id": expense_category["id"],
        "description": "Test expense 2 - Restaurant",
        "date": format_datetime(datetime.datetime.utcnow() - datetime.timedelta(days=1))
    }
    
    response = requests.post(url, json=transaction2, headers=headers)
    print_response(response, "Create Transaction 2 Response")
    
    assert response.status_code == 200, f"Create transaction 2 failed with status code {response.status_code}"
    test_transactions.append(response.json())
    
    # Transaction 3 - Income
    transaction3 = {
        "amount": 1000.00,
        "type": "income",
        "category_id": income_category["id"],
        "description": "Test income - Salary",
        "date": format_datetime(datetime.datetime.utcnow())
    }
    
    response = requests.post(url, json=transaction3, headers=headers)
    print_response(response, "Create Transaction 3 Response")
    
    assert response.status_code == 200, f"Create transaction 3 failed with status code {response.status_code}"
    test_transactions.append(response.json())
    
    print(f"✅ Created {len(test_transactions)} test transactions successfully")
    
    # Step 4: Verify transactions were created by getting all transactions
    print("\nStep 4: Verifying transactions were created...")
    url = f"{BACKEND_URL}/transactions"
    response = requests.get(url, headers=headers)
    
    assert response.status_code == 200, f"Get transactions failed with status code {response.status_code}"
    
    all_transactions = response.json()
    assert len(all_transactions) >= 3, f"Expected at least 3 transactions, but got {len(all_transactions)}"
    
    # Verify all our test transaction IDs are in the list
    transaction_ids = [t["id"] for t in all_transactions]
    for i, test_trans in enumerate(test_transactions):
        assert test_trans["id"] in transaction_ids, f"Test transaction {i+1} (ID: {test_trans['id']}) not found in transactions list"
    
    print(f"✅ All {len(test_transactions)} test transactions verified in the database")
    
    # Step 5: Delete one transaction
    print("\nStep 5: Deleting a transaction...")
    transaction_to_delete = test_transactions[1]  # Delete the second transaction (expense 2)
    url = f"{BACKEND_URL}/transactions/{transaction_to_delete['id']}"
    
    print(f"Deleting transaction with ID: {transaction_to_delete['id']}")
    print(f"DELETE URL: {url}")
    
    response = requests.delete(url, headers=headers)
    print_response(response, "Delete Transaction Response")
    
    assert response.status_code == 200, f"Delete transaction failed with status code {response.status_code}"
    
    # Step 6: Verify the transaction was deleted
    print("\nStep 6: Verifying transaction was deleted...")
    url = f"{BACKEND_URL}/transactions"
    response = requests.get(url, headers=headers)
    
    assert response.status_code == 200, f"Get transactions failed with status code {response.status_code}"
    
    remaining_transactions = response.json()
    remaining_ids = [t["id"] for t in remaining_transactions]
    
    # The deleted transaction should not be in the list
    assert transaction_to_delete["id"] not in remaining_ids, f"Transaction {transaction_to_delete['id']} was not deleted"
    
    # The other transactions should still be there
    assert test_transactions[0]["id"] in remaining_ids, f"Transaction {test_transactions[0]['id']} should still exist but was not found"
    assert test_transactions[2]["id"] in remaining_ids, f"Transaction {test_transactions[2]['id']} should still exist but was not found"
    
    print(f"✅ Transaction {transaction_to_delete['id']} was successfully deleted")
    print(f"✅ Other transactions still exist in the database")
    
    # Step 7: Try to delete a non-existent transaction
    print("\nStep 7: Testing delete with non-existent transaction ID...")
    non_existent_id = str(uuid.uuid4())
    url = f"{BACKEND_URL}/transactions/{non_existent_id}"
    
    response = requests.delete(url, headers=headers)
    print_response(response, "Delete Non-existent Transaction Response")
    
    assert response.status_code == 404, f"Delete non-existent transaction should return 404 but got {response.status_code}"
    
    print("✅ Delete non-existent transaction correctly returns 404")
    
    # Step 8: Try to delete a transaction that belongs to another user
    # We'll create another user and try to delete a transaction from the first user
    print("\nStep 8: Testing delete with transaction from another user...")
    
    # Create another test user
    another_test_user = {
        "name": f"Another Test User {uuid.uuid4().hex[:8]}",
        "email": f"another_test_{uuid.uuid4().hex[:8]}@example.com",
        "password": "AnotherTest123!"
    }
    
    url = f"{BACKEND_URL}/auth/register"
    response = requests.post(url, json=another_test_user)
    
    assert response.status_code == 200, f"Registration of another user failed with status code {response.status_code}"
    
    another_token = response.json()["access_token"]
    
    # Try to delete a transaction from the first user using the second user's token
    url = f"{BACKEND_URL}/transactions/{test_transactions[0]['id']}"
    headers = {"Authorization": f"Bearer {another_token}"}
    
    response = requests.delete(url, headers=headers)
    print_response(response, "Delete Another User's Transaction Response")
    
    assert response.status_code == 404, f"Delete another user's transaction should return 404 but got {response.status_code}"
    
    print("✅ Delete another user's transaction correctly returns 404")
    
    # Final verification - the transaction from step 8 should still exist
    headers = {"Authorization": f"Bearer {delete_test_token}"}
    url = f"{BACKEND_URL}/transactions"
    response = requests.get(url, headers=headers)
    
    remaining_transactions = response.json()
    remaining_ids = [t["id"] for t in remaining_transactions]
    
    assert test_transactions[0]["id"] in remaining_ids, "Transaction should still exist after failed delete attempt"
    
    print("\n✅ TRANSACTION DELETE FUNCTIONALITY TEST COMPLETED SUCCESSFULLY")
    return True

if __name__ == "__main__":
    # Test specifically the transaction delete functionality
    test_transaction_delete_functionality()
