import requests
import sys
import json
from datetime import datetime, timedelta

class TaskManagerAPITester:
    def __init__(self, base_url="https://student-data-mgmt.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_task_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_task(self, title, description="", status="pending", deadline=None):
        """Test creating a new task"""
        task_data = {
            "title": title,
            "description": description,
            "status": status
        }
        if deadline:
            task_data["deadline"] = deadline
            
        success, response = self.run_test(
            f"Create Task: {title}",
            "POST",
            "tasks",
            200,  # FastAPI typically returns 200 for successful POST
            data=task_data
        )
        
        if success and 'id' in response:
            self.created_task_ids.append(response['id'])
            return response['id'], response
        return None, {}

    def test_get_all_tasks(self):
        """Test getting all tasks"""
        success, response = self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200
        )
        return success, response

    def test_get_single_task(self, task_id):
        """Test getting a single task by ID"""
        success, response = self.run_test(
            f"Get Task by ID: {task_id}",
            "GET",
            f"tasks/{task_id}",
            200
        )
        return success, response

    def test_update_task(self, task_id, updates):
        """Test updating a task"""
        success, response = self.run_test(
            f"Update Task: {task_id}",
            "PUT",
            f"tasks/{task_id}",
            200,
            data=updates
        )
        return success, response

    def test_update_task_status(self, task_id, new_status):
        """Test updating task status only"""
        success, response = self.run_test(
            f"Update Task Status: {task_id} -> {new_status}",
            "PATCH",
            f"tasks/{task_id}/status",
            200,
            data={"status": new_status}
        )
        return success, response

    def test_delete_task(self, task_id):
        """Test deleting a task"""
        success, response = self.run_test(
            f"Delete Task: {task_id}",
            "DELETE",
            f"tasks/{task_id}",
            200
        )
        return success, response

    def test_error_cases(self):
        """Test error handling"""
        print("\n🔍 Testing Error Cases...")
        
        # Test getting non-existent task
        self.run_test(
            "Get Non-existent Task",
            "GET",
            "tasks/non-existent-id",
            404
        )
        
        # Test updating non-existent task
        self.run_test(
            "Update Non-existent Task",
            "PUT",
            "tasks/non-existent-id",
            404,
            data={"title": "Updated"}
        )
        
        # Test deleting non-existent task
        self.run_test(
            "Delete Non-existent Task",
            "DELETE",
            "tasks/non-existent-id",
            404
        )
        
        # Test creating task without title
        self.run_test(
            "Create Task Without Title",
            "POST",
            "tasks",
            422,  # Validation error
            data={"description": "No title"}
        )

def main():
    print("🚀 Starting Task Manager API Tests...")
    print("=" * 50)
    
    tester = TaskManagerAPITester()
    
    # Test 1: Create multiple tasks
    print("\n📝 TESTING TASK CREATION")
    task1_id, task1 = tester.test_create_task(
        "Complete project documentation",
        "Write comprehensive documentation for the task manager project",
        "pending",
        "2024-12-31"
    )
    
    task2_id, task2 = tester.test_create_task(
        "Review code changes",
        "Review and approve pending pull requests",
        "in-progress"
    )
    
    task3_id, task3 = tester.test_create_task(
        "Deploy to production",
        "Deploy the latest version to production environment",
        "completed",
        "2024-12-15"
    )
    
    # Test 2: Get all tasks
    print("\n📋 TESTING TASK RETRIEVAL")
    success, all_tasks = tester.test_get_all_tasks()
    if success:
        print(f"   Found {len(all_tasks)} tasks in database")
    
    # Test 3: Get individual tasks
    if task1_id:
        tester.test_get_single_task(task1_id)
    
    # Test 4: Update task
    print("\n✏️ TESTING TASK UPDATES")
    if task1_id:
        tester.test_update_task(task1_id, {
            "title": "Complete project documentation - UPDATED",
            "description": "Write comprehensive documentation for the task manager project - with examples",
            "status": "in-progress"
        })
    
    # Test 5: Update task status only
    if task2_id:
        tester.test_update_task_status(task2_id, "completed")
    
    # Test 6: Error cases
    tester.test_error_cases()
    
    # Test 7: Delete tasks (cleanup)
    print("\n🗑️ TESTING TASK DELETION")
    for task_id in tester.created_task_ids:
        tester.test_delete_task(task_id)
    
    # Final verification - check if tasks were deleted
    print("\n🔍 VERIFYING CLEANUP")
    success, remaining_tasks = tester.test_get_all_tasks()
    if success:
        created_tasks_remaining = [t for t in remaining_tasks if t.get('id') in tester.created_task_ids]
        if not created_tasks_remaining:
            print("✅ All test tasks cleaned up successfully")
        else:
            print(f"⚠️ {len(created_tasks_remaining)} test tasks still remain")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())