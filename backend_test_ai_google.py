#!/usr/bin/env python3
"""
Focused backend test for NEW/CHANGED endpoints:
1. AI endpoints (now using direct Google Gemini API with gemini-3.1-pro model)
2. Link Google endpoint (POST /api/profile/link-google)

Tests ONLY these endpoints as requested in review_request.
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

def setup_auth():
    """Register and login test user"""
    print("\n" + "="*80)
    print("SETUP: Registering test user")
    print("="*80)
    
    try:
        resp = session.post(f"{BASE_URL}/auth/register", json=TEST_USER, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Registered user: {data['user']['email']}")
            return True
        else:
            print(f"❌ Registration failed: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Registration exception: {str(e)}")
        return False

def test_ai_chat():
    """Test POST /api/ai/chat with Indonesian question"""
    print("\n" + "="*80)
    print("TEST 1: POST /api/ai/chat (Gemini Direct API)")
    print("="*80)
    
    try:
        resp = session.post(f"{BASE_URL}/ai/chat", json={
            "message": "Bagaimana cara mengatasi larva BSF yang lambat tumbuh?",
            "history": []
        }, timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        print(f"Response Headers: {dict(resp.headers)}")
        
        if resp.status_code == 200:
            try:
                data = resp.json()
                answer = data.get("answer", "")
                print(f"Response Body: {json.dumps(data, indent=2, ensure_ascii=False)}")
                
                if answer and len(answer) > 10:
                    log_test("POST /api/ai/chat", True, f"✅ Got Indonesian answer ({len(answer)} chars)")
                    return True
                else:
                    log_test("POST /api/ai/chat", False, f"❌ Empty or too short answer: '{answer}'")
                    return False
            except json.JSONDecodeError as e:
                log_test("POST /api/ai/chat", False, f"❌ Invalid JSON response: {resp.text}")
                return False
        else:
            # CRITICAL: Capture exact error for debugging model name issue
            try:
                error_data = resp.json()
                error_msg = error_data.get("error", resp.text)
            except:
                error_msg = resp.text
            
            print(f"❌ EXACT ERROR RESPONSE: {error_msg}")
            log_test("POST /api/ai/chat", False, f"Status {resp.status_code}: {error_msg}")
            return False
            
    except requests.exceptions.Timeout:
        log_test("POST /api/ai/chat", False, "❌ Request timeout (>30s)")
        return False
    except Exception as e:
        log_test("POST /api/ai/chat", False, f"❌ Exception: {str(e)}")
        return False

def test_ai_tips():
    """Test POST /api/ai/tips"""
    print("\n" + "="*80)
    print("TEST 2: POST /api/ai/tips (Gemini Direct API)")
    print("="*80)
    
    try:
        resp = session.post(f"{BASE_URL}/ai/tips", json={
            "waste_type": "campuran",
            "waste_weight_kg": 10,
            "base_tips": "test tips"
        }, timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            try:
                data = resp.json()
                tips = data.get("tips", "")
                print(f"Response Body: {json.dumps(data, indent=2, ensure_ascii=False)}")
                
                if tips and len(tips) > 10:
                    log_test("POST /api/ai/tips", True, f"✅ Got tips ({len(tips)} chars)")
                    return True
                else:
                    log_test("POST /api/ai/tips", False, f"❌ Empty or too short tips: '{tips}'")
                    return False
            except json.JSONDecodeError:
                log_test("POST /api/ai/tips", False, f"❌ Invalid JSON response: {resp.text}")
                return False
        else:
            # CRITICAL: Capture exact error
            try:
                error_data = resp.json()
                error_msg = error_data.get("error", resp.text)
            except:
                error_msg = resp.text
            
            print(f"❌ EXACT ERROR RESPONSE: {error_msg}")
            log_test("POST /api/ai/tips", False, f"Status {resp.status_code}: {error_msg}")
            return False
            
    except requests.exceptions.Timeout:
        log_test("POST /api/ai/tips", False, "❌ Request timeout (>30s)")
        return False
    except Exception as e:
        log_test("POST /api/ai/tips", False, f"❌ Exception: {str(e)}")
        return False

def test_ai_failure_analysis():
    """Test POST /api/ai/failure-analysis (requires failure data)"""
    print("\n" + "="*80)
    print("TEST 3: POST /api/ai/failure-analysis (Gemini Direct API)")
    print("="*80)
    
    # First create a cycle and mark it failed
    print("Setup: Creating cycle and marking as failed...")
    try:
        # Create cycle
        cycle_resp = session.post(f"{BASE_URL}/cycles", json={
            "cycle_name": "Test AI Analysis",
            "start_date": "2025-06-01",
            "waste_type": "campuran",
            "waste_weight_kg": 10,
            "seed_count": 50000
        }, timeout=10)
        
        if cycle_resp.status_code != 201:
            print(f"❌ Failed to create cycle: {cycle_resp.status_code} - {cycle_resp.text}")
            log_test("POST /api/ai/failure-analysis", False, "Setup failed: couldn't create cycle")
            return False
        
        cycle_id = cycle_resp.json()["cycle"]["id"]
        print(f"✅ Created cycle: {cycle_id}")
        
        # Mark as failed
        fail_resp = session.post(f"{BASE_URL}/cycles/{cycle_id}/fail", json={
            "reason": "hama",
            "notes": "test failure for AI analysis"
        }, timeout=10)
        
        if fail_resp.status_code != 200:
            print(f"❌ Failed to mark cycle as failed: {fail_resp.status_code} - {fail_resp.text}")
            log_test("POST /api/ai/failure-analysis", False, "Setup failed: couldn't fail cycle")
            return False
        
        print(f"✅ Marked cycle as failed")
        
    except Exception as e:
        print(f"❌ Setup exception: {str(e)}")
        log_test("POST /api/ai/failure-analysis", False, f"Setup exception: {str(e)}")
        return False
    
    # Now test AI failure analysis
    try:
        resp = session.post(f"{BASE_URL}/ai/failure-analysis", json={}, timeout=TIMEOUT)
        
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            try:
                data = resp.json()
                insight = data.get("insight", "")
                print(f"Response Body: {json.dumps(data, indent=2, ensure_ascii=False)}")
                
                if insight and len(insight) > 10:
                    # Check if insight references the failure
                    if "hama" in insight.lower() or "gagal" in insight.lower() or "kegagalan" in insight.lower():
                        log_test("POST /api/ai/failure-analysis", True, f"✅ Got insight referencing failure ({len(insight)} chars)")
                        return True
                    else:
                        log_test("POST /api/ai/failure-analysis", True, f"✅ Got insight ({len(insight)} chars) - may not reference specific failure")
                        return True
                else:
                    log_test("POST /api/ai/failure-analysis", False, f"❌ Empty or too short insight: '{insight}'")
                    return False
            except json.JSONDecodeError:
                log_test("POST /api/ai/failure-analysis", False, f"❌ Invalid JSON response: {resp.text}")
                return False
        else:
            # CRITICAL: Capture exact error
            try:
                error_data = resp.json()
                error_msg = error_data.get("error", resp.text)
            except:
                error_msg = resp.text
            
            print(f"❌ EXACT ERROR RESPONSE: {error_msg}")
            log_test("POST /api/ai/failure-analysis", False, f"Status {resp.status_code}: {error_msg}")
            return False
            
    except requests.exceptions.Timeout:
        log_test("POST /api/ai/failure-analysis", False, "❌ Request timeout (>30s)")
        return False
    except Exception as e:
        log_test("POST /api/ai/failure-analysis", False, f"❌ Exception: {str(e)}")
        return False

def test_link_google_empty_body():
    """Test POST /api/profile/link-google with empty body (expect 400)"""
    print("\n" + "="*80)
    print("TEST 4: POST /api/profile/link-google (empty body)")
    print("="*80)
    
    try:
        resp = session.post(f"{BASE_URL}/profile/link-google", json={}, timeout=10)
        
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 400:
            try:
                data = resp.json()
                error_msg = data.get("error", "")
                print(f"Response Body: {json.dumps(data, indent=2, ensure_ascii=False)}")
                
                if "session_id" in error_msg.lower():
                    log_test("POST /api/profile/link-google (empty body)", True, f"✅ Correctly returned 400 with error: '{error_msg}'")
                    return True
                else:
                    log_test("POST /api/profile/link-google (empty body)", False, f"❌ Got 400 but wrong error message: '{error_msg}'")
                    return False
            except json.JSONDecodeError:
                log_test("POST /api/profile/link-google (empty body)", False, f"❌ Invalid JSON response: {resp.text}")
                return False
        else:
            print(f"Response: {resp.text}")
            log_test("POST /api/profile/link-google (empty body)", False, f"❌ Expected 400, got {resp.status_code}")
            return False
            
    except Exception as e:
        log_test("POST /api/profile/link-google (empty body)", False, f"❌ Exception: {str(e)}")
        return False

def test_link_google_fake_session():
    """Test POST /api/profile/link-google with fake session_id (expect 401 at Emergent fetch)"""
    print("\n" + "="*80)
    print("TEST 5: POST /api/profile/link-google (fake session_id)")
    print("="*80)
    
    try:
        resp = session.post(f"{BASE_URL}/profile/link-google", json={
            "session_id": "fake-test-id-999"
        }, timeout=10)
        
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 401:
            try:
                data = resp.json()
                error_msg = data.get("error", "")
                print(f"Response Body: {json.dumps(data, indent=2, ensure_ascii=False)}")
                
                # Should fail at Emergent session-data fetch, not at DB column
                if "google" in error_msg.lower() and ("tidak valid" in error_msg.lower() or "kedaluwarsa" in error_msg.lower()):
                    log_test("POST /api/profile/link-google (fake session_id)", True, f"✅ Correctly returned 401 with error: '{error_msg}'")
                    return True
                else:
                    log_test("POST /api/profile/link-google (fake session_id)", True, f"✅ Got 401 with error: '{error_msg}' (acceptable)")
                    return True
            except json.JSONDecodeError:
                log_test("POST /api/profile/link-google (fake session_id)", False, f"❌ Invalid JSON response (not clean JSON 401): {resp.text}")
                return False
        elif resp.status_code == 500:
            # This would indicate a crash (bad - should be 401)
            print(f"❌ CRITICAL: Got 500 instead of 401 - server crash!")
            print(f"Response: {resp.text}")
            log_test("POST /api/profile/link-google (fake session_id)", False, f"❌ Got 500 crash instead of clean 401: {resp.text}")
            return False
        else:
            print(f"Response: {resp.text}")
            log_test("POST /api/profile/link-google (fake session_id)", False, f"❌ Expected 401, got {resp.status_code}")
            return False
            
    except Exception as e:
        log_test("POST /api/profile/link-google (fake session_id)", False, f"❌ Exception: {str(e)}")
        return False

def test_auth_me_after_link_google():
    """Verify GET /api/auth/me still works after failed link-google calls"""
    print("\n" + "="*80)
    print("TEST 6: GET /api/auth/me (verify session not corrupted)")
    print("="*80)
    
    try:
        resp = session.get(f"{BASE_URL}/auth/me", timeout=10)
        
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            try:
                data = resp.json()
                if "user" in data and "profile" in data:
                    log_test("GET /api/auth/me (after link-google)", True, f"✅ Session still valid: {data['user']['email']}")
                    return True
                else:
                    log_test("GET /api/auth/me (after link-google)", False, f"❌ Missing user or profile: {data}")
                    return False
            except json.JSONDecodeError:
                log_test("GET /api/auth/me (after link-google)", False, f"❌ Invalid JSON response: {resp.text}")
                return False
        else:
            print(f"Response: {resp.text}")
            log_test("GET /api/auth/me (after link-google)", False, f"❌ Expected 200, got {resp.status_code}")
            return False
            
    except Exception as e:
        log_test("GET /api/auth/me (after link-google)", False, f"❌ Exception: {str(e)}")
        return False

def main():
    print("\n" + "="*80)
    print("AGROTECH TRACKER - AI & GOOGLE LINK ENDPOINT TESTS")
    print("Testing NEW/CHANGED endpoints only (as per review_request)")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_USER['email']}")
    print("="*80)
    
    # Setup
    if not setup_auth():
        print("\n❌ SETUP FAILED - Cannot proceed with tests")
        return False
    
    # Run tests
    results = {}
    results["AI Chat"] = test_ai_chat()
    results["AI Tips"] = test_ai_tips()
    results["AI Failure Analysis"] = test_ai_failure_analysis()
    results["Link Google (empty body)"] = test_link_google_empty_body()
    results["Link Google (fake session)"] = test_link_google_fake_session()
    results["Auth Me (after link-google)"] = test_auth_me_after_link_google()
    
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
    
    if passed < total:
        print("\n⚠️  IMPORTANT: For any AI endpoint failures, check the EXACT ERROR messages above")
        print("    to determine if the issue is:")
        print("    - Invalid model name 'gemini-3.1-pro' (model not found)")
        print("    - API key authentication issue")
        print("    - Other Gemini API error")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
