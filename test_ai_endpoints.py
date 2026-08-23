#!/usr/bin/env python3
"""
Focused test for AI endpoints after Gemini model name fix
Tests only the 3 AI endpoints as requested in review_request
"""

import requests
import json
import random
import sys

# Configuration
BASE_URL = "https://larvae-cycle.preview.emergentagent.com/api"
TIMEOUT = 30  # 30 seconds for AI endpoints

# Generate unique test user
random_suffix = random.randint(10000, 99999)
TEST_USER = {
    "email": f"aitest{random_suffix}@example.com",
    "password": "Test123456",
    "full_name": "AI Test User"
}

# Session to persist cookies
session = requests.Session()

def log_test(test_name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {test_name}")
    if details:
        print(f"   Details: {details}")

def register_and_login():
    """Register a fresh test user and keep session"""
    print("\n" + "="*60)
    print("REGISTERING TEST USER")
    print("="*60)
    
    try:
        resp = session.post(f"{BASE_URL}/auth/register", json=TEST_USER, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            if "user" in data:
                log_test("POST /api/auth/register", True, f"User: {data['user']['email']}")
                return True
            else:
                log_test("POST /api/auth/register", False, f"Unexpected response: {data}")
                return False
        else:
            log_test("POST /api/auth/register", False, f"Status {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        log_test("POST /api/auth/register", False, f"Exception: {str(e)}")
        return False

def test_ai_chat():
    """Test AI chat endpoint"""
    print("\n" + "="*60)
    print("TEST 1: POST /api/ai/chat")
    print("="*60)
    
    try:
        resp = session.post(f"{BASE_URL}/ai/chat", json={
            "message": "Bagaimana cara mengatasi larva BSF yang lambat tumbuh?",
            "history": []
        }, timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            answer = data.get("answer", "")
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            if answer and len(answer) > 10:
                log_test("POST /api/ai/chat", True, f"✅ Non-empty answer received ({len(answer)} chars)")
                return True
            else:
                log_test("POST /api/ai/chat", False, f"❌ Empty or too short answer: '{answer}'")
                return False
        else:
            error_text = resp.text
            print(f"Error Response: {error_text}")
            log_test("POST /api/ai/chat", False, f"❌ Status {resp.status_code}: {error_text}")
            return False
    except Exception as e:
        log_test("POST /api/ai/chat", False, f"❌ Exception: {str(e)}")
        return False

def test_ai_tips():
    """Test AI tips endpoint"""
    print("\n" + "="*60)
    print("TEST 2: POST /api/ai/tips")
    print("="*60)
    
    try:
        resp = session.post(f"{BASE_URL}/ai/tips", json={
            "waste_type": "campuran",
            "waste_weight_kg": 10,
            "base_tips": "test tips"
        }, timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            tips = data.get("tips", "")
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            if tips and len(tips) > 10:
                log_test("POST /api/ai/tips", True, f"✅ Non-empty tips received ({len(tips)} chars)")
                return True
            else:
                log_test("POST /api/ai/tips", False, f"❌ Empty or too short tips: '{tips}'")
                return False
        else:
            error_text = resp.text
            print(f"Error Response: {error_text}")
            log_test("POST /api/ai/tips", False, f"❌ Status {resp.status_code}: {error_text}")
            return False
    except Exception as e:
        log_test("POST /api/ai/tips", False, f"❌ Exception: {str(e)}")
        return False

def test_ai_failure_analysis():
    """Test AI failure analysis endpoint (requires creating a failed cycle first)"""
    print("\n" + "="*60)
    print("TEST 3: POST /api/ai/failure-analysis")
    print("="*60)
    
    # First, create a cycle
    print("\nStep 1: Creating a cycle...")
    try:
        resp = session.post(f"{BASE_URL}/cycles", json={
            "cycle_name": "Test Cycle for AI Analysis",
            "start_date": "2025-06-01",
            "waste_type": "campuran",
            "waste_weight_kg": 10,
            "seed_count": 50000
        }, timeout=10)
        
        if resp.status_code == 201:
            data = resp.json()
            cycle_id = data.get("cycle", {}).get("id")
            print(f"✅ Cycle created: {cycle_id}")
        else:
            print(f"❌ Failed to create cycle: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Exception creating cycle: {str(e)}")
        return False
    
    # Mark cycle as failed
    print("\nStep 2: Marking cycle as failed...")
    try:
        resp = session.post(f"{BASE_URL}/cycles/{cycle_id}/fail", json={
            "reason": "hama",
            "notes": "test failure for AI analysis"
        }, timeout=10)
        
        if resp.status_code == 200:
            print(f"✅ Cycle marked as failed")
        else:
            print(f"❌ Failed to mark cycle as failed: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Exception marking cycle as failed: {str(e)}")
        return False
    
    # Now test AI failure analysis
    print("\nStep 3: Testing AI failure analysis...")
    try:
        resp = session.post(f"{BASE_URL}/ai/failure-analysis", json={}, timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            insight = data.get("insight", "")
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            if insight and len(insight) > 10:
                log_test("POST /api/ai/failure-analysis", True, f"✅ Non-empty insight received ({len(insight)} chars)")
                return True
            else:
                log_test("POST /api/ai/failure-analysis", False, f"❌ Empty or too short insight: '{insight}'")
                return False
        else:
            error_text = resp.text
            print(f"Error Response: {error_text}")
            log_test("POST /api/ai/failure-analysis", False, f"❌ Status {resp.status_code}: {error_text}")
            return False
    except Exception as e:
        log_test("POST /api/ai/failure-analysis", False, f"❌ Exception: {str(e)}")
        return False

def check_server_logs():
    """Remind to check server logs if tests fail"""
    print("\n" + "="*60)
    print("CHECKING SERVER LOGS")
    print("="*60)
    print("If any tests failed with 500 errors, check server logs with:")
    print("  tail -n 100 /var/log/supervisor/nextjs.*.log")
    print("="*60)

def main():
    print("\n" + "="*80)
    print("AI ENDPOINTS TEST (Gemini model: gemini-3.1-pro-preview)")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_USER['email']}")
    print("="*80)
    
    # Register and login
    if not register_and_login():
        print("\n❌ Failed to register test user. Aborting tests.")
        return False
    
    # Run AI tests
    results = {}
    results["AI Chat"] = test_ai_chat()
    results["AI Tips"] = test_ai_tips()
    results["AI Failure Analysis"] = test_ai_failure_analysis()
    
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
    print(f"TOTAL: {passed}/{total} AI endpoint tests passed")
    print("="*80)
    
    if passed < total:
        check_server_logs()
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
