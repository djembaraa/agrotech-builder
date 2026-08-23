#!/usr/bin/env python3
"""
Backend API Test Suite for Agrotech Tracker - AI Endpoints Re-test
Tests the 3 AI endpoints after model change to gemini-3.6-flash
"""

import requests
import json
import random
from datetime import datetime

# Base URL from .env
BASE_URL = "https://larvae-cycle.preview.emergentagent.com/api"

# Session to maintain cookies
session = requests.Session()

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")

def test_ai_endpoints():
    """Test ONLY the 3 AI endpoints after model change to gemini-3.6-flash"""
    print("\n" + "="*80)
    print("AI ENDPOINTS RE-TEST (gemini-3.6-flash)")
    print("="*80)
    
    # Step 1: Register a fresh test user
    print("\n[SETUP] Registering fresh test user...")
    timestamp = random.randint(10000, 99999)
    test_email = f"aitest{timestamp}@example.com"
    test_password = "testpass123"
    test_name = f"AI Tester {timestamp}"
    
    try:
        register_resp = session.post(f"{BASE_URL}/auth/register", json={
            "email": test_email,
            "password": test_password,
            "full_name": test_name
        })
        
        if register_resp.status_code != 200:
            print(f"❌ SETUP FAILED: Registration failed with status {register_resp.status_code}")
            print(f"   Response: {register_resp.text}")
            return
        
        print(f"✅ SETUP: User registered and logged in: {test_email}")
        
    except Exception as e:
        print(f"❌ SETUP FAILED: {str(e)}")
        return
    
    # Test 1: POST /api/ai/chat
    print("\n[TEST 1] POST /api/ai/chat - Indonesian BSF question")
    try:
        chat_resp = session.post(f"{BASE_URL}/ai/chat", json={
            "message": "Bagaimana cara mengatasi larva BSF yang lambat tumbuh?",
            "history": []
        })
        
        chat_data = chat_resp.json()
        
        if chat_resp.status_code == 200:
            answer = chat_data.get("answer", "")
            if answer and len(answer) > 0:
                print_test("AI Chat endpoint", True, f"Status: {chat_resp.status_code}, Answer length: {len(answer)} chars")
                print(f"   Answer preview: {answer[:150]}...")
            else:
                print_test("AI Chat endpoint", False, f"Status: {chat_resp.status_code}, but answer is empty")
                print(f"   Response: {json.dumps(chat_data, indent=2)}")
        else:
            print_test("AI Chat endpoint", False, f"Status: {chat_resp.status_code}")
            print(f"   Error: {chat_data.get('error', 'Unknown error')}")
            print(f"   Full response: {json.dumps(chat_data, indent=2)}")
            
    except Exception as e:
        print_test("AI Chat endpoint", False, f"Exception: {str(e)}")
    
    # Test 2: POST /api/ai/tips
    print("\n[TEST 2] POST /api/ai/tips - Extra tips for calculator")
    try:
        tips_resp = session.post(f"{BASE_URL}/ai/tips", json={
            "waste_type": "campuran",
            "waste_weight_kg": 10,
            "base_tips": "test tips"
        })
        
        tips_data = tips_resp.json()
        
        if tips_resp.status_code == 200:
            tips = tips_data.get("tips", "")
            if tips and len(tips) > 0:
                print_test("AI Tips endpoint", True, f"Status: {tips_resp.status_code}, Tips length: {len(tips)} chars")
                print(f"   Tips preview: {tips[:150]}...")
            else:
                print_test("AI Tips endpoint", False, f"Status: {tips_resp.status_code}, but tips is empty")
                print(f"   Response: {json.dumps(tips_data, indent=2)}")
        else:
            print_test("AI Tips endpoint", False, f"Status: {tips_resp.status_code}")
            print(f"   Error: {tips_data.get('error', 'Unknown error')}")
            print(f"   Full response: {json.dumps(tips_data, indent=2)}")
            
    except Exception as e:
        print_test("AI Tips endpoint", False, f"Exception: {str(e)}")
    
    # Test 3: POST /api/ai/failure-analysis (requires a failed cycle)
    print("\n[TEST 3] POST /api/ai/failure-analysis - Failure pattern analysis")
    
    # First create a cycle
    print("   [SETUP] Creating a test cycle...")
    try:
        cycle_resp = session.post(f"{BASE_URL}/cycles", json={
            "cycle_name": f"Test Cycle {timestamp}",
            "start_date": "2025-06-01",
            "waste_type": "campuran",
            "waste_weight_kg": 10,
            "seed_count": 50000
        })
        
        if cycle_resp.status_code != 201:
            print(f"   ❌ Failed to create cycle: {cycle_resp.status_code}")
            print(f"   Response: {cycle_resp.text}")
            return
        
        cycle_data = cycle_resp.json()
        cycle_id = cycle_data.get("cycle", {}).get("id")
        print(f"   ✅ Cycle created: {cycle_id}")
        
        # Mark it as failed
        print("   [SETUP] Marking cycle as failed...")
        fail_resp = session.post(f"{BASE_URL}/cycles/{cycle_id}/fail", json={
            "reason": "hama",
            "notes": "test"
        })
        
        if fail_resp.status_code != 200:
            print(f"   ❌ Failed to mark cycle as failed: {fail_resp.status_code}")
            print(f"   Response: {fail_resp.text}")
            return
        
        print(f"   ✅ Cycle marked as failed")
        
        # Now test failure analysis
        analysis_resp = session.post(f"{BASE_URL}/ai/failure-analysis", json={})
        
        analysis_data = analysis_resp.json()
        
        if analysis_resp.status_code == 200:
            insight = analysis_data.get("insight", "")
            if insight and len(insight) > 0:
                print_test("AI Failure Analysis endpoint", True, f"Status: {analysis_resp.status_code}, Insight length: {len(insight)} chars")
                print(f"   Insight preview: {insight[:150]}...")
            else:
                print_test("AI Failure Analysis endpoint", False, f"Status: {analysis_resp.status_code}, but insight is empty")
                print(f"   Response: {json.dumps(analysis_data, indent=2)}")
        else:
            print_test("AI Failure Analysis endpoint", False, f"Status: {analysis_resp.status_code}")
            print(f"   Error: {analysis_data.get('error', 'Unknown error')}")
            print(f"   Full response: {json.dumps(analysis_data, indent=2)}")
            
    except Exception as e:
        print_test("AI Failure Analysis endpoint", False, f"Exception: {str(e)}")
    
    print("\n" + "="*80)
    print("AI ENDPOINTS RE-TEST COMPLETE")
    print("="*80)

if __name__ == "__main__":
    test_ai_endpoints()
