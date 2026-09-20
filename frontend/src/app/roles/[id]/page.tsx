'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Briefcase, 
  Users, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Upload, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  Check, 
  Clock,
  ArrowLeft,
  Sliders
} from 'lucide-react';
import { Role, Requirement, Candidate, RoleScoringConfig } from '@/lib/types';
import { ScoringWeightModal } from '@/components/modals/ScoringWeightModal';

export default function RoleWorkspace() {
  const params = useParams();
  const roleId = params?.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState<'requirements' | 'candidates' | 'upload' | 'jd'>('requirements');
  const [loading, setLoading] = useState(true);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [scoringConfig, setScoringConfig] = useState<RoleScoringConfig | undefined>(undefined);

  // Resume upload state
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('Candidate_Resume.pdf');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (roleId) {
      loadRoleData();
    }
  }, [roleId]);

  const loadRoleData = async () => {
    try {
      setLoading(true);
      const [rRes, reqRes, cRes, scRes] = await Promise.all([
        fetch(`/api/roles/${roleId}`),
        fetch(`/api/roles/${roleId}/requirements`),
        fetch(`/api/candidates?roleId=${roleId}`),
        fetch(`/api/roles/${roleId}/scoring-config`)
      ]);

      const rData = await rRes.json();
      const reqData = await reqRes.json();
      const cData = await cRes.json();
      const scData = await scRes.json();

      setRole(rData.role || null);
      setRequirements(reqData.requirements || []);
      setCandidates(cData.candidates || []);
      setScoringConfig(scData.config || undefined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApprove = async (requirementId: string) => {
    try {
      const res = await fetch(`/api/roles/${roleId}/requirements`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementId })
      });

      if (res.ok) {
        const data = await res.json();
        setRequirements(prev => prev.map(r => r.id === requirementId ? data.requirement : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText) return;

    try {
      setUploading(true);
      setUploadSuccess(null);
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          resumeText,
          fileName
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUploadSuccess(`Successfully screened and mapped evidence for ${data.candidate.name}!`);
        setResumeText('');
        await loadRoleData();
        setActiveTab('candidates');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const loadSampleResume = () => {
    setFileName('Devin_Kowalski_Resume.pdf');
    setResumeText(`DEVIN KOWALSKI
Senior Infrastructure & Backend Engineer
devin.k@infrastructurelab.org | Seattle, WA

SUMMARY
8 years designing robust distributed systems, microservices in Go and Rust, and high-concurrency message pipelines.

EXPERIENCE
AeroCloud Technologies | Senior Backend Infrastructure Engineer
2021 – Present (3.5 years)
- Built multi-region distributed cache invalidation mesh in Go handling 90,000 requests/sec.
- Deployed and operated Apache Kafka event streaming clusters across 12 nodes on AWS EKS.
- Architected distributed saga transactions for ledger balance adjustments using idempotent PostgreSQL outbox pattern.
- Mentored 4 mid-level developers and authored technical runbooks.

DataGrid Networks | Backend Systems Engineer
2018 – 2021 (3 years)
- Managed Kubernetes clusters with Docker containers for 25 microservices on AWS.
- Configured PostgreSQL read-replicas and Redis caching layers.

EDUCATION
B.S. in Computer Science, University of Washington, 2018`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0F0F0F] border-t-transparent" />
        <p className="text-sm font-mono text-neutral-500">Loading Role Workspace...</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="py-12 text-center text-neutral-500">
        <p>Role not found.</p>
        <Link href="/roles" className="mt-4 text-[#0F0F0F] underline font-bold inline-block">Back to Roles</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
        <Link href="/roles" className="hover:text-black flex items-center gap-1 font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>ROLES</span>
        </Link>
        <span>/</span>
        <span className="text-[#0F0F0F] font-bold">{role.title}</span>
      </div>

      {/* Role Workspace Header (Clean White Executive Card) */}
      <div className="rounded-xl border border-neutral-300/80 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-[#0F0F0F]">{role.title}</h1>
              <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-neutral-800">
                {role.status}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono">
              {role.department} • {role.location} • Created {new Date(role.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] px-4 py-2 text-xs font-display font-bold text-white hover:bg-[#FF3B30] transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Screen Resume (AI)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 gap-6 pt-2">
          <button
            onClick={() => setActiveTab('requirements')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'requirements'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>Requirements ({requirements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'candidates'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Candidates ({candidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Screen Resume (AI)</span>
          </button>

          <button
            onClick={() => setActiveTab('jd')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'jd'
                ? 'border-black text-[#0F0F0F]'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Job Description</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Structured Requirements */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-bold text-[#0F0F0F]">AI-Extracted Role Requirements</h2>
              <p className="text-xs text-neutral-500">
                Discrete criteria extracted from JD with exact source citations. Recruiters can approve/reject criteria.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsScoringModalOpen(true)}
                className="px-3 py-1 bg-white hover:bg-neutral-100 text-[#0F0F0F] border border-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Calibrate must-have vs nice-to-have weights (Second PRD §6.1)"
              >
                <Sliders className="w-3.5 h-3.5 text-[#FF3B30]" />
                <span>Weights: {scoringConfig?.mustHaveWeight ?? 70}% / {scoringConfig?.niceToHaveWeight ?? 30}%</span>
              </button>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-300 font-semibold">
                {requirements.filter(r => r.approved).length} of {requirements.length} Approved
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {requirements.map((req, idx) => (
              <div 
                key={req.id}
                className="rounded-xl border border-neutral-300/80 bg-white p-4.5 hover:border-black transition-all shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-mono font-bold text-neutral-800 border border-neutral-200">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#0F0F0F]">{req.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          req.priority === 'REQUIRED'
                            ? 'bg-[#0F0F0F] text-white border-black'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                        }`}>
                          {req.priority}
                        </span>
                        <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-600 font-mono capitalize">
                          {req.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleApprove(req.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      req.approved
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:text-black hover:bg-neutral-200'
                    }`}
                  >
                    {req.approved ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Approved</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5" />
                        <span>Pending Review</span>
                      </>
                    )}
                  </button>
                </div>

                {req.sourceSnippet && (
                  <div className="rounded-lg bg-neutral-50 p-2.5 text-xs text-neutral-700 border border-neutral-200 font-mono">
                    <span className="text-neutral-500 font-semibold">JD Source: </span>
                    &ldquo;{req.sourceSnippet}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Candidate Pool */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-display font-bold text-[#0F0F0F]">Candidates for this Role ({candidates.length})</h2>
              <p className="text-xs text-neutral-500">
                Screened against role requirements with traceable evidence snippets.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('upload')}
              className="text-xs font-bold text-[#0F0F0F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Candidate</span>
            </button>
          </div>

          <div className="space-y-3">
            {candidates.map(cand => (
              <div 
                key={cand.id}
                className="rounded-xl border border-neutral-300/80 bg-white p-4.5 hover:border-black transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-[#0F0F0F]">{cand.name}</h3>
                    <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-800">
                      {cand.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{cand.currentTitle}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {cand.skills?.slice(0, 4).map((s, i) => (
                      <span key={i} className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-700 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/candidates/${cand.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] hover:bg-[#FF3B30] px-4 py-2 text-xs font-display font-bold text-white transition-colors shadow-2xs"
                  >
                    <span>Candidate Workspace</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Resume Uploader & AI Screening */}
      {activeTab === 'upload' && (
        <div className="rounded-xl border border-neutral-300/80 bg-white p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-4 gap-3">
            <div>
              <h3 className="text-base font-display font-bold text-[#0F0F0F] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF3B30]" />
                <span>AI Candidate Screening & Evidence Extraction</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Paste resume text or load a sample candidate to instantly extract structured evidence mapped against role criteria.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSampleResume}
              className="rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-xs font-mono font-bold text-neutral-800 transition-colors cursor-pointer"
            >
              Load Sample Resume
            </button>
          </div>

          {uploadSuccess && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <form onSubmit={handleResumeSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Document Label / File Name</label>
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-[#0F0F0F] focus:border-black focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Resume Content (Paste raw text)</label>
              <textarea
                rows={10}
                required
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste candidate resume text here..."
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-800 font-mono placeholder-neutral-400 focus:border-black focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading || !resumeText}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F0F0F] hover:bg-[#FF3B30] px-5 py-2.5 text-xs font-display font-bold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                <span>{uploading ? 'Extracting & Mapping Evidence...' : 'Screen Candidate & Map Requirements'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Raw Job Description */}
      {activeTab === 'jd' && (
        <div className="rounded-xl border border-neutral-300/80 bg-white p-6 space-y-3 shadow-xs">
          <h3 className="text-base font-display font-bold text-[#0F0F0F]">Full Job Description</h3>
          <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-200 text-xs font-mono text-neutral-800 whitespace-pre-wrap leading-relaxed">
            {role.rawJd}
          </div>
        </div>
      )}

      {/* Scoring Weights Modal (Second PRD §6.1) */}
      <ScoringWeightModal
        roleId={roleId}
        requirements={requirements}
        currentConfig={scoringConfig}
        isOpen={isScoringModalOpen}
        onClose={() => setIsScoringModalOpen(false)}
        onSaved={loadRoleData}
      />
    </div>
  );
}
