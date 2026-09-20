export type RequirementType = 'technical' | 'experience' | 'education' | 'soft_skill' | 'domain';
export type RequirementPriority = 'REQUIRED' | 'PREFERRED';

export interface Requirement {
  id: string;
  roleId: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  sourceSnippet: string;
  approved: boolean;
}

export type RoleStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Role {
  id: string;
  title: string;
  department: string;
  location: string;
  rawJd: string;
  status: RoleStatus;
  createdAt: string;
  requirements?: Requirement[];
  candidateCount?: number;
}

export type MappingStatus = 
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'NOT_FOUND'
  | 'UNCLEAR'
  | 'NOT_APPLICABLE';

export interface Evidence {
  id: string;
  candidateId: string;
  sourceDoc: string;
  section: string;
  snippet: string;
  pageOrLine?: string;
  createdAt: string;
}

export interface RequirementMapping {
  id: string;
  candidateId: string;
  requirementId: string;
  status: MappingStatus;
  confidence: number; // 0 - 100
  aiReasoning: string;
  evidenceIds: string[];
  humanOverride?: MappingStatus | null;
  humanNotes?: string;
  updatedAt: string;
}

export interface CandidateSummary {
  candidateId: string;
  overview: string;
  relevantExperience: string[];
  keySkills: string[];
  roleAlignment: string;
  unclearInfo: string[];
  validationAreas: string[];
  interviewFocusAreas: string[];
}

export type CandidateStatus = 
  | 'SCREENING'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'EVALUATED'
  | 'OFFERED'
  | 'ON_HOLD';

export interface Candidate {
  id: string;
  roleId: string;
  name: string;
  email: string;
  phone: string;
  currentTitle: string;
  experienceYears: number;
  skills: string[];
  rawResumeText: string;
  status: CandidateStatus;
  groups: string[];
  createdAt: string;
  matchScore?: number;
  tier?: 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'NOT_ALIGNED';
  isAnonymized?: boolean;
  anonymizedAt?: string;
  anonymizedReason?: string;
}

export interface InterviewQuestion {
  id: string;
  interviewId: string;
  area: string;
  primaryQuestion: string;
  evidenceToLookFor: string;
  followUpQuestion: string;
  requirementId: string;
}

export type NoteValidationStatus = 
  | 'VALIDATED'
  | 'PARTIALLY_VALIDATED'
  | 'UNVALIDATED'
  | 'CONTRADICTORY';

export interface InterviewNote {
  id: string;
  interviewId: string;
  area: string;
  questionId?: string;
  candidateAnswer: string;
  interviewerComments: string;
  evidenceSnippet: string;
  validationStatus: NoteValidationStatus;
  createdAt: string;
}

export interface InterviewSummary {
  interviewId: string;
  keyEvidence: string[];
  requirementsValidated: string[];
  partiallyValidated: string[];
  unansweredAreas: string[];
  contradictions: string[];
  additionalValidationAreas: string[];
}

export interface Interview {
  id: string;
  candidateId: string;
  roleId: string;
  interviewerName: string;
  scheduledDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  questions: InterviewQuestion[];
  notes: InterviewNote[];
  summary?: InterviewSummary;
}

export interface EvaluationReport {
  id: string;
  candidateId: string;
  roleId: string;
  interviewId?: string;
  createdAt: string;
  interviewers: string[];
  requirementCoverage: {
    total: number;
    supported: number;
    partiallySupported: number;
    notFound: number;
    unclear: number;
  };
  relevantEvidence: string[];
  validationGaps: string[];
  unansweredAreas: string[];
  contradictions: string[];
  humanEvaluation: string;
  humanRecommendation: 'ADVANCE' | 'FURTHER_REVIEW' | 'HOLD' | 'REJECT';
  humanDecidedBy?: string;
  decidedAt?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: 'ROLE' | 'CANDIDATE' | 'REQUIREMENT' | 'EVIDENCE' | 'INTERVIEW' | 'EVALUATION' | 'SEARCH' | 'DEDUPLICATION' | 'COMPLIANCE' | 'RETENTION';
  entityId: string;
  details: string;
  sourceDocument?: string;
  evidenceSnippet?: string;
  modelId?: string;
}

// -------------------------------------------------------------
// SECOND PRD BUSINESS ENTITIES
// -------------------------------------------------------------

export type DuplicateResolutionStatus = 'PENDING_REVIEW' | 'MERGED' | 'KEPT_SEPARATE' | 'DISMISSED';

export interface DuplicateCandidateRecord {
  id: string;
  originalCandidateId: string;
  originalCandidateName: string;
  originalRoleTitle: string;
  originalAppliedDate: string;
  incomingCandidateName: string;
  incomingEmail: string;
  incomingRoleTitle: string;
  incomingSubmissionDate: string;
  matchReason: string;
  confidenceScore: number;
  status: DuplicateResolutionStatus;
  newSkillsDetected: string[];
  newExperienceAdded: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface RoleScoringConfig {
  roleId: string;
  mustHaveWeight: number; // default 70
  niceToHaveWeight: number; // default 30
  customMultipliers: Record<string, number>; // requirementId -> 1 | 1.5 | 2 | 3
  updatedAt?: string;
}

export interface AnswerDepthEvaluation {
  answerQuality: 'STRONG' | 'SHALLOW' | 'CONTRADICTORY';
  score: number; // 0 - 100
  reasoning: string;
  detectedFlags: string[];
  suggestedProbes: string[];
}

export interface DemographicParityCategory {
  category: string;
  candidateCount: number;
  averageMatchScore: number;
  supportedRequirementRatio: number;
}

export interface FairnessMetrics {
  zeroPiiEnforced: boolean;
  auditStatus: 'VERIFIED_COMPLIANT' | 'NEEDS_REVIEW';
  protectedAttributesExcluded: string[];
  parityDistribution: DemographicParityCategory[];
  totalEvaluated: number;
  lastAuditTimestamp: string;
}

