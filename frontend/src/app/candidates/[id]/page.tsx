'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  MessageSquare, 
  Award, 
  UserCheck, 
  Plus, 
  ChevronRight, 
  Search, 
  ArrowLeft,
  Lightbulb,
  CornerDownRight,
  ShieldAlert,
  Shield,
  Trash2,
  Zap,
  X
} from 'lucide-react';
import { 
  Candidate, 
  Role, 
  Requirement, 
  Evidence, 
  RequirementMapping, 
  CandidateSummary, 
  Interview, 
  EvaluationReport, 
  MappingStatus,
  AnswerDepthEvaluation
} from '@/lib/types';
import { EvidenceDrawer } from '@/components/modals/EvidenceDrawer';

export default function CandidateWorkspace() {
  const params = useParams();
  const candidateId = params?.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [mappings, setMappings] = useState<RequirementMapping[]>([]);
  const [summary, setSummary] = useState<CandidateSummary | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'summary' | 'interview' | 'evaluation' | 'profile'>('matrix');
  const [loading, setLoading] = useState(true);

  // Evidence Drawer state
  const [selectedMapping, setSelectedMapping] = useState<RequirementMapping | null>(null);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Live Interview Room State
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [noteArea, setNoteArea] = useState('');
  const [noteQuestionId, setNoteQuestionId] = useState('');
  const [noteAnswer, setNoteAnswer] = useState('');
  const [noteComments, setNoteComments] = useState('');
  const [noteStatus, setNoteStatus] = useState<any>('VALIDATED');
  const [generatingFollowup, setGeneratingFollowup] = useState(false);
  const [followupSuggestion, setFollowupSuggestion] = useState<string | null>(null);

  // Second PRD §7.2 Adaptive In-Interview Answer Depth Evaluation
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [answerEvaluation, setAnswerEvaluation] = useState<AnswerDepthEvaluation | null>(null);

  // Second PRD §12 GDPR Right to Erasure State
  const [isGdprModalOpen, setIsGdprModalOpen] = useState(false);
  const [gdprReason, setGdprReason] = useState('Candidate requested right to erasure under GDPR Article 17.');
  const [isAnonymizing, setIsAnonymizing] = useState(false);

  // Human Evaluation Form State
  const [humanAssessmentText, setHumanAssessmentText] = useState('');
  const [humanRecommendation, setHumanRecommendation] = useState<any>('ADVANCE');
  const [savingEval, setSavingEval] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  useEffect(() => {
    if (candidateId) {
      loadCandidateData();
    }
  }, [candidateId]);

  const loadCandidateData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/candidates/${candidateId}`);
      const data = await res.json();

      setCandidate(data.candidate);
      setRole(data.role);
      setRequirements(data.requirements || []);
      setEvidenceList(data.evidence || []);
      setMappings(data.mappings || []);
      setSummary(data.summary || null);
      setInterviews(data.interviews || []);
      if (data.interviews && data.interviews.length > 0) {
        setActiveInterview(data.interviews[0]);
      }
      setEvaluation(data.evaluation || null);
      if (data.evaluation) {
        setHumanAssessmentText(data.evaluation.humanEvaluation);
        setHumanRecommendation(data.evaluation.humanRecommendation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectEvidence = (mapping: RequirementMapping) => {
    const req = requirements.find(r => r.id === mapping.requirementId);
    setSelectedMapping(mapping);
    setSelectedReq(req || null);
    setDrawerOpen(true);
  };

  const handleHumanOverride = async (mappingId: string, overrideStatus: MappingStatus) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/mappings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappingId,
          humanOverride: overrideStatus,
          humanNotes: `Manually updated by human recruiter.`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMappings(prev => prev.map(m => m.id === mappingId ? data.mapping : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewerName: 'Alex Thorne (VP Engineering)',
          scheduledDate: new Date().toISOString()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInterviews(prev => [data.interview, ...prev]);
        setActiveInterview(data.interview);
        setActiveTab('interview');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterview || !noteAnswer) return;

    try {
      const res = await fetch(`/api/interviews/${activeInterview.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: noteArea || 'Technical Architecture',
          questionId: noteQuestionId || undefined,
          candidateAnswer: noteAnswer,
          interviewerComments: noteComments,
          evidenceSnippet: noteAnswer.substring(0, 100),
          validationStatus: noteStatus
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveInterview(prev => prev ? {
          ...prev,
          notes: [...prev.notes, data.note]
        } : null);
        setNoteAnswer('');
        setNoteComments('');
        setFollowupSuggestion(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateDynamicFollowup = async (area: string, qText: string) => {
    try {
      setGeneratingFollowup(true);
      const res = await fetch(`/api/interviews/${activeInterview?.id || 'int'}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area,
          currentQuestion: qText,
          candidateNotes: noteAnswer || 'Distributed systems trade-offs and performance'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFollowupSuggestion(data.followup);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingFollowup(false);
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingEval(true);
      const res = await fetch(`/api/candidates/${candidateId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humanEvaluation: humanAssessmentText,
          humanRecommendation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.evaluation);
        setEvalSuccess(true);
        await loadCandidateData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEval(false);
    }
  };

  const handleEvaluateAnswerDepth = async () => {
    if (!noteAnswer.trim()) return;
    try {
      setEvaluatingAnswer(true);
      const res = await fetch('/api/interviews/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: noteArea || 'System Design & Technical Architecture',
          answerText: noteAnswer,
          resumeEvidenceSnippet: evidenceList[0]?.snippet || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAnswerEvaluation(data.evaluation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  const handleExecuteGdprErasure = async () => {
    try {
      setIsAnonymizing(true);
      const res = await fetch(`/api/candidates/${candidateId}/anonymize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: gdprReason })
      });
      if (res.ok) {
        setIsGdprModalOpen(false);
        await loadCandidateData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnonymizing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0F0F0F] border-t-transparent" />
        <p className="text-sm font-mono text-neutral-500">Loading Candidate Intelligence...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="py-12 text-center text-neutral-500">
        <p>Candidate not found.</p>
        <Link href="/candidates" className="mt-4 text-[#0F0F0F] underline font-bold inline-block">Back to Candidates</Link>
      </div>
    );
  }

  // Coverage calculations
  const supportedCount = mappings.filter(m => (m.humanOverride || m.status) === 'SUPPORTED').length;
  const matchPercentage = Math.round((supportedCount / Math.max(1, requirements.length)) * 100);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
        <Link href="/candidates" className="hover:text-black flex items-center gap-1 font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>CANDIDATES</span>
        </Link>
        <span>/</span>
        <span className="text-[#0F0F0F] font-bold">{candidate.name}</span>
      </div>

      {/* Candidate Header Banner (Clean Landing Page Aesthetic) */}
      <div className="rounded-2xl border border-neutral-300/80 bg-white p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#0F0F0F]">{candidate.name}</h1>
              <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-neutral-800">
                {candidate.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-neutral-600 font-medium">{candidate.currentTitle}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 pt-0.5 font-mono">
              <span>{candidate.email}</span>
              <span>•</span>
              <span>{candidate.phone}</span>
              <span>•</span>
              <span className="text-[#0F0F0F] font-bold">{candidate.experienceYears} Years Exp</span>
              <span>•</span>
              <span>Role: <strong className="text-[#0F0F0F]">{role?.title}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-center min-w-[130px]">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono block">Requirement Fit</span>
              <span className="text-2xl font-display font-bold text-emerald-700 mt-0.5 block">{matchPercentage}%</span>
              <span className="text-[10px] text-neutral-500 font-mono">{supportedCount}/{requirements.length} Supported</span>
            </div>

            {candidate.isAnonymized ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-left">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> GDPR Article 17 Purged
                </span>
                <span className="text-[11px] text-amber-700 block font-mono">PII Removed • Retention Enforced</span>
              </div>
            ) : (
              <button
                onClick={() => setIsGdprModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-mono font-medium text-red-700 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
                title="Execute GDPR Right to Erasure / Anonymization"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                <span>GDPR Erasure</span>
              </button>
            )}

            {interviews.length === 0 && (
              <button
                onClick={handleScheduleInterview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] px-4 py-2.5 text-xs font-display font-bold text-white hover:bg-[#FF3B30] transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Prepare Interview</span>
              </button>
            )}
          </div>
        </div>

        {/* Group chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200">
          <span className="text-xs text-neutral-500 font-mono flex items-center gap-1 py-0.5">
            <Sparkles className="h-3 w-3 text-[#FF3B30]" />
            <span>AI Talent Groups:</span>
          </span>
          {candidate.groups?.map((g, i) => (
            <span key={i} className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-xs text-neutral-800 font-mono font-medium">
              {g}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 gap-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Evidence Matrix ({mappings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === 'summary'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === 'interview'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Interview Room</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === 'evaluation'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Evaluation & Decision</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Resume & Snippets</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EVIDENCE MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* PRD Safeguard Banner */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950">PRD Evidence Safeguard: </span>
              Under HireFlow recruitment rules, <code className="bg-amber-200/80 px-1 py-0.5 rounded font-bold font-mono">NOT FOUND</code> must never be inferred as candidate lacking the skill. It flags missing documentary evidence to be prioritized for interview validation.
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-300/80 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
              <div>
                <h3 className="text-sm font-display font-bold text-[#0F0F0F]">Requirement-to-Evidence Matrix</h3>
                <p className="text-xs text-neutral-500">Click any row or inspect button to view verbatim source citations</p>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                {mappings.length} criteria evaluated
              </span>
            </div>

            <div className="divide-y divide-neutral-200">
              {mappings.map(map => {
                const req = requirements.find(r => r.id === map.requirementId);
                const currentStatus = map.humanOverride || map.status;
                const isOverridden = !!map.humanOverride;

                return (
                  <div 
                    key={map.id} 
                    className="p-4 hover:bg-neutral-50/80 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            req?.priority === 'REQUIRED'
                              ? 'bg-[#0F0F0F] text-white border-black'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}>
                            {req?.priority || 'REQUIRED'}
                          </span>
                          <span className="text-sm font-bold text-[#0F0F0F]">
                            {req?.description}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-1">{map.aiReasoning}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        {/* Status Chip */}
                        <span className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold border ${
                          currentStatus === 'SUPPORTED' 
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : currentStatus === 'PARTIALLY_SUPPORTED'
                            ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                            : currentStatus === 'UNCLEAR'
                            ? 'border-neutral-300 bg-neutral-100 text-neutral-700'
                            : 'border-amber-300 bg-amber-50 text-amber-800'
                        }`}>
                          {currentStatus.replace('_', ' ')}
                          {isOverridden && <span className="ml-1 text-[10px] text-emerald-800 font-bold">(Human)</span>}
                        </span>

                        {/* Evidence Inspector Button */}
                        <button
                          onClick={() => handleInspectEvidence(map)}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 hover:border-black hover:bg-neutral-50 transition-all shadow-2xs cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-[#FF3B30]" />
                          <span>Inspect Evidence ({map.evidenceIds.length})</span>
                        </button>

                        {/* Human Override Dropdown */}
                        <select
                          value={currentStatus}
                          onChange={e => handleHumanOverride(map.id, e.target.value as MappingStatus)}
                          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-mono text-[#0F0F0F] focus:border-black focus:outline-hidden cursor-pointer"
                        >
                          <option value="SUPPORTED">Set Supported</option>
                          <option value="PARTIALLY_SUPPORTED">Set Partial</option>
                          <option value="UNCLEAR">Set Unclear</option>
                          <option value="NOT_FOUND">Set Not Found</option>
                          <option value="NOT_APPLICABLE">Set N/A</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI SUMMARY & INTELLIGENCE */}
      {activeTab === 'summary' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-neutral-300/80 bg-white p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-display font-bold text-[#0F0F0F] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FF3B30]" />
              <span>Candidate Intelligence Overview</span>
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-lg border border-neutral-200 font-sans">
              {summary.overview}
            </p>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">Relevant Experience</h4>
              <ul className="space-y-1.5 text-xs text-neutral-700 list-disc list-inside">
                {summary.relevantExperience.map((exp, i) => (
                  <li key={i} className="leading-relaxed">{exp}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">Role Alignment</h4>
              <p className="text-xs text-neutral-800 bg-neutral-100 p-3 rounded-lg border border-neutral-200 font-medium">
                {summary.roleAlignment}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300/80 bg-white p-6 space-y-4 shadow-xs">
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Unclear Information & Verification Points</span>
              </h4>
              <div className="space-y-1.5">
                {summary.unclearInfo.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">No significant ambiguities detected in submitted materials.</p>
                ) : (
                  summary.unclearInfo.map((info, i) => (
                    <div key={i} className="rounded-lg bg-amber-50/60 p-2.5 text-xs text-amber-900 border border-amber-200">
                      {info}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-[#FF3B30]" />
                <span>Suggested Interview Focus Areas</span>
              </h4>
              <div className="space-y-2">
                {summary.interviewFocusAreas.map((area, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-neutral-800 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    <CornerDownRight className="h-4 w-4 text-[#0F0F0F] shrink-0 mt-0.5" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTERVIEW INTELLIGENCE ROOM */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          {interviews.length === 0 ? (
            <div className="rounded-xl border border-neutral-300/80 bg-white p-10 text-center space-y-4 shadow-xs">
              <MessageSquare className="h-10 w-10 mx-auto text-[#0F0F0F]" />
              <h3 className="text-base font-display font-bold text-[#0F0F0F]">No Interview Scheduled Yet</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Generate candidate-tailored questions covering validated scale, unverified criteria, and dynamic follow-ups.
              </p>
              <button
                onClick={handleScheduleInterview}
                className="rounded-lg bg-[#0F0F0F] px-5 py-2.5 text-xs font-display font-bold text-white hover:bg-[#FF3B30] shadow-sm transition-colors cursor-pointer"
              >
                Schedule & Generate Questions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 cols: Generated Questions & Copilot */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display font-bold text-[#0F0F0F] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#FF3B30]" />
                    <span>Candidate-Specific Interview Questions ({activeInterview?.questions?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Interviewer: {activeInterview?.interviewerName}
                  </span>
                </div>

                <div className="space-y-3">
                  {activeInterview?.questions.map((q, idx) => (
                    <div 
                      key={q.id || idx}
                      className="rounded-xl border border-neutral-300/80 bg-white p-4.5 space-y-3 hover:border-black transition-colors shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider">
                          Area: {q.area}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNoteArea(q.area);
                            setNoteQuestionId(q.id);
                          }}
                          className="text-[11px] font-semibold text-[#0F0F0F] hover:underline cursor-pointer"
                        >
                          Use for Live Note →
                        </button>
                      </div>

                      {/* Primary Question */}
                      <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                        <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Primary Question
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-[#0F0F0F] leading-relaxed">
                          {q.primaryQuestion}
                        </p>
                      </div>

                      {/* Evidence to Look For */}
                      <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-900 border border-emerald-200">
                        <span className="font-bold block text-[11px]">Evidence to Look For:</span>
                        <p className="mt-0.5 text-neutral-700">{q.evidenceToLookFor}</p>
                      </div>

                      {/* Follow-up question */}
                      <div className="rounded-lg bg-neutral-100 p-2.5 text-xs text-neutral-800 border border-neutral-200 flex items-start gap-2">
                        <CornerDownRight className="h-4 w-4 text-[#0F0F0F] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[#0F0F0F]">Suggested Follow-up: </span>
                          <span>{q.followUpQuestion}</span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleGenerateDynamicFollowup(q.area, q.primaryQuestion)}
                          className="text-[11px] font-semibold text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3 text-[#FF3B30]" />
                          <span>Generate Dynamic Probe</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dynamic Probe Output */}
                {followupSuggestion && (
                  <div className="rounded-xl border-2 border-black bg-white p-4 space-y-2 animate-in fade-in shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-display font-bold text-[#0F0F0F]">
                      <Sparkles className="h-4 w-4 text-[#FF3B30]" />
                      <span>On-the-Fly Follow-up Probe</span>
                    </div>
                    <p className="text-xs font-mono font-medium text-[#0F0F0F] italic bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                      &ldquo;{followupSuggestion}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Right 5 cols: Live Interview Notes Tracker */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-xl border border-neutral-300/80 bg-white p-5 space-y-4 shadow-xs">
                  <h3 className="text-sm font-display font-bold text-[#0F0F0F] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#FF3B30]" />
                    <span>Live Interview Note Taker</span>
                  </h3>

                  <form onSubmit={handleAddNote} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-700">Area / Requirement</label>
                      <input
                        type="text"
                        value={noteArea}
                        onChange={e => setNoteArea(e.target.value)}
                        placeholder="e.g. Distributed Consensus"
                        className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-[#0F0F0F] focus:border-black focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-neutral-700">Candidate Answer / Evidence</label>
                        <button
                          type="button"
                          onClick={handleEvaluateAnswerDepth}
                          disabled={evaluatingAnswer || !noteAnswer.trim()}
                          className="inline-flex items-center gap-1 rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50 cursor-pointer"
                        >
                          <Zap className={`h-3 w-3 text-purple-600 ${evaluatingAnswer ? 'animate-pulse' : ''}`} />
                          <span>{evaluatingAnswer ? 'Assessing...' : 'Assess Answer Depth'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        required
                        value={noteAnswer}
                        onChange={e => setNoteAnswer(e.target.value)}
                        placeholder="Type verbatim statements or technical specifics..."
                        className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-[#0F0F0F] font-mono placeholder-neutral-400 focus:border-black focus:outline-hidden"
                      />
                    </div>

                    {/* PRD §7.2 Adaptive In-Interview Probing & Answer Depth Evaluation */}
                    {answerEvaluation && (
                      <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            Live Answer Depth Assessment ({answerEvaluation.score}/100)
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            answerEvaluation.answerQuality === 'SHALLOW'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : answerEvaluation.answerQuality === 'CONTRADICTORY'
                              ? 'bg-red-100 text-red-900 border border-red-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            Quality: {answerEvaluation.answerQuality}
                          </span>
                        </div>
                        <p className="text-neutral-700 text-[11px] leading-relaxed">{answerEvaluation.reasoning}</p>
                        
                        {answerEvaluation.detectedFlags && answerEvaluation.detectedFlags.length > 0 && (
                          <div className="bg-white/80 p-2 rounded border border-purple-100 text-[11px] text-amber-900">
                            <strong>Identified Flags:</strong> {answerEvaluation.detectedFlags.join(' • ')}
                          </div>
                        )}

                        {answerEvaluation.suggestedProbes && answerEvaluation.suggestedProbes.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block">
                              Adaptive Follow-Up Probes:
                            </span>
                            {answerEvaluation.suggestedProbes.map((probe: string, idx: number) => (
                              <div key={idx} className="flex items-start justify-between gap-2 p-2 rounded bg-white border border-purple-100">
                                <span className="text-neutral-800 text-[11px] leading-snug">“{probe}”</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFollowupSuggestion(probe);
                                    setNoteComments(prev => prev ? `${prev}; Asked probe: "${probe}"` : `Asked probe: "${probe}"`);
                                  }}
                                  className="shrink-0 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 hover:bg-purple-200 cursor-pointer"
                                >
                                  Adopt Probe
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-700">Interviewer Observations</label>
                      <input
                        type="text"
                        value={noteComments}
                        onChange={e => setNoteComments(e.target.value)}
                        placeholder="e.g. Clear depth, effortlessly explained failure mode"
                        className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-[#0F0F0F] focus:border-black focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-700">Validation Status</label>
                      <select
                        value={noteStatus}
                        onChange={e => setNoteStatus(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-[#0F0F0F] font-mono focus:border-black focus:outline-hidden"
                      >
                        <option value="VALIDATED">VALIDATED (Direct convincing evidence)</option>
                        <option value="PARTIALLY_VALIDATED">PARTIALLY VALIDATED (Surface level)</option>
                        <option value="UNVALIDATED">UNVALIDATED (Did not answer)</option>
                        <option value="CONTRADICTORY">CONTRADICTORY (Inconsistent with resume)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!noteAnswer}
                      className="w-full rounded-lg bg-[#0F0F0F] py-2.5 font-display font-bold text-white hover:bg-[#FF3B30] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Record Interview Note
                    </button>
                  </form>
                </div>

                {/* Recorded notes list */}
                <div className="rounded-xl border border-neutral-300/80 bg-white p-4 space-y-3 shadow-xs">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                    Recorded Notes ({activeInterview?.notes?.length || 0})
                  </h4>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto">
                    {activeInterview?.notes?.map((n, i) => (
                      <div key={n.id || i} className="rounded-lg bg-neutral-50 p-3 border border-neutral-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F0F0F]">{n.area}</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                            {n.validationStatus}
                          </span>
                        </div>
                        <p className="text-neutral-700 font-mono italic bg-white p-2 rounded border border-neutral-200">
                          &ldquo;{n.candidateAnswer}&rdquo;
                        </p>
                        {n.interviewerComments && (
                          <p className="text-neutral-500 text-[11px]">Comments: {n.interviewerComments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EVALUATION REPORT & HUMAN DECISION */}
      {activeTab === 'evaluation' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-2xl border border-neutral-300/80 bg-white p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-[#0F0F0F] flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#FF3B30]" />
                  <span>Standardized Evaluation Report</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Comprehensive synthesis of requirement coverage, verified evidence, and final human decision.
                </p>
              </div>

              {evaluation && (
                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-mono font-bold text-emerald-800">
                  Decision: {evaluation.humanRecommendation}
                </span>
              )}
            </div>

            {/* Requirement Coverage Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                <span className="text-neutral-500 font-mono block text-[11px]">Total Criteria</span>
                <span className="font-bold font-display text-[#0F0F0F] text-lg mt-1 block">{requirements.length}</span>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                <span className="text-emerald-800 font-mono block text-[11px]">Supported</span>
                <span className="font-bold font-display text-emerald-800 text-lg mt-1 block">{supportedCount}</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                <span className="text-amber-800 font-mono block text-[11px]">Validation Gaps</span>
                <span className="font-bold font-display text-amber-800 text-lg mt-1 block">
                  {mappings.filter(m => m.status === 'NOT_FOUND' || m.status === 'UNCLEAR').length}
                </span>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200">
                <span className="text-neutral-500 font-mono block text-[11px]">Match Fit</span>
                <span className="font-bold font-display text-[#0F0F0F] text-lg mt-1 block">{matchPercentage}%</span>
              </div>
            </div>

            {/* Evidence Synthesis */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                Primary Supporting Evidence
              </h4>
              <div className="space-y-2">
                {evidenceList.slice(0, 3).map((ev, i) => (
                  <div key={i} className="rounded-lg bg-neutral-50 p-3 border border-neutral-200 text-xs text-neutral-800 font-mono">
                    <span className="font-bold text-[#0F0F0F] block mb-0.5">{ev.sourceDoc} ({ev.section})</span>
                    <span className="italic text-neutral-700 bg-white p-2 block rounded border border-neutral-200">&ldquo;{ev.snippet}&rdquo;</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Human Evaluation Form & Consequential Decision */}
            <form onSubmit={handleSaveEvaluation} className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-display font-bold text-[#0F0F0F]">
                  <UserCheck className="h-4 w-4 text-[#FF3B30]" />
                  <span>Human Hiring Assessment (Editable Recruiter Review)</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Per PRD rules: AI assists hiring teams. Consequential hiring decisions are recorded by humans with full audit attribution.
                </p>
                <textarea
                  rows={4}
                  required
                  value={humanAssessmentText}
                  onChange={e => setHumanAssessmentText(e.target.value)}
                  placeholder="Enter human evaluation, cultural alignment, and final recommendation notes..."
                  className="w-full rounded-lg border border-neutral-300 bg-white p-3 text-xs text-[#0F0F0F] placeholder-neutral-400 focus:border-black focus:outline-hidden"
                />
              </div>

              {/* Recommendation Choice */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-700">Final Human Recommendation</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'ADVANCE', label: 'Advance / Offer', color: 'border-emerald-500 text-emerald-800 bg-emerald-50' },
                    { val: 'FURTHER_REVIEW', label: 'Further Review', color: 'border-neutral-400 text-neutral-800 bg-neutral-100' },
                    { val: 'HOLD', label: 'Hold for Pool', color: 'border-amber-500 text-amber-800 bg-amber-50' },
                    { val: 'REJECT', label: 'Reject', color: 'border-rose-500 text-rose-800 bg-rose-50' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setHumanRecommendation(item.val)}
                      className={`rounded-lg border px-3 py-2 text-xs font-display font-bold transition-all cursor-pointer ${
                        humanRecommendation === item.val
                          ? `${item.color} ring-2 ring-black`
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {evalSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Evaluation report and human hiring decision saved to audit log!</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingEval}
                  className="rounded-lg bg-[#0F0F0F] px-6 py-2.5 text-xs font-display font-bold text-white hover:bg-[#FF3B30] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {savingEval ? 'Saving Decision...' : 'Submit Final Human Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: RESUME & EVIDENCE SNIPPETS */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-neutral-300/80 bg-white p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-display font-bold text-[#0F0F0F] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#FF3B30]" />
              <span>Extracted Evidence Snippets ({evidenceList.length})</span>
            </h3>
            <div className="space-y-2.5">
              {evidenceList.map(ev => (
                <div key={ev.id} className="rounded-lg bg-neutral-50 p-3 border border-neutral-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-neutral-600 font-mono">
                    <span className="font-bold text-[#0F0F0F]">{ev.section}</span>
                    <span>{ev.pageOrLine}</span>
                  </div>
                  <p className="text-neutral-800 font-mono italic bg-white p-2 rounded border border-neutral-200">
                    &ldquo;{ev.snippet}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300/80 bg-white p-6 space-y-3 shadow-xs">
            <h3 className="text-base font-display font-bold text-[#0F0F0F]">Raw Resume Text</h3>
            <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200 text-xs font-mono text-neutral-800 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {candidate.rawResumeText}
            </div>
          </div>
        </div>
      )}

      {/* Evidence Drawer Modal */}
      <EvidenceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mapping={selectedMapping || undefined}
        requirement={selectedReq || undefined}
        evidenceList={evidenceList}
      />

      {/* PRD §12 GDPR Right to Erasure / Anonymization Modal */}
      {isGdprModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-300 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-red-100 p-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-[#0F0F0F]">GDPR Right to Erasure</h3>
                  <p className="text-xs text-neutral-500 font-mono">Article 17 • Irreversible Candidate Anonymization</p>
                </div>
              </div>
              <button
                onClick={() => setIsGdprModalOpen(false)}
                className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-black cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-red-50 border border-red-200 p-3 space-y-1.5 text-xs text-red-900">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                <span>Notice of Permanent Data Purge</span>
              </p>
              <p className="text-neutral-700 leading-relaxed font-mono text-[11px]">
                Executing erasure will redact <strong>{candidate.name}</strong> ({candidate.email}). All contact numbers, resume text, and identifiable duplicate flags will be purged. Aggregated requirement coverage and audit metadata are retained in an anonymized state for compliance reporting.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-neutral-700 block">Erasure Justification / Audit Reason</label>
              <textarea
                rows={3}
                value={gdprReason}
                onChange={e => setGdprReason(e.target.value)}
                placeholder="Specify data subject request reference or retention policy rule..."
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-[#0F0F0F] font-mono focus:border-black focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setIsGdprModalOpen(false)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteGdprErasure}
                disabled={isAnonymizing}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-display font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isAnonymizing ? 'Purging PII...' : 'Confirm Permanent Erasure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
