#!/usr/bin/env python3
"""
Focused test for Google sign-in bridging endpoint POST /api/auth/google-session
Tests edge cases and regression checks only - does not re-test other endpoints
"""

import requests
import json
import random

# Configuration
BASE_URL = "https://larvae-cycle.preview.emergentagent.com/api"
TIMEOUT = 10

# Generate unique test user for regression check
random_suffix = random.randint(10000, 99999)
TEST_USER = {
    "email": f"googletest{random_suffix}@example.com",
    "password": "GoogleTest123",
    "full_name": "Google Test User"
}

def log_test(test_name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {test_name}")
    if details:
        print(f"   Details: {details}")

def test_google_session_empty_body():
    """Test 1: POST /api/auth/google-session with empty body -> expect 400"""
    print("\n" + "="*60)
    print("TEST 1: Google session with empty body")
    print("="*60)
    
    session = requests.Session()
    
    try:
        resp = session.post(f"{BASE_URL}/auth/google-session", json={}, timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        print(f"Response Body: {resp.text}")
        
        if resp.status_code == 400:
            try:
                data = resp.json()
                if "error" in data and "session_id" in data["error"].lower():
                    log_test("Empty body returns 400 with session_id error", True, 
                            f"Error message: {data['error']}")
                    return True
                else:
                    log_test("Empty body returns 400 with session_id error", False, 
                            f"Error message doesn't mention session_id: {data}")
                    return False
            except:
                log_test("Empty body returns 400 with session_id error", False, 
                        "Response is not valid JSON")
                return False
        else:
            log_test("Empty body returns 400 with session_id error", False, 
                    f"Expected 400, got {resp.status_code}")
            return False
    except Exception as e:
        log_test("Empty body returns 400 with session_id error", False, f"Exception: {str(e)}")
        return False

def test_google_session_fake_id():
    """Test 2: POST /api/auth/google-session with fake session_id -> expect 401 (not 500)"""
    print("\n" + "="*60)
    print("TEST 2: Google session with fake/invalid session_id")
    print("="*60)
    
    session = requests.Session()
    
    try:
        resp = session.post(f"{BASE_URL}/auth/google-session", 
                           json={"session_id": "fake-invalid-session-id-12345"}, 
                           timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        print(f"Response Body: {resp.text}")
        
        # The key requirement: should be 401, NOT 500 (no crash)
        if resp.status_code == 401:
            try:
                data = resp.json()
                if "error" in data:
                    log_test("Fake session_id returns 401 (not 500) with error JSON", True, 
                            f"Error message: {data['error']}")
                    return True
                else:
                    log_test("Fake session_id returns 401 (not 500) with error JSON", False, 
                            f"Response missing 'error' field: {data}")
                    return False
            except:
                log_test("Fake session_id returns 401 (not 500) with error JSON", False, 
                        "Response is not valid JSON")
                return False
        elif resp.status_code == 500:
            log_test("Fake session_id returns 401 (not 500) with error JSON", False, 
                    "CRITICAL: Server crashed with 500 error - should handle gracefully with 401")
            return False
        else:
            log_test("Fake session_id returns 401 (not 500) with error JSON", False, 
                    f"Expected 401, got {resp.status_code}")
            return False
    except Exception as e:
        log_test("Fake session_id returns 401 (not 500) with error JSON", False, f"Exception: {str(e)}")
        return False

def test_auth_me_unauthenticated():
    """Test 3: Verify GET /api/auth/me returns 401 for unauthenticated session"""
    print("\n" + "="*60)
    print("TEST 3: GET /api/auth/me without authentication")
    print("="*60)
    
    # Fresh session without any auth
    session = requests.Session()
    
    try:
        resp = session.get(f"{BASE_URL}/auth/me", timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        print(f"Response Body: {resp.text}")
        
        if resp.status_code == 401:
            log_test("GET /api/auth/me returns 401 when unauthenticated", True, 
                    "Existing auth flow unaffected")
            return True
        else:
            log_test("GET /api/auth/me returns 401 when unauthenticated", False, 
                    f"Expected 401, got {resp.status_code}")
            return False
    except Exception as e:
        log_test("GET /api/auth/me returns 401 when unauthenticated", False, f"Exception: {str(e)}")
        return False

def test_auth_register_regression():
    """Test 4: Quick regression - POST /api/auth/register still works"""
    print("\n" + "="*60)
    print("TEST 4: Regression check - auth register and me")
    print("="*60)
    
    session = requests.Session()
    
    # 4a. Register new user
    try:
        resp = session.post(f"{BASE_URL}/auth/register", json=TEST_USER, timeout=TIMEOUT)
        
        print(f"Register Status Code: {resp.status_code}")
        print(f"Register Response: {resp.text[:200]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if "user" in data and data["user"].get("email") == TEST_USER["email"]:
                log_test("POST /api/auth/register (regression)", True, 
                        f"User created: {data['user']['id']}")
            else:
                log_test("POST /api/auth/register (regression)", False, 
                        f"Unexpected response: {data}")
                return False
        else:
            log_test("POST /api/auth/register (regression)", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("POST /api/auth/register (regression)", False, f"Exception: {str(e)}")
        return False
    
    # 4b. GET /api/auth/me should return user
    try:
        resp = session.get(f"{BASE_URL}/auth/me", timeout=TIMEOUT)
        
        print(f"Auth/me Status Code: {resp.status_code}")
        print(f"Auth/me Response: {resp.text[:200]}")
        
        if resp.status_code == 200:
            data = resp.json()
            if "user" in data and "profile" in data:
                if data["user"]["email"] == TEST_USER["email"]:
                    log_test("GET /api/auth/me after register (regression)", True, 
                            f"User authenticated: {data['profile'].get('full_name')}")
                    return True
                else:
                    log_test("GET /api/auth/me after register (regression)", False, 
                            f"Email mismatch: {data['user']['email']}")
                    return False
            else:
                log_test("GET /api/auth/me after register (regression)", False, 
                        f"Missing user or profile: {data}")
                return False
        else:
            log_test("GET /api/auth/me after register (regression)", False, 
                    f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("GET /api/auth/me after register (regression)", False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "="*80)
    print("GOOGLE SIGN-IN BRIDGING ENDPOINT TEST")
    print("Testing POST /api/auth/google-session edge cases")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = {}
    
    # Run focused tests
    results["Test 1: Empty body -> 400"] = test_google_session_empty_body()
    results["Test 2: Fake session_id -> 401 (not 500)"] = test_google_session_fake_id()
    results["Test 3: GET /api/auth/me unauthenticated -> 401"] = test_auth_me_unauthenticated()
    results["Test 4: Register regression check"] = test_auth_register_regression()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("="*80)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("="*80)
    
    if passed == total:
        print("\n✅ ALL GOOGLE AUTH TESTS PASSED")
        print("The new Google sign-in endpoint handles edge cases correctly:")
        print("  - Missing session_id returns 400 with proper error message")
        print("  - Invalid session_id returns 401 (not 500 crash) with error JSON")
        print("  - Existing auth flow (register, me) remains unaffected")
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED")
        print("Please review the failures above for details")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
