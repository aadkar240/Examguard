import requests
import json

data = {
    'subject': 'Physics',
    'topics': ['Mechanics', 'Thermodynamics'],
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

response = requests.post('http://localhost:8000/api/exams/generate', json=data, timeout=120)
print(f'Status: {response.status_code}')
result = response.json()

if 'questions' in result:
    questions = result.get('questions', [])
    print(f'Questions in response: {len(questions)}')
    
    if questions:
        # Count by type
        mcq_count = sum(1 for q in questions if q['question_type'] == 'MCQ')
        short_count = sum(1 for q in questions if q['question_type'] == 'Short Answer')
        long_count = sum(1 for q in questions if q['question_type'] == 'Long Answer')
        
        # Count marks
        mcq_marks = sum(q['marks'] for q in questions if q['question_type'] == 'MCQ')
        short_marks = sum(q['marks'] for q in questions if q['question_type'] == 'Short Answer')
        long_marks = sum(q['marks'] for q in questions if q['question_type'] == 'Long Answer')
        
        print(f'\nDistribution:')
        print(f'  MCQ: {mcq_count} questions, {mcq_marks} marks')
        print(f'  Short Answer: {short_count} questions, {short_marks} marks')
        print(f'  Long Answer: {long_count} questions, {long_marks} marks')
        print(f'\nTotal: {len(questions)} questions, {mcq_marks + short_marks + long_marks} marks')
        
        # Sample question
        print(f'\nSample MCQ Question:')
        mcq_q = next((q for q in questions if q['question_type'] == 'MCQ'), None)
        if mcq_q:
            print(json.dumps(mcq_q, indent=2)[:300])
else:
    print(f'No questions in response!')
    print(json.dumps(result, indent=2)[:500])
