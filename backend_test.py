#!/usr/bin/env python3
"""
Backend API Testing Script for MoodScript Phase 1 Auth
Tests the auth endpoints according to /app/auth_testing.md
"""

import requests
import json
import subprocess
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    return "https://soul-echo-4.preview.emergentagent.com"  # fallback

BACKEND_URL = get_backend_url()
API_BASE = f"{BACKEND_URL}/api"

def log_test(test_name, status, details=""):
    """Log test results"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")
    print()

def seed_test_data():
    """Seed test user and session in MongoDB"""
    print("🔧 Seeding test data in MongoDB...")
    
    mongosh_script = '''
use('test_database');
var visitorId = 'user_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: visitorId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: visitorId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('SESSION_TOKEN:' + sessionToken);
print('USER_ID:' + visitorId);
'''
    
    try:
        result = subprocess.run(
            ['mongosh', '--eval', mongosh_script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            log_test("MongoDB Seeding", "FAIL", f"mongosh error: {result.stderr}")
            return None, None
            
        # Parse output to extract session token and user ID
        session_token = None
        user_id = None
        
        for line in result.stdout.split('\n'):
            if line.startswith('SESSION_TOKEN:'):
                session_token = line.split(':', 1)[1]
            elif line.startswith('USER_ID:'):
                user_id = line.split(':', 1)[1]
        
        if session_token and user_id:
            log_test("MongoDB Seeding", "PASS", f"Created user {user_id} with session {session_token}")
            return session_token, user_id
        else:
            log_test("MongoDB Seeding", "FAIL", "Could not parse session token from mongosh output")
            return None, None
            
    except subprocess.TimeoutExpired:
        log_test("MongoDB Seeding", "FAIL", "mongosh command timed out")
        return None, None
    except Exception as e:
        log_test("MongoDB Seeding", "FAIL", f"Exception: {str(e)}")
        return None, None

def test_api_root():
    """Test GET /api/ returns MoodScript API message"""
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "MoodScript API":
                log_test("GET /api/", "PASS", "Returns correct API message")
                return True
            else:
                log_test("GET /api/", "FAIL", f"Wrong message: {data}")
                return False
        else:
            log_test("GET /api/", "FAIL", f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/", "FAIL", f"Exception: {str(e)}")
        return False

def test_auth_me_valid(session_token):
    """Test GET /api/auth/me with valid Bearer token"""
    try:
        headers = {"Authorization": f"Bearer {session_token}"}
        response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["user_id", "email", "name"]
            
            if all(field in data for field in required_fields):
                log_test("GET /api/auth/me (valid token)", "PASS", 
                        f"User: {data.get('name')} ({data.get('email')})")
                return True, data
            else:
                log_test("GET /api/auth/me (valid token)", "FAIL", 
                        f"Missing required fields. Got: {list(data.keys())}")
                return False, None
        else:
            log_test("GET /api/auth/me (valid token)", "FAIL", 
                    f"Status {response.status_code}: {response.text}")
            return False, None
            
    except Exception as e:
        log_test("GET /api/auth/me (valid token)", "FAIL", f"Exception: {str(e)}")
        return False, None

def test_auth_logout(session_token):
    """Test POST /api/auth/logout with Bearer token"""
    try:
        headers = {"Authorization": f"Bearer {session_token}"}
        response = requests.post(f"{API_BASE}/auth/logout", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") is True:
                log_test("POST /api/auth/logout", "PASS", "Successfully logged out")
                return True
            else:
                log_test("POST /api/auth/logout", "FAIL", f"Wrong response: {data}")
                return False
        else:
            log_test("POST /api/auth/logout", "FAIL", 
                    f"Status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("POST /api/auth/logout", "FAIL", f"Exception: {str(e)}")
        return False

def test_auth_me_invalid(session_token):
    """Test GET /api/auth/me with invalidated token (should return 401)"""
    try:
        headers = {"Authorization": f"Bearer {session_token}"}
        response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
        
        if response.status_code == 401:
            log_test("GET /api/auth/me (after logout)", "PASS", "Correctly returns 401")
            return True
        else:
            log_test("GET /api/auth/me (after logout)", "FAIL", 
                    f"Expected 401, got {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/auth/me (after logout)", "FAIL", f"Exception: {str(e)}")
        return False

def test_auth_exchange_fake():
    """Test POST /api/auth/exchange with fake session_id (should return 401)"""
    try:
        fake_session_id = "obviously_fake_session_id_12345"
        payload = {"session_id": fake_session_id}
        
        response = requests.post(f"{API_BASE}/auth/exchange", 
                               json=payload, timeout=10)
        
        if response.status_code == 401:
            log_test("POST /api/auth/exchange (fake session)", "PASS", "Correctly returns 401")
            return True
        else:
            log_test("POST /api/auth/exchange (fake session)", "FAIL", 
                    f"Expected 401, got {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("POST /api/auth/exchange (fake session)", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run all backend auth tests"""
    print("🚀 Starting MoodScript Phase 1 Backend Auth Tests")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    # Track test results
    results = []
    
    # Test 1: Basic API endpoint
    results.append(test_api_root())
    
    # Test 2: Seed test data
    session_token, user_id = seed_test_data()
    if not session_token:
        print("❌ Cannot continue without valid session token")
        return False
    
    # Test 3: Valid auth/me call
    success, user_data = test_auth_me_valid(session_token)
    results.append(success)
    
    # Test 4: Logout
    results.append(test_auth_logout(session_token))
    
    # Test 5: Auth/me after logout (should fail)
    results.append(test_auth_me_invalid(session_token))
    
    # Test 6: Fake auth exchange
    results.append(test_auth_exchange_fake())
    
    # Summary
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 ALL TESTS PASSED ({passed}/{total})")
        return True
    else:
        print(f"⚠️  SOME TESTS FAILED ({passed}/{total} passed)")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)