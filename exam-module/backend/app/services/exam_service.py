from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime

from app.models.exam import Exam, Question, AuditLog
from app.schemas.exam import (
    ExamCreate,
    ExamUpdate,
    AIGenerationRequest,
    QuestionCreate,
    ExamStatusEnum,
)
from app.services.groq_service import get_groq_service


class ExamService:
    """Business logic for exam management"""

    @staticmethod
    def create_exam(
        db: Session,
        exam_data: ExamCreate,
        created_by: int
    ) -> Exam:
        """Create a new exam (manual or template)"""
        
        # Calculate total marks
        total_marks = (
            exam_data.marks_structure.mcq +
            exam_data.marks_structure.short +
            exam_data.marks_structure.long
        )
        
        # Create exam
        exam = Exam(
            title=exam_data.title,
            subject=exam_data.subject,
            duration=exam_data.duration,
            total_marks=total_marks,
            exam_type=exam_data.exam_type,
            topics=exam_data.topics,
            difficulty_distribution=exam_data.difficulty_distribution.dict(),
            marks_structure=exam_data.marks_structure.dict(),
            status=ExamStatusEnum.DRAFT,
            is_ai_generated=False,
            created_by=created_by
        )
        
        db.add(exam)
        db.flush()
        
        # Add questions if provided
        if exam_data.questions:
            for q_data in exam_data.questions:
                question = Question(
                    exam_id=exam.id,
                    question_number=q_data.question_number,
                    question_text=q_data.question_text,
                    question_type=q_data.question_type,
                    marks=q_data.marks,
                    difficulty_level=q_data.difficulty_level,
                    options=q_data.options,
                    correct_answer=q_data.correct_answer,
                    explanation=q_data.explanation,
                    model_answer=q_data.model_answer,
                    marking_scheme=q_data.marking_scheme
                )
                db.add(question)
        
        # Create audit log
        ExamService._create_audit_log(
            db=db,
            exam_id=exam.id,
            user_id=created_by,
            action="Exam Created",
            details={"title": exam.title, "method": "Manual"}
        )
        
        db.commit()
        db.refresh(exam)
        
        return exam

    @staticmethod
    async def generate_exam_with_ai(
        db: Session,
        request: AIGenerationRequest,
        created_by: int
    ) -> Dict:
        """Generate exam using Groq AI"""
        
        # Calculate total marks
        total_marks = (
            request.marks_structure.mcq +
            request.marks_structure.short +
            request.marks_structure.long
        )
        
        # Create exam record first
        exam = Exam(
            title=f"{request.subject} - AI Generated Exam",
            subject=request.subject,
            duration=request.duration,
            total_marks=total_marks,
            exam_type=request.exam_type,
            topics=request.topics,
            difficulty_distribution=request.difficulty_distribution.dict(),
            marks_structure=request.marks_structure.dict(),
            status=ExamStatusEnum.DRAFT,
            is_ai_generated=True,
            created_by=created_by
        )
        
        db.add(exam)
        db.flush()
        
        # Generate questions using Groq
        groq_service = get_groq_service()
        generation_result = await groq_service.generate_exam_questions(
            request=request,
            db=db,
            exam_id=exam.id
        )
        
        if not generation_result.get("success"):
            db.rollback()
            return {
                "success": False,
                "error": generation_result.get("error", "Unknown error during generation")
            }
        
        # Update exam title if AI provided better one
        if generation_result.get("exam_title"):
            exam.title = generation_result["exam_title"]
        
        # Add generated questions to database
        questions = generation_result.get("questions", [])
        for q_data in questions:
            question = Question(
                exam_id=exam.id,
                question_number=q_data["question_number"],
                question_text=q_data["question_text"],
                question_type=q_data["question_type"],
                marks=q_data["marks"],
                difficulty_level=q_data["difficulty_level"],
                options=q_data.get("options"),
                correct_answer=q_data.get("correct_answer"),
                explanation=q_data.get("explanation"),
                model_answer=q_data.get("model_answer"),
                marking_scheme=q_data.get("marking_scheme")
            )
            db.add(question)
        
        # Create audit log
        ExamService._create_audit_log(
            db=db,
            exam_id=exam.id,
            user_id=created_by,
            action="AI Exam Generated",
            details={
                "questions_generated": len(questions),
                "generation_time": generation_result.get("generation_time"),
                "tokens_used": generation_result.get("tokens_used"),
                "model": "Groq Mixtral"
            }
        )
        
        db.commit()
        db.refresh(exam)
        
        return {
            "success": True,
            "exam_id": exam.id,
            "title": exam.title,
            "subject": exam.subject,
            "duration": exam.duration,
            "total_marks": exam.total_marks,
            "questions_generated": len(questions),
            "questions": questions,
            "generation_time": generation_result.get("generation_time", 0),
            "tokens_used": generation_result.get("tokens_used", 0),
            "status": exam.status,
            "message": "Exam generated successfully"
        }

    @staticmethod
    def get_exam_by_id(db: Session, exam_id: int) -> Optional[Exam]:
        """Get exam by ID with questions"""
        return db.query(Exam).filter(Exam.id == exam_id).first()

    @staticmethod
    def get_exams(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[ExamStatusEnum] = None,
        created_by: Optional[int] = None,
        subject: Optional[str] = None
    ) -> List[Exam]:
        """Get exams with filters"""
        query = db.query(Exam)
        
        if status:
            query = query.filter(Exam.status == status)
        if created_by:
            query = query.filter(Exam.created_by == created_by)
        if subject:
            query = query.filter(Exam.subject.ilike(f"%{subject}%"))
        
        return query.order_by(Exam.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_exam(
        db: Session,
        exam_id: int,
        exam_data: ExamUpdate,
        updated_by: int
    ) -> Optional[Exam]:
        """Update exam details"""
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        
        if not exam:
            return None
        
        # Update fields
        update_data = exam_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "difficulty_distribution" and value:
                setattr(exam, field, value.dict())
            elif field == "marks_structure" and value:
                setattr(exam, field, value.dict())
                # Recalculate total marks
                exam.total_marks = sum(value.dict().values())
            else:
                setattr(exam, field, value)
        
        exam.updated_at = datetime.utcnow()
        
        # Create audit log
        ExamService._create_audit_log(
            db=db,
            exam_id=exam_id,
            user_id=updated_by,
            action="Exam Updated",
            details={"fields_updated": list(update_data.keys())}
        )
        
        db.commit()
        db.refresh(exam)
        
        return exam

    @staticmethod
    def publish_exam(db: Session, exam_id: int, published_by: int) -> Optional[Exam]:
        """Publish an exam (make it active)"""
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        
        if not exam:
            return None
        
        if exam.status == ExamStatusEnum.PUBLISHED:
            return exam
        
        exam.status = ExamStatusEnum.PUBLISHED
        exam.published_at = datetime.utcnow()
        
        # Create audit log
        ExamService._create_audit_log(
            db=db,
            exam_id=exam_id,
            user_id=published_by,
            action="Exam Published",
            details={"published_at": exam.published_at.isoformat()}
        )
        
        db.commit()
        db.refresh(exam)
        
        return exam

    @staticmethod
    def archive_exam(db: Session, exam_id: int, archived_by: int) -> Optional[Exam]:
        """Archive an exam"""
        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        
        if not exam:
            return None
        
        exam.status = ExamStatusEnum.ARCHIVED
        
        # Create audit log
        ExamService._create_audit_log(
            db=db,
            exam_id=exam_id,
            user_id=archived_by,
            action="Exam Archived",
            details={}
        )
        
        db.commit()
        db.refresh(exam)
        
        return exam

    @staticmethod
    def delete_exam(db: Session, exam_id: int, deleted_by: int) -> bool:
        """Delete an exam permanently"""
        try:
            exam = db.query(Exam).filter(Exam.id == exam_id).first()
            if not exam:
                return False
            
            # Delete all associated questions first
            db.query(Question).filter(Question.exam_id == exam_id).delete()
            
            # Delete the exam
            db.delete(exam)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error deleting exam: {e}")
            return False

    @staticmethod
    def get_exam_statistics(db: Session, created_by: Optional[int] = None) -> Dict:
        """Get exam statistics"""
        query = db.query(Exam)
        
        if created_by:
            query = query.filter(Exam.created_by == created_by)
        
        total_exams = query.count()
        draft_exams = query.filter(Exam.status == ExamStatusEnum.DRAFT).count()
        published_exams = query.filter(Exam.status == ExamStatusEnum.PUBLISHED).count()
        ai_generated = query.filter(Exam.is_ai_generated == True).count()
        
        # Count total questions
        total_questions = db.query(func.count(Question.id)).join(Exam)
        if created_by:
            total_questions = total_questions.filter(Exam.created_by == created_by)
        total_questions = total_questions.scalar()
        
        # Average marks
        avg_marks = db.query(func.avg(Exam.total_marks))
        if created_by:
            avg_marks = avg_marks.filter(Exam.created_by == created_by)
        avg_marks = avg_marks.scalar() or 0
        
        return {
            "total_exams": total_exams,
            "draft_exams": draft_exams,
            "published_exams": published_exams,
            "ai_generated_exams": ai_generated,
            "total_questions": total_questions or 0,
            "avg_marks": round(float(avg_marks), 2)
        }

    @staticmethod
    def _create_audit_log(
        db: Session,
        exam_id: int,
        user_id: int,
        action: str,
        details: Dict
    ) -> AuditLog:
        """Create an audit log entry"""
        log = AuditLog(
            exam_id=exam_id,
            user_id=user_id,
            action=action,
            details=details
        )
        db.add(log)
        return log

    @staticmethod
    def get_audit_logs(db: Session, exam_id: int) -> List[AuditLog]:
        """Get audit logs for an exam"""
        return db.query(AuditLog).filter(
            AuditLog.exam_id == exam_id
        ).order_by(AuditLog.timestamp.desc()).all()
