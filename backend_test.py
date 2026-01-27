import requests
import sys
import json
from datetime import datetime
import time

class PodcastMatchAPITester:
    def __init__(self, base_url="https://podpairer.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details if not success else "")
            
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_session(self):
        """Create a test session using MongoDB directly"""
        print("\n🔧 Setting up test session...")
        
        # For testing, we'll create a mock session
        # In a real scenario, this would go through the OAuth flow
        test_session_id = f"test_session_{int(time.time())}"
        test_user_id = f"test_user_{int(time.time())}"
        
        # Try to create session via auth endpoint (this will fail without valid session_id)
        success, response = self.run_test(
            "Create Session (Expected to fail without valid session_id)",
            "POST",
            "api/auth/session",
            400,  # Expected to fail
            headers={"X-Session-ID": test_session_id}
        )
        
        # For testing purposes, we'll use a mock token
        self.session_token = "test_token_for_api_testing"
        self.user_id = test_user_id
        
        print(f"📝 Using test session token: {self.session_token}")
        return True

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test /api/auth/me (will fail without valid session)
        self.run_test(
            "Get Current User",
            "GET", 
            "api/auth/me",
            401  # Expected to fail without valid session
        )
        
        # Test logout
        self.run_test(
            "Logout",
            "POST",
            "api/auth/logout", 
            200
        )

    def test_role_endpoints(self):
        """Test role selection endpoints"""
        print("\n👤 Testing Role Selection...")
        
        self.run_test(
            "Select Role (Host)",
            "POST",
            "api/role",
            401,  # Expected to fail without valid session
            data={"role": "host"}
        )

    def test_profile_endpoints(self):
        """Test profile endpoints"""
        print("\n📝 Testing Profile Endpoints...")
        
        # Test profile setup
        profile_data = {
            "niche": ["Technology", "Business"],
            "language": "English",
            "country": "United States",
            "availability": "Weekday mornings",
            "podcast_name": "Test Podcast",
            "podcast_description": "A test podcast for API testing",
            "topics": ["Technology"],
            "audience_size": "10K-50K",
            "preferred_guest_type": ["Expert"],
            "recording_format": "remote"
        }
        
        self.run_test(
            "Setup Profile",
            "POST",
            "api/profile",
            401,  # Expected to fail without valid session
            data=profile_data
        )
        
        self.run_test(
            "Get Profile",
            "GET",
            "api/profile",
            401  # Expected to fail without valid session
        )

    def test_discovery_endpoints(self):
        """Test discovery endpoints"""
        print("\n🔍 Testing Discovery Endpoints...")
        
        self.run_test(
            "Get Candidates",
            "GET",
            "api/discover",
            401  # Expected to fail without valid session
        )

    def test_swipe_endpoints(self):
        """Test swipe endpoints"""
        print("\n👆 Testing Swipe Endpoints...")
        
        self.run_test(
            "Record Swipe",
            "POST",
            "api/swipe",
            401,  # Expected to fail without valid session
            data={"target_id": "test_user_123", "direction": "right"}
        )

    def test_match_endpoints(self):
        """Test match endpoints"""
        print("\n💕 Testing Match Endpoints...")
        
        self.run_test(
            "Get Matches",
            "GET",
            "api/matches",
            401  # Expected to fail without valid session
        )

    def test_chat_endpoints(self):
        """Test chat endpoints"""
        print("\n💬 Testing Chat Endpoints...")
        
        test_match_id = "test_match_123"
        
        self.run_test(
            "Get Chat Messages",
            "GET",
            f"api/chat/{test_match_id}/messages",
            401  # Expected to fail without valid session
        )
        
        self.run_test(
            "Send Message",
            "POST",
            f"api/chat/{test_match_id}/messages",
            401,  # Expected to fail without valid session
            data={"content": "Hello, this is a test message!"}
        )

    def test_ai_endpoints(self):
        """Test AI endpoints"""
        print("\n🤖 Testing AI Endpoints...")
        
        self.run_test(
            "Generate AI Pitch",
            "POST",
            "api/ai/generate-pitch",
            401,  # Expected to fail without valid session
            data={"match_id": "test_match_123"}
        )

    def test_subscription_endpoints(self):
        """Test subscription endpoints"""
        print("\n💳 Testing Subscription Endpoints...")
        
        self.run_test(
            "Get Subscription Status",
            "GET",
            "api/subscription/status",
            401  # Expected to fail without valid session
        )
        
        checkout_data = {
            "package_id": "pro_monthly",
            "origin_url": "https://podpairer.preview.emergentagent.com"
        }
        
        self.run_test(
            "Create Checkout Session",
            "POST",
            "api/subscription/checkout",
            401,  # Expected to fail without valid session
            data=checkout_data
        )

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        self.run_test(
            "Get Admin Stats",
            "GET",
            "api/admin/stats",
            401  # Expected to fail without valid session
        )
        
        self.run_test(
            "Get All Users",
            "GET",
            "api/admin/users",
            401  # Expected to fail without valid session
        )

    def test_basic_connectivity(self):
        """Test basic server connectivity"""
        print("\n🌐 Testing Basic Connectivity...")
        
        try:
            # Test if server is responding
            response = requests.get(f"{self.base_url}/", timeout=10)
            self.log_test("Server Connectivity", True, f"Server responding with status {response.status_code}")
        except Exception as e:
            self.log_test("Server Connectivity", False, f"Cannot connect to server: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting PodcastMatch API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity first
        self.test_basic_connectivity()
        
        # Create test session
        self.create_test_session()
        
        # Run all endpoint tests
        self.test_auth_endpoints()
        self.test_role_endpoints()
        self.test_profile_endpoints()
        self.test_discovery_endpoints()
        self.test_swipe_endpoints()
        self.test_match_endpoints()
        self.test_chat_endpoints()
        self.test_ai_endpoints()
        self.test_subscription_endpoints()
        self.test_admin_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = PodcastMatchAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())