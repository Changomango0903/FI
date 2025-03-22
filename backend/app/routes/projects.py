from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

from app.utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

# Initialize router
router = APIRouter()

# --- Models ---

class ProjectBase(BaseModel):
    """Base model for project data"""
    name: str
    description: Optional[str] = None
    model_id: Optional[str] = None
    color: Optional[str] = "#6366f1"  # Default indigo color


class ProjectCreate(ProjectBase):
    """Model for creating a new project"""
    pass


class Project(ProjectBase):
    """Model for project responses"""
    id: str
    created_at: datetime
    updated_at: datetime
    chatIds: List[str] = Field(default_factory=list)
    
    # Support both older and newer versions of Pydantic
    try:
        model_config = ConfigDict(from_attributes=True)
    except NameError:
        class Config:
            orm_mode = True


# In-memory storage for projects (replace with database implementation later)
projects_db = []


# Create a default project
def create_default_project():
    """Create a default project if none exists"""
    if not projects_db:
        project_id = str(uuid4())
        now = datetime.utcnow()
        
        default_project = Project(
            id=project_id,
            name="Default Project",
            description="This is the default project created automatically",
            model_id=None,
            color="#6366f1",  # Indigo color
            chatIds=[],
            created_at=now,
            updated_at=now,
        )
        
        projects_db.append(default_project)
        logger.info(f"Created default project with ID: {project_id}")


# Create default project on startup
create_default_project()


# --- Routes ---

@router.get("/projects", response_model=List[Project], status_code=status.HTTP_200_OK)
async def get_projects():
    """Get all projects"""
    logger.info(f"Fetching all projects, found {len(projects_db)}")
    return projects_db


@router.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate):
    """Create a new project"""
    project_id = str(uuid4())
    now = datetime.utcnow()
    
    # Convert the model to a dictionary for newer Pydantic versions
    project_data = project.model_dump() if hasattr(project, 'model_dump') else project.dict()
    
    new_project = Project(
        id=project_id,
        created_at=now,
        updated_at=now,
        **project_data
    )
    
    projects_db.append(new_project)
    logger.info(f"Created new project with ID: {project_id}")
    
    return new_project


@router.get("/projects/{project_id}", response_model=Project, status_code=status.HTTP_200_OK)
async def get_project(project_id: str):
    """Get a project by ID"""
    for project in projects_db:
        if project.id == project_id:
            return project
    
    logger.warning(f"Project not found with ID: {project_id}")
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Project with ID {project_id} not found"
    )


@router.put("/projects/{project_id}", response_model=Project, status_code=status.HTTP_200_OK)
async def update_project(project_id: str, project_update: ProjectBase):
    """Update a project"""
    for i, project in enumerate(projects_db):
        if project.id == project_id:
            # Convert the model to a dictionary for newer Pydantic versions
            project_data = project_update.model_dump() if hasattr(project_update, 'model_dump') else project_update.dict()
            
            # Update the project
            updated_project = Project(
                id=project.id,
                created_at=project.created_at,
                updated_at=datetime.utcnow(),
                **project_data
            )
            projects_db[i] = updated_project
            logger.info(f"Updated project with ID: {project_id}")
            return updated_project
    
    logger.warning(f"Attempted to update non-existent project with ID: {project_id}")
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Project with ID {project_id} not found"
    )


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str):
    """Delete a project"""
    for i, project in enumerate(projects_db):
        if project.id == project_id:
            projects_db.pop(i)
            logger.info(f"Deleted project with ID: {project_id}")
            return
    
    logger.warning(f"Attempted to delete non-existent project with ID: {project_id}")
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Project with ID {project_id} not found"
    ) 