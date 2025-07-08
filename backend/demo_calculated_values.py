#!/usr/bin/env python3
"""
Demonstration of Calculated Values in Drizzle ORM Queries
This script shows how the system calculates actual date ranges and values
instead of using placeholders.
"""

from datetime import datetime, timedelta
import calendar

def calculate_date_range(time_period):
    """Calculate actual date range based on time period"""
    now = datetime.now()
    
    if time_period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    elif time_period == "yesterday":
        yesterday = now - timedelta(days=1)
        start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    elif time_period == "this week":
        # Start of week (Monday)
        days_since_monday = now.weekday()
        start_date = now - timedelta(days=days_since_monday)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    
    elif time_period == "last week":
        # Previous week
        days_since_monday = now.weekday()
        start_of_this_week = now - timedelta(days=days_since_monday)
        start_date = start_of_this_week - timedelta(days=7)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    
    elif time_period == "this month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_day = calendar.monthrange(now.year, now.month)[1]
        end_date = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
    
    elif time_period == "last month":
        if now.month == 1:
            last_month = now.replace(year=now.year-1, month=12, day=1)
        else:
            last_month = now.replace(month=now.month-1, day=1)
        
        start_date = last_month.replace(hour=0, minute=0, second=0, microsecond=0)
        last_day = calendar.monthrange(last_month.year, last_month.month)[1]
        end_date = last_month.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
    
    elif time_period == "this year":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
    
    elif time_period == "last year":
        start_date = now.replace(year=now.year-1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(year=now.year-1, month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
    
    else:
        # Try to parse as a specific year
        try:
            year = int(time_period)
            start_date = datetime(year, 1, 1, 0, 0, 0, 0)
            end_date = datetime(year, 12, 31, 23, 59, 59, 999999)
        except ValueError:
            return None, None
    
    # Format dates for JavaScript Date constructor
    start_str = start_date.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    end_str = end_date.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    
    return start_str, end_str

def build_drizzle_query(filters):
    """Build Drizzle ORM query with calculated values"""
    # Start with base query
    query_parts = ["db.select().from(expense)"]
    
    # Add JOIN if team filter is specified
    if filters.get("team"):
        query_parts.append(".innerJoin(team, eq(expense.teamId, team.teamId))")
    
    # Build WHERE conditions
    where_conditions = []
    
    # Team filter
    if filters.get("team"):
        team_name = filters["team"]
        where_conditions.append(f"eq(team.name, '{team_name}')")
    
    # Category filter
    if filters.get("category"):
        category = filters["category"]
        where_conditions.append(f"eq(expense.category, '{category}')")
    
    # Amount range filter
    if filters.get("amount_range"):
        amount_range = filters["amount_range"]
        operator = amount_range.get("operator")
        value = amount_range.get("value")
        
        if operator == "gt":
            where_conditions.append(f"gt(expense.amount, {value})")
        elif operator == "lt":
            where_conditions.append(f"lt(expense.amount, {value})")
        elif operator == "gte":
            where_conditions.append(f"gte(expense.amount, {value})")
        elif operator == "lte":
            where_conditions.append(f"lte(expense.amount, {value})")
        elif operator == "between" and isinstance(value, list) and len(value) == 2:
            where_conditions.append(f"between(expense.amount, {value[0]}, {value[1]})")
    
    # Time period filter
    if filters.get("time_period"):
        time_period = filters["time_period"]
        start_date, end_date = calculate_date_range(time_period)
        
        if start_date and end_date:
            where_conditions.append(f"between(expense.date, new Date('{start_date}'), new Date('{end_date}'))")
    
    # Add WHERE clause if we have conditions
    if where_conditions:
        if len(where_conditions) == 1:
            query_parts.append(f".where({where_conditions[0]})")
        else:
            conditions_str = ", ".join(where_conditions)
            query_parts.append(f".where(and({conditions_str}))")
    
    # Add semicolon
    query_parts.append(";")
    
    return "".join(query_parts)

def main():
    """Demonstrate calculated values in queries"""
    print("Calculated Values in Drizzle ORM Queries")
    print("=" * 60)
    print(f"Current Date/Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Example filters
    examples = [
        {
            "name": "Marketing Team This Month",
            "filters": {
                "team": "marketing",
                "time_period": "this month",
                "category": None,
                "amount_range": None
            }
        },
        {
            "name": "Expenses Over 100 Dollars",
            "filters": {
                "team": None,
                "time_period": None,
                "category": None,
                "amount_range": {
                    "operator": "gt",
                    "value": 100,
                    "text": "over 100"
                }
            }
        },
        {
            "name": "Sales Team Today",
            "filters": {
                "team": "sales",
                "time_period": "today",
                "category": None,
                "amount_range": None
            }
        },
        {
            "name": "Food Expenses Between 50 and 200",
            "filters": {
                "team": None,
                "time_period": None,
                "category": "food",
                "amount_range": {
                    "operator": "between",
                    "value": [50, 200],
                    "text": "between 50 and 200"
                }
            }
        },
        {
            "name": "Engineering Team Last Week",
            "filters": {
                "team": "engineering",
                "time_period": "last week",
                "category": None,
                "amount_range": None
            }
        }
    ]
    
    for example in examples:
        print(f"Example: {example['name']}")
        print("-" * 40)
        
        # Show calculated date ranges if applicable
        if example['filters'].get('time_period'):
            start_date, end_date = calculate_date_range(example['filters']['time_period'])
            print(f"Time Period: {example['filters']['time_period']}")
            print(f"Calculated Start: {start_date}")
            print(f"Calculated End: {end_date}")
            print()
        
        # Show the generated query
        query = build_drizzle_query(example['filters'])
        print("Generated Drizzle ORM Query:")
        print(query)
        print()
        print("=" * 60)
        print()

if __name__ == "__main__":
    main() 