import requests
import json
import time

# Wait for server to reload
time.sleep(3)

data = {
    'subject': 'Biology',
    'topics': ['Cell Biology', 'Genetics', 'Evolution', 'Ecology'],
    'total_marks': 100,
    'exam_type': 'Internal',
    'duration': 120,
    'difficulty_distribution': {
        'easy': 30,
        'medium': 50,
        'hard': 20
    },
    'marks_structure': {
        'mcq': 30,
        'short': 40,
        'long': 30
    }
}

try:
    response = requests.post('http://localhost:8000/api/exams/generate', json=data, timeout=60)
    print(f'Status: {response.status_code}')
    result = response.json()
    print(f'Response keys: {list(result.keys())}')
    print(f'Number of questions returned: {len(result.get("questions", []))}')
    if result.get('questions'):
        print(f'\nFirst question:')
        print(json.dumps(result['questions'][0], indent=2))
    else:
        print('\nNo questions in response!')
        print(json.dumps(result, indent=2))
except Exception as e:
    print(f'Error: {e}')
