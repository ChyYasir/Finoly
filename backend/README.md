# Finoly Backend

A Flask-based REST API backend for the Finoly application with LangChain and Groq AI integration.

## Features

- RESTful API endpoints
- CORS enabled for frontend integration
- Environment-based configuration
- Error handling
- Health check endpoint
- **NEW**: AI-powered prompt analysis using LangChain and Groq API
- **NEW**: Expense Tracker with intelligent prompt processing

## Setup

1. **Activate your virtual environment:**
   ```bash
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env file with your configuration
   # Make sure to add your GROQ_API_KEY
   ```

4. **Get a Groq API key:**
   - Visit [Groq Console](https://console.groq.com/)
   - Sign up and get your API key
   - Add it to your `.env` file as `GROQ_API_KEY=your-key-here`

## Running the Application

### Option 1: Using Flask CLI
```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run --port=5001
```

### Option 2: Direct execution
```bash
python app.py
```

The server will start on `http://localhost:5001`

## API Endpoints

- `GET /` - Home page with API information
- `GET /api/health` - Health check endpoint
- `GET /api/hello?name=YourName` - Hello endpoint with optional name parameter
- **`POST /api/analyze-prompt`** - Analyze prompts using AI
- **`POST /api/expense-tracker`** - Expense tracking with intelligent prompt processing

### Analyze Prompt Endpoint

**POST** `/api/analyze-prompt`

Analyzes a prompt using LangChain and Groq API to extract structured information.

**Request Body:**
```json
{
    "prompt": "Your prompt text here"
}
```

**Response:**
```json
{
    "status": "success",
    "original_prompt": "Your prompt text here",
    "analysis": {
        "prompt_type": "code generation",
        "intent": "create a function",
        "entities": ["Python", "factorial", "number"],
        "sentiment": "neutral",
        "complexity": "simple",
        "keywords": ["Python", "function", "factorial", "calculate"],
        "summary": "User wants to create a Python function for calculating factorial"
    }
}
```

### Expense Tracker Endpoint

**POST** `/api/expense-tracker`

Intelligently processes expense-related prompts to extract expense information or handle view requests.

**Request Body:**
```json
{
    "prompt": "I spent 50 dollars on food today"
}
```

## Complete Examples

### 1. Single Expense with Amount and Category

**Prompt:** `"I spent 50 dollars on food today"`

**Response (200 OK):**
```json
{
    "status": "success",
    "prompt_type": "addition",
    "original_prompt": "I spent 50 dollars on food today",
    "prompt_analysis": {
        "prompt_type": "addition",
        "confidence": "high",
        "reasoning": "User mentioned spending money on food"
    },
    "expenses": [
        {
            "amount": "50",
            "category": "food",
            "date": "15/01/25",
            "time": "2pm"
        }
    ]
}
```

### 2. Multiple Expenses in One Prompt

**Prompt:** `"I bought groceries for 80 dollars and spent 30 on transport"`

**Response (200 OK):**
```json
{
    "status": "success",
    "prompt_type": "addition",
    "original_prompt": "I bought groceries for 80 dollars and spent 30 on transport",
    "prompt_analysis": {
        "prompt_type": "addition",
        "confidence": "high",
        "reasoning": "User mentioned buying and spending money"
    },
    "expenses": [
        {
            "amount": "80",
            "category": "groceries",
            "date": "15/01/25",
            "time": "2pm"
        },
        {
            "amount": "30",
            "category": "transport",
            "date": "15/01/25",
            "time": "2pm"
        }
    ]
}
```

### 3. Expense with Specific Date and Time

**Prompt:** `"Yesterday at 2pm I spent 120 on shopping"`

**Response (200 OK):**
```json
{
    "status": "success",
    "prompt_type": "addition",
    "original_prompt": "Yesterday at 2pm I spent 120 on shopping",
    "prompt_analysis": {
        "prompt_type": "addition",
        "confidence": "high",
        "reasoning": "User mentioned spending money on shopping"
    },
    "expenses": [
        {
            "amount": "120",
            "category": "shopping",
            "date": "14/01/25",
            "time": "2pm"
        }
    ]
}
```

### 4. Complex Natural Language with Multiple Expenses

**Prompt:** `"I had a busy day - spent 45 on coffee and breakfast, 75 on lunch, and 200 on shopping"`

**Response (200 OK):**
```json
{
    "status": "success",
    "prompt_type": "addition",
    "original_prompt": "I had a busy day - spent 45 on coffee and breakfast, 75 on lunch, and 200 on shopping",
    "prompt_analysis": {
        "prompt_type": "addition",
        "confidence": "high",
        "reasoning": "User mentioned spending money multiple times"
    },
    "expenses": [
        {
            "amount": "45",
            "category": "food",
            "date": "15/01/25",
            "time": "2pm"
        },
        {
            "amount": "75",
            "category": "food",
            "date": "15/01/25",
            "time": "2pm"
        },
        {
            "amount": "200",
            "category": "shopping",
            "date": "15/01/25",
            "time": "2pm"
        }
    ]
}
```

### 5. Missing Amount Information

**Prompt:** `"I spent money on food"`

**Response (400 Bad Request):**
```json
{
    "error": "Missing required information",
    "message": "Please provide the amount you spent on food",
    "required_fields": ["amount"],
    "example_prompt": "Example: 'I spent 50 dollars on food today' or 'I bought groceries for 80 dollars yesterday at 2pm'",
    "original_prompt": "I spent money on food"
}
```

### 6. Missing Category Information

**Prompt:** `"I spent 100 dollars"`

**Response (400 Bad Request):**
```json
{
    "error": "Missing required information",
    "message": "Please provide what you spent the money on",
    "required_fields": ["category"],
    "example_prompt": "Example: 'I spent 50 dollars on food today' or 'I bought groceries for 80 dollars yesterday at 2pm'",
    "original_prompt": "I spent 100 dollars"
}
```

### 7. Missing Both Amount and Category

**Prompt:** `"I spent money"`

**Response (400 Bad Request):**
```json
{
    "error": "Missing required information",
    "message": "Please provide the amount and what you spent it on",
    "required_fields": ["amount", "category"],
    "example_prompt": "Example: 'I spent 50 dollars on food today' or 'I bought groceries for 80 dollars yesterday at 2pm'",
    "original_prompt": "I spent money"
}
```

### 8. View Request

**Prompt:** `"Show me my expenses for this month"`

**Response (200 OK):**
```json
{
    "status": "success",
    "prompt_type": "view",
    "original_prompt": "Show me my expenses for this month",
    "prompt_analysis": {
        "prompt_type": "view",
        "confidence": "high",
        "reasoning": "User wants to see/view expenses"
    },
    "message": "View functionality will be implemented in future updates"
}
```

### 9. Relative Date Handling

**Prompt:** `"I spent 50 on food today"`

**Response (200 OK):**
```json
{
    "status": "success",
    "prompt_type": "addition",
    "original_prompt": "I spent 50 on food today",
    "prompt_analysis": {
        "prompt_type": "addition",
        "confidence": "high",
        "reasoning": "User mentioned spending money on food"
    },
    "expenses": [
        {
            "amount": "50",
            "category": "food",
            "date": "15/01/25",
            "time": "2pm"
        }
    ]
}
```

**Note:** The LLM returns `null` for relative dates like "today", "yesterday", "tomorrow", and the code converts them to actual dates.

### 10. Unclear or Invalid Prompt

**Prompt:** `"Hello, how are you?"`

**Response (400 Bad Request):**
```json
{
    "error": "Missing required information",
    "message": "Could not extract valid expense information. Please provide amount and category.",
    "required_fields": ["amount", "category"],
    "example_prompt": "Example: 'I spent 50 dollars on food today' or 'I bought groceries for 80 dollars yesterday at 2pm'",
    "original_prompt": "Hello, how are you?"
}
```

## Expense Tracker Features

### Prompt Type Detection
- **Addition**: Detects when user wants to add/record new expenses
- **View**: Detects when user wants to see existing expenses
- Uses AI-powered analysis with fallback keyword matching

### Expense Extraction
- Extracts multiple expenses from a single prompt
- Handles various formats: "I spent X on Y", "bought X for Y", etc.
- Automatically converts relative dates ("today", "yesterday", "tomorrow") to actual dates
- Validates required fields (amount and category)
- Returns structured expense data

### Date and Time Handling
- **Relative Dates**: "today", "yesterday", "tomorrow" → converted to actual dates
- **Null Dates**: Automatically uses current date
- **Null Times**: Automatically uses current time
- **Specific Dates**: Used as provided

### Error Handling
- **400 Bad Request**: For missing amount or category information
- Clear error messages with specific missing fields
- Helpful example prompts for guidance
- Graceful handling of unclear prompts

## Testing

Run the example usage script:
```bash
python example_usage.py
```

## Project Structure

```
backend/
├── app.py                    # Main Flask application
├── expense_processor.py      # Expense processing logic
├── requirements.txt          # Python dependencies
├── env.example              # Environment variables template
├── example_usage.py         # Example usage script
├── README.md                # This file
└── venv/                    # Virtual environment
```

## Development

- The application runs in debug mode by default
- CORS is enabled for all routes
- Error handlers are set up for 404 and 500 errors
- Uses Groq's deepseek-r1-distill-llama-70b model for prompt analysis
- Modular design with separate expense processing logic

## Environment Variables

- `FLASK_APP` - Flask application file
- `FLASK_ENV` - Environment (development/production)
- `DEBUG` - Debug mode (True/False)
- `SECRET_KEY` - Secret key for sessions
- `PORT` - Server port (default: 5001)
- `HOST` - Server host (default: 0.0.0.0)
- `GROQ_API_KEY` - Your Groq API key (required for prompt analysis) 