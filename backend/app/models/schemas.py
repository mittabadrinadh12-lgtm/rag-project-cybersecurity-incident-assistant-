from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Severity = Literal["Critical", "High", "Medium", "Low"]
IncidentStatus = Literal["Open", "In Progress", "Contained", "Resolved"]


class IncidentSummary(BaseModel):
    id: str
    title: str
    severity: Severity
    status: IncidentStatus
    asset: str
    analyst: str
    updatedAt: str
    technique: str


class IncidentDetail(IncidentSummary):
    description: str
    createdAt: str
    suspiciousIps: list[str]
    domains: list[str]
    hashes: list[str]
    usernames: list[str]
    endpoints: list[str]
    affectedSystems: list[str]
    evidence: list[dict[str, str]]
    timeline: list[dict[str, str]]
    notes: list[dict[str, str]]
    techniques: list[dict[str, str]]


class IncidentUpdate(BaseModel):
    status: IncidentStatus | None = None
    analyst: str | None = Field(default=None, max_length=100)


class NoteCreate(BaseModel):
    author: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1, max_length=5000)


class RagQuery(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    incident_id: str | None = None


class ReportRequest(BaseModel):
    incident_id: str = Field(min_length=1, max_length=32)
    format: Literal["markdown", "html"] = "markdown"


class DocumentSummary(BaseModel):
    id: str
    title: str
    source: str
    status: str
    chunkCount: int
    embeddingState: str
    accessScope: str
    createdAt: str
    sizeBytes: int


class UserSettings(BaseModel):
    displayName: str = Field(min_length=1, max_length=100)
    role: Literal["SOC Analyst", "Security Engineer", "Incident Responder", "Student"]


class MockLoginRequest(UserSettings):
    pass
