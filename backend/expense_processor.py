from langchain_groq import ChatGroq
from langchain.schema import HumanMessage
import json
from datetime import datetime, timedelta
import re

class ExpenseProcessor:
    def __init__(self, groq_client):
        self.groq_client = groq_client
    
    def analyze_prompt_type(self, prompt):
        """Analyze if the prompt is for adding expenses or viewing expenses"""
        analysis_prompt = f"""
        Analyze the following prompt and determine if it's for adding expenses or viewing expenses.
        
        Return a JSON response with this structure:
        {{
            "prompt_type": "addition" or "view",
            "confidence": "high/medium/low",
            "reasoning": "brief explanation of why this classification"
        }}
        
        Prompt: {prompt}
        
        Rules:
        - "addition" if user wants to add/record/log/track new expenses
        - "view" if user wants to see/view/list/check existing expenses
        - Look for keywords like: add, spent, bought, purchased, paid, expense, cost (for addition)
        - Look for keywords like: show, view, see, list, check, history, summary (for view)
        
        Return only the JSON response, no additional text.
        """
        
        messages = [HumanMessage(content=analysis_prompt)]
        response = self.groq_client.invoke(messages)
        
        try:
            content = self._clean_response(response.content)
            result = json.loads(content)
            return result
        except json.JSONDecodeError:
            # Fallback logic if JSON parsing fails
            prompt_lower = prompt.lower()
            addition_keywords = ['add', 'spent', 'bought', 'purchased', 'paid', 'expense', 'cost', 'spend']
            view_keywords = ['show', 'view', 'see', 'list', 'check', 'history', 'summary', 'how much']
            
            addition_count = sum(1 for keyword in addition_keywords if keyword in prompt_lower)
            view_count = sum(1 for keyword in view_keywords if keyword in prompt_lower)
            
            if addition_count > view_count:
                return {"prompt_type": "addition", "confidence": "medium", "reasoning": "fallback classification"}
            else:
                return {"prompt_type": "view", "confidence": "medium", "reasoning": "fallback classification"}
    
    def generate_view_query(self, prompt):
        """Generate Drizzle ORM query for viewing expenses based on user prompt"""
        # First, extract filtering criteria using AI
        extraction_prompt = f"""
        Extract filtering criteria from the user's request for viewing expenses.
        
        User Request: {prompt}
        
        Rules:
        1. Extract the following criteria:
           - Team name (e.g., "marketing", "sales", "engineering")
           - Time period (e.g., "this month", "last week", "2024", "today", "yesterday")
           - Category (e.g., "ads", "food", "transport")
           - Amount range (e.g., "over 100", "less than 50", "between 50 and 100")
        
        2. Return JSON response with this structure:
        {{
            "team": "team name if specified, null otherwise",
            "time_period": "time period if specified, null otherwise",
            "category": "category if specified, null otherwise",
            "amount_range": {{
                "operator": "gt/lt/gte/lte/between",
                "value": "numeric value or array for between",
                "text": "original text like 'over 100'"
            }} if specified, null otherwise
        }}
        
        Examples:
        - "show all marketing team cost in this month" → {{"team": "marketing", "time_period": "this month", "category": null, "amount_range": null}}
        - "expenses over 100 dollars" → {{"team": null, "time_period": null, "category": null, "amount_range": {{"operator": "gt", "value": 100, "text": "over 100"}}}}
        - "ads expenses this year" → {{"team": null, "time_period": "this year", "category": "ads", "amount_range": null}}
        
        Return only the JSON response, no additional text.
        """
        
        messages = [HumanMessage(content=extraction_prompt)]
        response = self.groq_client.invoke(messages)
        
        try:
            content = self._clean_response(response.content)
            filters = json.loads(content)
            
            # Check if we have any meaningful filters
            has_filters = any([
                filters.get("team"),
                filters.get("time_period"),
                filters.get("category"),
                filters.get("amount_range")
            ])
            
            if not has_filters:
                return {
                    "insufficient_info": True,
                    "missing_fields": ["team", "time_period", "category", "amount_range"],
                    "message": "Could not extract meaningful filtering criteria from the request",
                    "example_queries": [
                        "show all marketing team cost in this month",
                        "expenses over 100 dollars",
                        "ads expenses this year",
                        "all expenses"
                    ]
                }
            
            # Now generate the query with calculated values
            query_code = self._build_drizzle_query(filters)
            
            return {
                "query_code": query_code,
                "filters": filters,
                "explanation": self._generate_explanation(filters)
            }
            
        except json.JSONDecodeError as e:
            return {
                "insufficient_info": True,
                "missing_fields": ["valid_response"],
                "message": "Could not parse the filter extraction response",
                "example_queries": [
                    "show all marketing team cost in this month",
                    "expenses over 100 dollars",
                    "ads expenses this year",
                    "all expenses"
                ]
            }
    
    def extract_expenses(self, prompt):
        """Extract expense information from the prompt"""
        extraction_prompt = f"""
        Extract expense information from the following prompt. A user can add multiple expenses in one prompt.
        
        Current prompt: {prompt}
        
        Rules:
        1. Extract ALL expenses mentioned in the prompt
        2. Each expense must have:
           - amount: numeric value (extract as string)
           - category: what was spent on (food, transport, etc.)
        3. If date/time not explicitly mentioned, use current date/time
        4. Handle multiple expenses in one prompt
        5. If information is missing, note what's needed
        
        Return JSON array of expenses with this structure:
        [
            {{
                "amount": "string (e.g., '80', '90')",
                "category": "string (e.g., 'food', 'transport')",
                "date": "string (e.g., '11/07/22') or null if not specified or relative (today/yesterday/tomorrow)",
                "time": "string (e.g., '10am') or null if not specified"
            }}
        ]
        
        date format: dd/mm/yy
        time format: hh:mm am/pm
        Important: For dates, only return actual dates (like '11/07/22', '2024-01-15, '12 june 2025 '). 
        If user says 'today', 'yesterday', 'tomorrow', or any relative date, return null for date.
        
        If amount or category is missing or unclear, return:
        {{
            "missing_info": true,
            "required_fields": ["list of missing fields"],
            "message": "What information is needed from user",
            "example_prompt": "Example: 'I spent 50 dollars on food today' or 'I bought groceries for 80 dollars yesterday at 2pm'"
        }}
        
        Return only the JSON response, no additional text.
        """
        
        messages = [HumanMessage(content=extraction_prompt)]
        response = self.groq_client.invoke(messages)
        
        try:
            content = self._clean_response(response.content)
            result = json.loads(content)
            
            # If it's a missing info response, return as is
            if isinstance(result, dict) and result.get("missing_info"):
                return result
            
            # If it's an array of expenses, validate and format
            if isinstance(result, list):
                formatted_expenses = []
                for expense in result:
                    formatted_expense = self._format_expense(expense)
                    if formatted_expense:
                        formatted_expenses.append(formatted_expense)
                
                # Check if we have any valid expenses
                if not formatted_expenses:
                    return {
                        "missing_info": True,
                        "required_fields": ["amount", "category"],
                        "message": "Could not extract valid expense information. Please provide amount and category.",
                        "example_prompt": "Example: 'I spent 50 dollars on food today' or 'I bought groceries for 80 dollars yesterday at 2pm'"
                    }
                
                return formatted_expenses
            
            return result
            
        except json.JSONDecodeError as e:
            return {
                "error": "Failed to parse expense data",
                "raw_response": response.content,
                "message": "Could not extract expense information from the prompt"
            }
    
    def _format_expense(self, expense):
        """Format and validate a single expense"""
        try:
            # Ensure required fields
            if not expense.get("amount") or not expense.get("category"):
                return None
            
            # Format amount (remove currency symbols, keep only numbers and decimal)
            amount = str(expense.get("amount", ""))
            amount = re.sub(r'[^\d.]', '', amount)
            
            # Check if amount is valid after cleaning
            if not amount or amount == "0":
                return None
            
            # Format date - handle relative dates and null values
            date = expense.get("date")
            if not date or date is None or date == "null":
                # Use current date for null/empty values
                date = datetime.now().strftime("%d/%m/%y")
            else:
                # Check if it's a relative date and convert to actual date
                date_lower = str(date).lower()
                if date_lower in ['today', 'now']:
                    date = datetime.now().strftime("%d/%m/%y")
                elif date_lower == 'yesterday':
                    yesterday = datetime.now() - timedelta(days=1)
                    date = yesterday.strftime("%d/%m/%y")
                elif date_lower == 'tomorrow':
                    tomorrow = datetime.now() + timedelta(days=1)
                    date = tomorrow.strftime("%d/%m/%y")
                else:
                    # If it's already a proper date, use it as is
                    date = str(date)
            
            # Format time - use current time if null or empty
            time = expense.get("time")
            if not time or time is None or time == "null":
                time = datetime.now().strftime("%I%p").lower()
            
            return {
                "amount": amount,
                "category": str(expense.get("category", "")).lower(),
                "date": str(date),
                "time": str(time)
            }
        except Exception:
            return None
    
    def _clean_response(self, content):
        """Clean the response content for JSON parsing"""
        if isinstance(content, str):
            # Remove <think> tags and content
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            
            # Remove markdown formatting
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            
            # Remove any leading/trailing whitespace and newlines
            content = content.strip()
            
            # Try to find JSON array or object in the content
            # Look for the first [ or { and find its matching closing bracket/brace
            json_start = None
            if '[' in content:
                json_start = content.find('[')
            elif '{' in content:
                json_start = content.find('{')
            
            if json_start is not None:
                # Extract from the JSON start to the end
                content = content[json_start:]
                
                # Find the matching closing bracket/brace
                bracket_count = 0
                brace_count = 0
                in_string = False
                escape_next = False
                
                for i, char in enumerate(content):
                    if escape_next:
                        escape_next = False
                        continue
                    
                    if char == '\\':
                        escape_next = True
                        continue
                    
                    if char == '"' and not escape_next:
                        in_string = not in_string
                        continue
                    
                    if not in_string:
                        if char == '[':
                            bracket_count += 1
                        elif char == ']':
                            bracket_count -= 1
                        elif char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                        
                        # If we've closed all brackets/braces, we have our JSON
                        if bracket_count == 0 and brace_count == 0:
                            content = content[:i+1]
                            break
        
        # Handle list responses
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    return json.dumps(item)
                elif isinstance(item, str):
                    try:
                        return item
                    except:
                        continue
            raise json.JSONDecodeError("No valid content found", "", 0)
        
        return content
    
    def _build_drizzle_query(self, filters):
        """Build Drizzle ORM query with calculated values"""
        from datetime import datetime, timedelta
        import calendar
        
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
            start_date, end_date = self._calculate_date_range(time_period)
            
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
    
    def _calculate_date_range(self, time_period):
        """Calculate actual date range based on time period"""
        from datetime import datetime, timedelta
        import calendar
        
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
    
    def _generate_explanation(self, filters):
        """Generate explanation of what the query does"""
        explanations = []
        
        if filters.get("team"):
            explanations.append(f"filters by team '{filters['team']}'")
        
        if filters.get("time_period"):
            explanations.append(f"filters by time period '{filters['time_period']}'")
        
        if filters.get("category"):
            explanations.append(f"filters by category '{filters['category']}'")
        
        if filters.get("amount_range"):
            amount_range = filters["amount_range"]
            explanations.append(f"filters by amount {amount_range.get('text', 'range')}")
        
        if not explanations:
            return "Query returns all expenses"
        
        return f"Query {' and '.join(explanations)}" 