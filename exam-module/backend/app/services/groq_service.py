import json
import time
from typing import List, Dict, Optional
from groq import Groq
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.schemas.exam import (
    AIGenerationRequest,
    QuestionTypeEnum,
    DifficultyLevelEnum,
)
from app.models.exam import AIGenerationLog

settings = get_settings()


class GroqService:
    """Service for generating exam questions using Groq AI"""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.1-8b-instant"  # Recommended replacement for deprecated Mixtral and llama-3.1-70b-versatile

    def create_generation_prompt(self, request: AIGenerationRequest) -> str:
        """Create detailed prompt for AI exam generation"""
        
        topics_str = ", ".join(request.topics)

        # Calculate number of questions for each type
        mcq_marks_per_q = 1
        short_marks_per_q = 5
        long_marks_per_q = 10
        
        mcq_count = request.marks_structure.mcq // mcq_marks_per_q
        short_answer_count = request.marks_structure.short // short_marks_per_q
        long_answer_count = request.marks_structure.long // long_marks_per_q
        total_questions = mcq_count + short_answer_count + long_answer_count

        prompt = f"""Generate an exam paper with these exact specifications:

Subject: {request.subject}
Topics: {topics_str}
Total Marks: {request.total_marks}
Duration: {request.duration} min

EXACT QUESTION COUNTS:
- MCQ: {mcq_count} questions × 1 mark = {request.marks_structure.mcq} marks (MUST have EXACTLY 4 options each)
- Short Answer: {short_answer_count} questions × 5 marks = {request.marks_structure.short} marks  
- Long Answer: {long_answer_count} questions × 10 marks = {request.marks_structure.long} marks
Total: {total_questions} questions, {request.total_marks} marks

DIFFICULTY: {request.difficulty_distribution.easy}% Easy, {request.difficulty_distribution.medium}% Medium, {request.difficulty_distribution.hard}% Hard

IMPORTANT MCQ RULES:
- Each MCQ MUST have EXACTLY 4 options (not 2, not 3, exactly 4)
- Options should be distinct and plausible
- Only one correct answer
- Format: "Option text" (no A., B., C., D. prefixes)

Return ONLY this JSON (NO other text):
{{
  "exam_title": "{request.subject} Exam",
  "questions": [
    {{"question_number":1,"question_text":"What is the time complexity of binary search?","question_type":"MCQ","marks":1,"difficulty_level":"Easy","options":["O(n)","O(log n)","O(n log n)","O(1)"],"correct_answer":"O(log n)","explanation":"Binary search divides the search space in half each time"}}
  ]
}}

Constraints:
- Exactly {total_questions} questions total
- Exactly {mcq_count} MCQ with 1 mark each (EACH WITH EXACTLY 4 OPTIONS)
- Exactly {short_answer_count} Short Answer with 5 marks each
- Exactly {long_answer_count} Long Answer with 10 marks each
- Return ONLY valid JSON, no markdown, no explanation"""

        return prompt

    async def generate_exam_questions(
        self,
        request: AIGenerationRequest,
        db: Session,
        exam_id: Optional[int] = None
    ) -> Dict:
        """Generate exam questions using Groq AI"""
        
        start_time = time.time()
        prompt = self.create_generation_prompt(request)
        
        # Log the generation attempt
        log = AIGenerationLog(
            exam_id=exam_id,
            prompt_text=prompt,
            model_used=self.model,
            status="In Progress"
        )
        db.add(log)
        db.commit()
        
        try:
            # Call Groq API
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert exam generator. Return ONLY valid JSON as instructed, no other text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.model,
                temperature=0.8,
                max_tokens=10000,
                top_p=0.9,
            )
            
            # Extract response
            response_text = chat_completion.choices[0].message.content
            
            # Clean response (remove markdown code blocks if present)
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Try to fix incomplete JSON if it was cut off
            try:
                generated_data = json.loads(response_text)
            except json.JSONDecodeError as e:
                # Try to fix incomplete JSON by finding the last complete object
                # and closing the array properly
                if response_text.count('{') > response_text.count('}'):
                    # JSON appears incomplete, try to close it
                    response_text = response_text.rstrip(',')
                    # Find last complete object
                    last_bracket = response_text.rfind('}')
                    if last_bracket != -1:
                        response_text = response_text[:last_bracket + 1]
                        # Add closing bracket for questions array and root object
                        response_text += ']}' 
                        try:
                            generated_data = json.loads(response_text)
                        except:
                            raise e  # If still invalid, raise original error
                    else:
                        raise e
                else:
                    raise e
            
            # Calculate generation time
            generation_time = time.time() - start_time
            
            # Update log with success
            log.ai_response = generated_data
            log.tokens_used = chat_completion.usage.total_tokens
            log.generation_time = generation_time
            log.status = "Completed"
            db.commit()
            
            # Validate and normalize questions
            questions = self._validate_and_normalize_questions(
                generated_data.get("questions", []),
                request
            )
            
            return {
                "success": True,
                "exam_title": generated_data.get("exam_title", f"{request.subject} Examination"),
                "questions": questions,
                "generation_time": generation_time,
                "tokens_used": chat_completion.usage.total_tokens,
                "log_id": log.id
            }
            
        except json.JSONDecodeError as e:
            # Update log with failure
            log.status = "Failed"
            log.generation_time = time.time() - start_time
            db.commit()
            
            return {
                "success": False,
                "error": f"JSON parsing error: {str(e)}",
                "raw_response": response_text[:500] if 'response_text' in locals() else None
            }
            
        except Exception as e:
            # Update log with failure
            log.status = "Failed"
            log.generation_time = time.time() - start_time
            db.commit()
            
            return {
                "success": False,
                "error": f"Generation error: {str(e)}"
            }

    def _validate_and_normalize_questions(
        self,
        questions: List[Dict],
        request: AIGenerationRequest
    ) -> List[Dict]:
        """Validate and normalize generated questions"""
        
        normalized_questions = []
        current_marks = {"mcq": 0, "short": 0, "long": 0}
        
        for q in questions:
            # Normalize question type
            q_type = q.get("question_type", "")
            if "MCQ" in q_type or "Multiple" in q_type:
                normalized_type = QuestionTypeEnum.MCQ
                marks_key = "mcq"
            elif "Short" in q_type:
                normalized_type = QuestionTypeEnum.SHORT
                marks_key = "short"
            else:
                normalized_type = QuestionTypeEnum.LONG
                marks_key = "long"
            
            # Normalize difficulty
            difficulty = q.get("difficulty_level", "Medium")
            if "Easy" in difficulty or "easy" in difficulty:
                normalized_difficulty = DifficultyLevelEnum.EASY
            elif "Hard" in difficulty or "hard" in difficulty:
                normalized_difficulty = DifficultyLevelEnum.HARD
            else:
                normalized_difficulty = DifficultyLevelEnum.MEDIUM
            
            # Track marks
            marks = q.get("marks", 1)
            current_marks[marks_key] += marks
            
            # Validate and fix MCQ options (ensure exactly 4 options)
            options = q.get("options")
            if normalized_type == QuestionTypeEnum.MCQ:
                if not options or len(options) < 4:
                    # If less than 4 options, add generic ones
                    if not options:
                        options = ["Option 1", "Option 2", "Option 3", "Option 4"]
                    else:
                        while len(options) < 4:
                            options.append(f"Option {len(options) + 1}")
                elif len(options) > 4:
                    # If more than 4, keep only first 4
                    options = options[:4]
            
            # Build normalized question
            normalized_q = {
                "question_number": q.get("question_number", len(normalized_questions) + 1),
                "question_text": q.get("question_text", ""),
                "question_type": normalized_type,
                "marks": marks,
                "difficulty_level": normalized_difficulty,
                "options": options if normalized_type == QuestionTypeEnum.MCQ else None,
                "correct_answer": q.get("correct_answer") if normalized_type == QuestionTypeEnum.MCQ else None,
                "explanation": q.get("explanation"),
                "model_answer": q.get("model_answer"),
                "marking_scheme": q.get("marking_scheme")
            }
            
            normalized_questions.append(normalized_q)
        
        return normalized_questions

    async def regenerate_question(
        self,
        original_question: Dict,
        subject: str,
        topic: str,
        feedback: Optional[str] = None
    ) -> Dict:
        """Regenerate a single question with improvements"""
        
        prompt = f"""Regenerate the following exam question with improvements:

**SUBJECT:** {subject}
**TOPIC:** {topic}
**ORIGINAL QUESTION:** {original_question.get('question_text')}
**QUESTION TYPE:** {original_question.get('question_type')}
**MARKS:** {original_question.get('marks')}
**DIFFICULTY:** {original_question.get('difficulty_level')}

{f"**FEEDBACK FOR IMPROVEMENT:**\n{feedback}\n" if feedback else ""}

**TASK:** Generate an improved version of this question maintaining the same type, marks, and difficulty level.

**OUTPUT FORMAT (JSON):**
{{
  "question_text": "Improved question text",
  "question_type": "{original_question.get('question_type')}",
  "marks": {original_question.get('marks')},
  "difficulty_level": "{original_question.get('difficulty_level')}",
  "options": [],  // If MCQ
  "correct_answer": "",  // If MCQ
  "explanation": "",  // If MCQ
  "model_answer": "",  // If subjective
  "marking_scheme": {{}}  // If subjective
}}

Return ONLY valid JSON."""

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert question improver. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.8,
                max_tokens=1000,
            )
            
            response_text = chat_completion.choices[0].message.content.strip()
            
            # Clean markdown
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            improved_question = json.loads(response_text.strip())
            
            return {
                "success": True,
                "question": improved_question
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
_groq_service = None

def get_groq_service() -> GroqService:
    """Get or create GroqService singleton"""
    global _groq_service
    if _groq_service is None:
        _groq_service = GroqService()
    return _groq_service
