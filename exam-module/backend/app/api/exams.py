from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.schemas.exam import (
    ExamCreate,
    ExamUpdate,
    ExamResponse,
    ExamDetailResponse,
    AIGenerationRequest,
    AIGenerationResponse,
    ExamStatistics,
    AuditLogResponse,
    ExamStatusEnum,
)
from app.services.exam_service import ExamService

router = APIRouter(prefix="/exams", tags=["Exams"])


# Dependency to get current user (placeholder - integrate with your auth)
def get_current_user():
    """Get current authenticated user - TODO: Integrate with existing auth"""
    # For now, return a mock user_id
    # In production, this should validate JWT token and return user from database
    return {"id": 1, "username": "faculty", "role": "Faculty"}


@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new exam manually"""
    try:
        exam = ExamService.create_exam(
            db=db,
            exam_data=exam_data,
            created_by=current_user["id"]
        )
        return exam
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create exam: {str(e)}"
        )


@router.post("/generate", response_model=AIGenerationResponse, status_code=status.HTTP_201_CREATED)
async def generate_exam_with_ai(
    request: AIGenerationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate exam using Groq AI"""
    try:
        result = await ExamService.generate_exam_with_ai(
            db=db,
            request=request,
            created_by=current_user["id"]
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to generate exam")
            )
        
        return AIGenerationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {str(e)}"
        )


@router.get("/", response_model=List[ExamResponse])
def get_exams(
    skip: int = 0,
    limit: int = 100,
    status: Optional[ExamStatusEnum] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get list of exams with filters"""
    exams = ExamService.get_exams(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        subject=subject
    )
    return exams


@router.get("/my-exams", response_model=List[ExamResponse])
def get_my_exams(
    skip: int = 0,
    limit: int = 100,
    status: Optional[ExamStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get exams created by current user"""
    exams = ExamService.get_exams(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        created_by=current_user["id"]
    )
    return exams


@router.get("/statistics", response_model=ExamStatistics)
def get_exam_statistics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get exam statistics for current user"""
    stats = ExamService.get_exam_statistics(
        db=db,
        created_by=current_user["id"]
    )
    return ExamStatistics(**stats)


@router.get("/{exam_id}", response_model=ExamDetailResponse)
def get_exam_detail(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get exam details with questions"""
    exam = ExamService.get_exam_by_id(db=db, exam_id=exam_id)
    
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam with ID {exam_id} not found"
        )
    
    return exam


@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update exam details"""
    exam = ExamService.update_exam(
        db=db,
        exam_id=exam_id,
        exam_data=exam_data,
        updated_by=current_user["id"]
    )
    
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam with ID {exam_id} not found"
        )
    
    return exam


@router.post("/{exam_id}/publish", response_model=ExamResponse)
def publish_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Publish an exam (make it active)"""
    exam = ExamService.publish_exam(
        db=db,
        exam_id=exam_id,
        published_by=current_user["id"]
    )
    
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam with ID {exam_id} not found"
        )
    
    return exam


@router.post("/{exam_id}/archive", response_model=ExamResponse)
def archive_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Archive an exam"""
    exam = ExamService.archive_exam(
        db=db,
        exam_id=exam_id,
        archived_by=current_user["id"]
    )
    
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam with ID {exam_id} not found"
        )
    
    return exam


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete an exam (soft delete)"""
    success = ExamService.delete_exam(
        db=db,
        exam_id=exam_id,
        deleted_by=current_user["id"]
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam with ID {exam_id} not found"
        )
    
    return None


@router.get("/{exam_id}/audit-logs", response_model=List[AuditLogResponse])
def get_exam_audit_logs(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get audit logs for an exam (transparency feature)"""
    # First verify exam exists
    exam = ExamService.get_exam_by_id(db=db, exam_id=exam_id)
    
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exam with ID {exam_id} not found"
        )
    
    logs = ExamService.get_audit_logs(db=db, exam_id=exam_id)
    return logs
