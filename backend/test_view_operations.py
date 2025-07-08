#!/usr/bin/env python3
"""
Test script for expense tracker view operations
This script demonstrates how the view operations work with different user queries.
"""

import requests
import json

# API endpoint
BASE_URL = "http://localhost:5001"

def test_view_operation(prompt):
    """Test a view operation with the given prompt"""
    print(f"\n{'='*60}")
    print(f"Testing View Operation")
    print(f"Prompt: {prompt}")
    print(f"{'='*60}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/expense-tracker",
            json={"prompt": prompt},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Status: {result.get('status')}")
            print(f"Prompt Type: {result.get('prompt_type')}")
            
            if result.get('query_result'):
                query_result = result['query_result']
                print(f"\nGenerated Query Code:")
                print(f"{query_result.get('query_code', 'No query code generated')}")
                
                print(f"\nFilters Applied:")
                filters = query_result.get('filters', {})
                for key, value in filters.items():
                    if value:
                        print(f"  {key}: {value}")
                
                print(f"\nExplanation:")
                print(f"  {query_result.get('explanation', 'No explanation provided')}")
        
        elif response.status_code == 400:
            error = response.json()
            print(f"Error: {error.get('error')}")
            print(f"Message: {error.get('message')}")
            if error.get('missing_fields'):
                print(f"Missing Fields: {error.get('missing_fields')}")
            if error.get('example_queries'):
                print(f"Example Queries:")
                for example in error.get('example_queries'):
                    print(f"  - {example}")
        
        else:
            print(f"Unexpected response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the Flask app is running.")
    except Exception as e:
        print(f"Error: {str(e)}")

def main():
    """Run test cases for view operations"""
    print("Expense Tracker View Operations Test")
    print("Make sure the Flask app is running on localhost:5001")
    
    # Test cases
    test_cases = [
        "show all marketing team cost in this month",
        "expenses over 100 dollars",
        "ads expenses this year",
        "all expenses",
        "marketing team expenses last week",
        "food expenses under 50 dollars",
        "transport costs for engineering team",
        "expenses between 50 and 200 dollars",
        "sales team expenses today",
        "engineering team expenses last month",
        "expenses over 500 dollars this year",
        "show expenses",  # Too vague
        "what",  # Insufficient information
    ]
    
    for test_case in test_cases:
        test_view_operation(test_case)
        print("\n" + "-"*60)

if __name__ == "__main__":
    main() 