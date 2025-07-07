#!/usr/bin/env python3
"""
Example usage of the Finoly Expense Tracker API

This script demonstrates how to use the expense tracker endpoint
with various types of prompts and message history.
"""

import requests
import json
from datetime import datetime

def call_expense_tracker(prompt):
    """Call the expense tracker API"""
    url = "http://localhost:5001/api/expense-tracker"
    payload = {
        "prompt": prompt
    }
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400:
            return response.json()  # Return the error details
        else:
            return {"error": response.text}
    except Exception as e:
        return {"error": str(e)}

def print_result(title, result):
    """Pretty print the API result"""
    print(f"\n{'='*60}")
    print(f"📝 {title}")
    print(f"{'='*60}")
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        if "message" in result:
            print(f"📝 Message: {result['message']}")
        if "required_fields" in result:
            print(f"🔍 Required Fields: {', '.join(result['required_fields'])}")
        if "example_prompt" in result:
            print(f"💡 Example: {result['example_prompt']}")
        return
    
    print(f"✅ Status: {result.get('status')}")
    print(f"🎯 Prompt Type: {result.get('prompt_type')}")
    print(f"💬 Original Prompt: {result.get('original_prompt')}")
    
    # Print prompt analysis
    if result.get('prompt_analysis'):
        analysis = result['prompt_analysis']
        print(f"\n🔍 Analysis:")
        print(f"   Type: {analysis.get('prompt_type')}")
        print(f"   Confidence: {analysis.get('confidence')}")
        print(f"   Reasoning: {analysis.get('reasoning')}")
    
    # Print expenses or message
    if result.get('prompt_type') == 'addition':
        expenses = result.get('expenses', [])
        if isinstance(expenses, list) and expenses:
            print(f"\n💰 Extracted Expenses:")
            for i, expense in enumerate(expenses, 1):
                print(f"   {i}. 💵 ${expense.get('amount')} | 🏷️ {expense.get('category')} | 📅 {expense.get('date')} | 🕐 {expense.get('time')}")
        elif isinstance(expenses, dict) and expenses.get('missing_info'):
            print(f"\n❓ Missing Information:")
            print(f"   Message: {expenses.get('message')}")
            print(f"   Required: {', '.join(expenses.get('required_fields', []))}")
        else:
            print(f"\n📊 Result: {expenses}")
    else:
        print(f"\n📋 Message: {result.get('message')}")

def main():
    """Main function to demonstrate the API"""
    print("🚀 Finoly Expense Tracker API Examples")
    print("Make sure the Flask server is running on localhost:5001")
    
    # Example 1: Simple single expense
    result1 = call_expense_tracker("I spent 50 dollars on food today")
    print_result("Single Expense", result1)
    
    # Example 2: Multiple expenses
    result2 = call_expense_tracker("I bought groceries for 80 dollars and spent 30 on transport")
    print_result("Multiple Expenses", result2)
    
    # Example 3: Expense with date and time
    result3 = call_expense_tracker("Yesterday at 2pm I spent 120 on shopping")
    print_result("Expense with Date/Time", result3)
    
    # Example 4: Missing information
    result4 = call_expense_tracker("I spent money on food")
    print_result("Missing Information", result4)
    
    # # Example 5: View request
    # result5 = call_expense_tracker("Show me my expenses for this month")
    # print_result("View Request", result5)
    
    # # Example 6: Complex expense
    # result6 = call_expense_tracker("I went to the mall and bought clothes for 150, then had lunch for 25")
    # print_result("Complex Expense", result6)
    
    # # Example 7: Complex natural language
    # result7 = call_expense_tracker("I had a busy day - spent 45 on coffee and breakfast, 75 on lunch, and 200 on shopping")
    # print_result("Complex Natural Language", result7)
    
    print(f"\n{'='*60}")
    print("🎉 All examples completed!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main() 