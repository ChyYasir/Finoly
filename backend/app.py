from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage
import json
from expense_processor import ExpenseProcessor

import dotenv
dotenv.load_dotenv()


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Groq client
groq_client = ChatGroq(
    model="deepseek-r1-distill-llama-70b" # Provide empty string as default
)

# Initialize Expense Processor
expense_processor = ExpenseProcessor(groq_client)

@app.route('/')
def home():
    """Home route"""
    return jsonify({
        'message': 'Welcome to Finoly Backend API',
        'status': 'success',
        'version': '1.0.0'
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Server is running'
    })

@app.route('/api/hello')
def hello():
    """Simple hello endpoint"""
    name = request.args.get('name', 'World')
    return jsonify({
        'message': f'Hello, {name}!',
        'status': 'success'
    })


    """Analyze a prompt using LangChain and Groq API"""
    try:
        # Check if Groq API key is configured
        if not groq_client:
            return jsonify({
                'error': 'Groq API key not configured',
                'message': 'Please set GROQ_API_KEY environment variable'
            }), 500

        # Get the prompt from request
        data = request.get_json()
        if not data or 'prompt' not in data:
            return jsonify({
                'error': 'Missing prompt',
                'message': 'Please provide a prompt in the request body'
            }), 400

        prompt = data['prompt']
        
        # Create the analysis prompt
        analysis_prompt = f"""
        Analyze the following prompt and return a JSON response with the following structure:
        {{
            "prompt_type": "string describing the type of prompt",
            "intent": "string describing the user's intent",
            "entities": ["list of key entities mentioned"],
            "sentiment": "positive/negative/neutral",
            "complexity": "simple/moderate/complex",
            "keywords": ["list of important keywords"],
            "summary": "brief summary of what the prompt is asking for"
        }}

        Prompt to analyze: {prompt}

        Return only the JSON response, no additional text.
        """

        # Get response from Groq
        messages = [HumanMessage(content=analysis_prompt)]
        response = groq_client.invoke(messages)
        
        # Try to parse the response as JSON
        try:
            # Extract the content and clean it
            content = response.content
            # Remove any markdown formatting if present
            if isinstance(content, str) and content.startswith('```json'):
                content = content[7:]
            if isinstance(content, str) and content.endswith('```'):
                content = content[:-3]
            
            # Handle both string and list responses from the LLM
            if isinstance(content, list):
                # If it's a list, take the first item that looks like JSON
                for item in content:
                    if isinstance(item, dict):
                        analysis_result = item
                        break
                    elif isinstance(item, str):
                        try:
                            analysis_result = json.loads(item)
                            break
                        except json.JSONDecodeError:
                            continue
                else:
                    raise json.JSONDecodeError("No valid JSON found in list response", "", 0)
            else:
                analysis_result = json.loads(content)
            
            return jsonify({
                'status': 'success',
                'original_prompt': prompt,
                'analysis': analysis_result
            })
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return the raw response
            return jsonify({
                'status': 'success',
                'original_prompt': prompt,
                'raw_response': response.content,
                'note': 'Could not parse as JSON, returning raw response'
            })

    except Exception as e:
        return jsonify({
            'error': 'Analysis failed',
            'message': str(e)
        }), 500

@app.route('/api/expense-tracker', methods=['POST'])
def expense_tracker():
    """Main endpoint for expense tracking functionality"""
    try:
        # Check if Groq API key is configured
        if not groq_client:
            return jsonify({
                'error': 'Groq API key not configured',
                'message': 'Please set GROQ_API_KEY environment variable'
            }), 500

        # Get the prompt from request
        data = request.get_json()
        if not data or 'prompt' not in data:
            return jsonify({
                'error': 'Missing prompt',
                'message': 'Please provide a prompt in the request body'
            }), 400

        prompt = data['prompt']
        
        # First, analyze the prompt type
        prompt_analysis = expense_processor.analyze_prompt_type(prompt)
        
        # If it's an addition type, extract expenses
        if prompt_analysis.get('prompt_type') == 'addition':
            expenses_result = expense_processor.extract_expenses(prompt)
            
            # Check if there's missing information
            if isinstance(expenses_result, dict) and expenses_result.get('missing_info'):
                return jsonify({
                    'error': 'Missing required information',
                    'message': expenses_result.get('message'),
                    'required_fields': expenses_result.get('required_fields'),
                    'example_prompt': expenses_result.get('example_prompt'),
                    'original_prompt': prompt
                }), 400
            
            return jsonify({
                'status': 'success',
                'prompt_type': 'addition',
                'original_prompt': prompt,
                'prompt_analysis': prompt_analysis,
                'expenses': expenses_result
            })
        
        # If it's a view type, return appropriate response
        elif prompt_analysis.get('prompt_type') == 'view':
            return jsonify({
                'status': 'success',
                'prompt_type': 'view',
                'original_prompt': prompt,
                'prompt_analysis': prompt_analysis,
                'message': 'View functionality will be implemented in future updates'
            })
        
        # If prompt type is unclear
        else:
            return jsonify({
                'status': 'unclear',
                'original_prompt': prompt,
                'prompt_analysis': prompt_analysis,
                'message': 'Could not determine if this is an addition or view request'
            })

    except Exception as e:
        return jsonify({
            'error': 'Expense tracking failed',
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'Something went wrong on our end'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 