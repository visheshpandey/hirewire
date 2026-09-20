import { 
  Requirement, 
  Candidate, 
  Evidence, 
  RequirementMapping, 
  CandidateSummary, 
  InterviewQuestion, 
  InterviewNote, 
  InterviewSummary, 
  EvaluationReport, 
  Role,
  RoleScoringConfig,
  AnswerDepthEvaluation,
  DuplicateCandidateRecord
} from './types';

export class AiEngine {
  /**
   * Extracts structured requirements from raw Job Description text.
   * Accurately categorizes type, detects Required vs Preferred, and extracts exact source snippet.
   */
  static extractRequirements(jdText: string): Omit<Requirement, 'id' | 'roleId'>[] {
    const lines = jdText.split('\n').map(l => l.trim()).filter(Boolean);
    const requirements: Omit<Requirement, 'id' | 'roleId'>[] = [];

    for (const line of lines) {
      const clean = line.replace(/^[-*•\d.)\s]+/, '').trim();
      if (!clean || clean.length < 15) continue;
      
      const lower = clean.toLowerCase();
      // Filter out headers/boilerplate
      if (lower.startsWith('about') || lower.startsWith('department') || lower.startsWith('role:') || lower.startsWith('location:')) {
        continue;
      }

      const isPreferred = lower.includes('preferred') || lower.includes('plus') || lower.includes('bonus') || lower.includes('nice to have');
      
      let type: Requirement['type'] = 'technical';
      if (lower.includes('years') || lower.includes('experience in') || lower.includes('track record')) {
        type = 'experience';
      } else if (lower.includes('degree') || lower.includes('bachelor') || lower.includes('master') || lower.includes('phd') || lower.includes('computer science')) {
        type = 'education';
      } else if (lower.includes('mentor') || lower.includes('lead') || lower.includes('communication') || lower.includes('collaborat')) {
        type = 'soft_skill';
      }

      requirements.push({
        description: clean,
        type,
        priority: isPreferred ? 'PREFERRED' : 'REQUIRED',
        sourceSnippet: clean,
        approved: false
      });
    }

    // Fallback default set if JD was too brief or unstructured
    if (requirements.length === 0) {
      requirements.push(
        {
          description: '5+ years of relevant domain and engineering experience',
          type: 'experience',
          priority: 'REQUIRED',
          sourceSnippet: jdText.substring(0, 80),
          approved: false
        },
        {
          description: 'Core technical competencies in relevant programming languages and frameworks',
          type: 'technical',
          priority: 'REQUIRED',
          sourceSnippet: jdText.substring(0, 80),
          approved: false
        }
      );
    }

    return requirements;
  }

  /**
   * Parses raw resume text into structured Candidate data and discrete verifiable Evidence records.
   */
  static parseResume(rawText: string, fileName: string = 'Resume.pdf'): {
    candidate: Omit<Candidate, 'id' | 'roleId' | 'createdAt'>;
    evidence: Omit<Evidence, 'id' | 'candidateId' | 'createdAt'>[];
  } {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const name = lines[0] || 'Unknown Candidate';
    
    // Email regex
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : `${name.toLowerCase().replace(/\s+/g, '.')}@candidate.io`;

    // Phone regex
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '+1 (555) 010-9988';

    // Current title
    let currentTitle = 'Senior Software Engineer';
    if (lines.length > 1 && lines[1].length < 60 && !lines[1].includes('@')) {
      currentTitle = lines[1];
    }

    // Extract skills
    const commonSkills = [
      'Go', 'Python', 'Java', 'Rust', 'TypeScript', 'JavaScript', 'C++', 'Kubernetes',
      'Docker', 'AWS', 'GCP', 'Azure', 'Kafka', 'RabbitMQ', 'PostgreSQL', 'MySQL',
      'Redis', 'GraphQL', 'gRPC', 'Distributed Systems', 'Microservices', 'Next.js', 'React'
    ];
    const detectedSkills = commonSkills.filter(skill => 
      new RegExp(`\\b${skill}\\b`, 'i').test(rawText)
    );

    // Calculate approx years
    const yearMatches = rawText.match(/\b(19\d\d|20\d\d)\b/g);
    let experienceYears = 5.0;
    if (yearMatches && yearMatches.length >= 2) {
      const years = yearMatches.map(Number).sort((a, b) => a - b);
      const diff = years[years.length - 1] - years[0];
      if (diff > 0 && diff < 35) experienceYears = diff;
    }

    // Extract discrete evidence snippets
    const evidence: Omit<Evidence, 'id' | 'candidateId' | 'createdAt'>[] = [];
    let currentSection = 'General Profile';

    lines.forEach((line, index) => {
      const upper = line.toUpperCase();
      if (upper.includes('EXPERIENCE') || upper.includes('WORK HISTORY')) {
        currentSection = 'Work Experience';
      } else if (upper.includes('EDUCATION')) {
        currentSection = 'Education';
      } else if (upper.includes('PROJECTS')) {
        currentSection = 'Projects';
      } else if (upper.includes('SKILLS')) {
        currentSection = 'Skills';
      } else if (line.startsWith('-') || line.startsWith('•') || line.length > 35) {
        const cleanSnippet = line.replace(/^[-*•\s]+/, '').trim();
        if (cleanSnippet.length > 25) {
          evidence.push({
            sourceDoc: fileName,
            section: currentSection,
            snippet: cleanSnippet,
            pageOrLine: `Line ${index + 1}`
          });
        }
      }
    });

    return {
      candidate: {
        name,
        email,
        phone,
        currentTitle,
        experienceYears,
        skills: detectedSkills.length ? detectedSkills : ['Distributed Systems', 'Backend Engineering'],
        rawResumeText: rawText,
        status: 'SCREENING',
        groups: ['Screening Pool']
      },
      evidence: evidence.slice(0, 15) // Top discrete evidence units
    };
  }

  /**
   * Matches candidate evidence against requirements.
   * Produces statuses: SUPPORTED, PARTIALLY_SUPPORTED, NOT_FOUND, UNCLEAR, NOT_APPLICABLE.
   * Strictly enforces that "NOT_FOUND" must not be inferred as lacking the skill.
   */
  static mapRequirements(
    candidate: Candidate,
    requirements: Requirement[],
    evidence: Evidence[]
  ): Omit<RequirementMapping, 'id' | 'updatedAt'>[] {
    return requirements.map(req => {
      const reqLower = req.description.toLowerCase();
      const keywords = reqLower
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['years', 'building', 'experience', 'strong', 'preferred', 'required'].includes(w));

      // Find matching evidence snippets
      const matchingEvidence = evidence.filter(ev => {
        const snipLower = ev.snippet.toLowerCase();
        return keywords.some(k => snipLower.includes(k));
      });

      const fullResumeLower = candidate.rawResumeText.toLowerCase();
      const resumeMention = keywords.filter(k => fullResumeLower.includes(k));

      let status: RequirementMapping['status'] = 'NOT_FOUND';
      let confidence = 50;
      let reasoning = `No direct documentary evidence found in uploaded resume. Note: Under PRD guidelines, "Not Found" does NOT indicate the candidate lacks this capability, but marks it for interview validation.`;

      if (matchingEvidence.length >= 2 || (matchingEvidence.length >= 1 && resumeMention.length >= 2)) {
        status = 'SUPPORTED';
        confidence = Math.min(95, 80 + matchingEvidence.length * 5);
        reasoning = `Direct explicit evidence found in candidate ${matchingEvidence[0].section}. Documented operational exposure directly supports this requirement.`;
      } else if (matchingEvidence.length === 1 || resumeMention.length >= 1) {
        status = 'PARTIALLY_SUPPORTED';
        confidence = 72;
        reasoning = `Partial or related experience detected in candidate records. Direct depth and scale remain to be verified in technical interview.`;
      } else if (req.type === 'education' && (fullResumeLower.includes('degree') || fullResumeLower.includes('university') || fullResumeLower.includes('bachelor'))) {
        status = 'UNCLEAR';
        confidence = 65;
        reasoning = `Candidate possesses academic credentials, but exact specialization alignment requires clarification.`;
      }

      return {
        candidateId: candidate.id,
        requirementId: req.id,
        status,
        confidence,
        aiReasoning: reasoning,
        evidenceIds: matchingEvidence.map(e => e.id)
      };
    });
  }

  /**
   * Generates candidate intelligence summary.
   */
  static generateCandidateSummary(
    candidate: Candidate,
    requirements: Requirement[],
    mappings: RequirementMapping[],
    evidence: Evidence[]
  ): CandidateSummary {
    const supportedCount = mappings.filter(m => m.status === 'SUPPORTED').length;
    const totalCount = requirements.length;
    const ratio = Math.round((supportedCount / Math.max(1, totalCount)) * 100);

    const relevantExp = evidence
      .filter(e => e.section.includes('Experience'))
      .slice(0, 3)
      .map(e => e.snippet);

    const unclearMappings = mappings.filter(m => m.status === 'UNCLEAR' || m.status === 'PARTIALLY_SUPPORTED');
    const notFoundMappings = mappings.filter(m => m.status === 'NOT_FOUND');

    return {
      candidateId: candidate.id,
      overview: `${candidate.name} is a ${candidate.currentTitle} with approximately ${candidate.experienceYears} years of engineering experience. Demonstrated skills in ${candidate.skills.slice(0, 4).join(', ')}.`,
      relevantExperience: relevantExp.length ? relevantExp : [
        `${candidate.currentTitle} with demonstrated domain expertise.`,
        `Extensive hands-on background working in modern engineering teams.`
      ],
      keySkills: candidate.skills,
      roleAlignment: `Candidate aligns with ${supportedCount} of ${totalCount} identified role requirements (${ratio}% initial coverage based solely on resume documentation).`,
      unclearInfo: unclearMappings.map(m => {
        const r = requirements.find(req => req.id === m.requirementId);
        return `Depth in "${r?.description.substring(0, 60)}..." requires clarification.`;
      }),
      validationAreas: notFoundMappings.map(m => {
        const r = requirements.find(req => req.id === m.requirementId);
        return `Confirm background in: ${r?.description.substring(0, 60)}...`;
      }),
      interviewFocusAreas: [
        'Architecture trade-offs and handling transient failure scenarios',
        'Direct validation of unmentioned or partially supported requirement areas',
        'Cross-functional leadership, mentorship style, and conflict resolution'
      ]
    };
  }

  /**
   * Generates structured interview questions according to PRD Section 14:
   * Area -> Primary Question -> Evidence to Look For -> Follow-up Question -> Requirement Being Validated
   */
  static generateInterviewQuestions(
    candidate: Candidate,
    requirements: Requirement[],
    mappings: RequirementMapping[]
  ): Omit<InterviewQuestion, 'id' | 'interviewId'>[] {
    const questions: Omit<InterviewQuestion, 'id' | 'interviewId'>[] = [];

    // Prioritize requirements that are UNCLEAR, NOT_FOUND, or PARTIALLY_SUPPORTED, then high-priority REQUIRED
    const prioritizedReqs = [...requirements].sort((a, b) => {
      const mapA = mappings.find(m => m.requirementId === a.id);
      const mapB = mappings.find(m => m.requirementId === b.id);
      if (mapA?.status !== 'SUPPORTED' && mapB?.status === 'SUPPORTED') return -1;
      if (mapA?.status === 'SUPPORTED' && mapB?.status !== 'SUPPORTED') return 1;
      return a.priority === 'REQUIRED' ? -1 : 1;
    });

    for (const req of prioritizedReqs.slice(0, 5)) {
      const map = mappings.find(m => m.requirementId === req.id);
      const isSupported = map?.status === 'SUPPORTED';

      if (req.type === 'technical' || req.type === 'experience') {
        questions.push({
          area: req.description.length > 40 ? req.description.substring(0, 40) + '...' : req.description,
          primaryQuestion: isSupported
            ? `In your recent work related to "${req.description.substring(0, 50)}", what was the most difficult architectural bottleneck or edge case you personally debugged?`
            : `Our role requires hands-on capability in "${req.description.substring(0, 50)}". Could you describe a production project where you applied this, or how your related experience translates?`,
          evidenceToLookFor: `Concrete design decisions, operational metric improvements (latency, error rates, throughput), and handling distributed failure modes.`,
          followUpQuestion: `What specific trade-offs did you evaluate between consistency, complexity, and operational overhead during this implementation?`,
          requirementId: req.id
        });
      } else if (req.type === 'soft_skill') {
        questions.push({
          area: 'Leadership & Engineering Collaboration',
          primaryQuestion: `Describe a situation where you had a deep architectural disagreement with another senior team member. How did you resolve it and establish consensus?`,
          evidenceToLookFor: `Objective benchmarking, written RFC documentation, respect for colleagues, and focus on business/technical outcomes.`,
          followUpQuestion: `Looking back, would you make the same architectural trade-off today, and what did that experience teach you about team alignment?`,
          requirementId: req.id
        });
      } else {
        questions.push({
          area: req.description.substring(0, 35),
          primaryQuestion: `How has your formal educational or research background in computer science informed your engineering intuition for system design?`,
          evidenceToLookFor: `Understanding of algorithmic complexity, data structure fundamentals, and distributed network boundaries.`,
          followUpQuestion: `Can you give an example where theoretical algorithmic trade-offs directly dictated a practical production implementation?`,
          requirementId: req.id
        });
      }
    }

    return questions;
  }

  /**
   * Generates dynamic follow-up questions on the fly based on current candidate answer or vagueness.
   */
  static generateDynamicFollowup(area: string, currentQuestion: string, candidateNotes: string): string {
    const lower = candidateNotes.toLowerCase();
    if (lower.includes('distributed') || lower.includes('microservices') || lower.includes('cluster')) {
      return `When network partitions or split-brain scenarios occur in that setup, how did your services guarantee state consistency and prevent data corruption?`;
    }
    if (lower.includes('migration') || lower.includes('database') || lower.includes('data')) {
      return `How did you validate data fidelity between the old and new systems during the rollout, and what was your exact rollback trigger?`;
    }
    if (candidateNotes.length < 50) {
      return `Could you drill deeper into your specific individual contribution versus the wider team's deliverables on that project?`;
    }
    return `What were the key failure modes you monitored for, and what telemetry metrics indicated the system was healthy under maximum load?`;
  }

  /**
   * Synthesizes Natural Language Search results with transparent evidence citations.
   */
  static searchCandidates(
    query: string,
    candidates: Candidate[],
    evidence: Evidence[],
    requirements: Requirement[]
  ): {
    candidate: Candidate;
    matchScore: number;
    reason: string;
    matchedEvidence: Evidence[];
  }[] {
    const qLower = query.toLowerCase();
    const queryTokens = qLower
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2 && !['show', 'candidates', 'with', 'and', 'for', 'experience', 'having'].includes(t));

    const results = candidates.map(cand => {
      const candEvidence = evidence.filter(e => e.candidateId === cand.id);
      const matchedEv: Evidence[] = [];
      let tokenMatches = 0;

      queryTokens.forEach(token => {
        // Match in skills
        const skillMatch = cand.skills.some(s => s.toLowerCase().includes(token));
        if (skillMatch) tokenMatches += 2;

        // Match in evidence
        const evMatches = candEvidence.filter(e => e.snippet.toLowerCase().includes(token));
        if (evMatches.length > 0) {
          tokenMatches += evMatches.length * 2;
          evMatches.forEach(em => {
            if (!matchedEv.some(item => item.id === em.id)) matchedEv.push(em);
          });
        }

        // Match in resume text
        if (cand.rawResumeText.toLowerCase().includes(token)) {
          tokenMatches += 1;
        }
      });

      const matchScore = Math.min(99, Math.max(10, Math.round((tokenMatches / Math.max(1, queryTokens.length * 3)) * 100)));
      
      const reason = matchedEv.length > 0
        ? `Direct evidence found in candidate ${matchedEv[0].section}: "${matchedEv[0].snippet.substring(0, 75)}..."`
        : `Profile matches query keywords (${cand.skills.slice(0, 3).join(', ')}).`;

      return {
        candidate: cand,
        matchScore,
        reason,
        matchedEvidence: matchedEv.slice(0, 3)
      };
    });

    return results
      .filter(r => r.matchScore > 20 || queryTokens.length === 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Computes dynamic, recruiter-weighted match scores and tier placements (Second PRD §6.1).
   * Incorporates adjustable Must-Have vs Nice-To-Have weight ratio and individual priority multipliers.
   */
  static computeWeightedMatchScore(
    candidate: Candidate,
    requirements: Requirement[],
    mappings: RequirementMapping[],
    config?: RoleScoringConfig
  ): {
    score: number;
    tier: 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'NOT_ALIGNED';
    mustHaveScore: number;
    niceToHaveScore: number;
  } {
    if (requirements.length === 0) {
      return { score: 75, tier: 'PARTIAL_MATCH', mustHaveScore: 75, niceToHaveScore: 75 };
    }

    const mustHaveWeight = config?.mustHaveWeight ?? 70;
    const niceToHaveWeight = config?.niceToHaveWeight ?? 30;
    const multipliers = config?.customMultipliers ?? {};

    const mustHaves = requirements.filter(r => r.priority === 'REQUIRED');
    const niceToHaves = requirements.filter(r => r.priority === 'PREFERRED');

    const scoreForGroup = (reqs: Requirement[]) => {
      if (reqs.length === 0) return 100;
      let totalWeight = 0;
      let earnedWeight = 0;

      reqs.forEach(req => {
        const mult = multipliers[req.id] ?? 1.0;
        totalWeight += mult;

        const m = mappings.find(map => map.requirementId === req.id);
        const status = m?.humanOverride || m?.status;

        if (status === 'SUPPORTED') {
          earnedWeight += 1.0 * mult;
        } else if (status === 'PARTIALLY_SUPPORTED') {
          earnedWeight += 0.5 * mult;
        } else if (status === 'UNCLEAR') {
          earnedWeight += 0.25 * mult;
        }
      });

      return totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 100;
    };

    const mustHaveScore = Math.round(scoreForGroup(mustHaves));
    const niceToHaveScore = Math.round(scoreForGroup(niceToHaves));

    const finalScore = Math.min(
      99,
      Math.max(
        15,
        Math.round((mustHaveScore * (mustHaveWeight / 100)) + (niceToHaveScore * (niceToHaveWeight / 100)))
      )
    );

    let tier: 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'NOT_ALIGNED' = 'PARTIAL_MATCH';
    if (finalScore >= 80 && mustHaveScore >= 70) {
      tier = 'STRONG_MATCH';
    } else if (finalScore < 60 || mustHaveScore < 45) {
      tier = 'NOT_ALIGNED';
    }

    return {
      score: finalScore,
      tier,
      mustHaveScore,
      niceToHaveScore
    };
  }

  /**
   * Real-time adaptive evaluation of candidate interview answers (Second PRD §7.2).
   * Analyzes depth, metrics, trade-offs, and inconsistency with resume claims.
   */
  static evaluateAnswerDepth(
    questionText: string,
    answerText: string,
    resumeEvidenceSnippet?: string
  ): AnswerDepthEvaluation {
    const text = (answerText || '').trim();
    if (!text || text.length < 20) {
      return {
        answerQuality: 'SHALLOW',
        score: 25,
        reasoning: 'Candidate response is too brief or ambiguous to substantiate the target competency.',
        detectedFlags: ['Insufficient technical depth', 'Missing architectural rationale'],
        suggestedProbes: [
          'Can you walk me through the specific architectural trade-offs you considered for this decision?',
          'What concrete metrics or operational indicators demonstrated that this approach succeeded?'
        ]
      };
    }

    const lower = text.toLowerCase();
    const hasNumbers = /\d+/.test(text);
    const hasTradeoffs = lower.includes('trade-off') || lower.includes('alternative') || lower.includes('instead of') || lower.includes('bottleneck') || lower.includes('latency') || lower.includes('scale') || lower.includes('cost');
    const hasConcreteTech = lower.includes('kafka') || lower.includes('kubernetes') || lower.includes('distributed') || lower.includes('postgres') || lower.includes('cache') || lower.includes('protocol') || lower.includes('concurrency');

    // Contradiction detection with resume evidence
    if (resumeEvidenceSnippet && lower.includes('never worked with') && resumeEvidenceSnippet.length > 20) {
      return {
        answerQuality: 'CONTRADICTORY',
        score: 40,
        reasoning: 'Verbal response contradicts explicit portfolio/resume claim: candidate expressed unfamiliarity while resume cited lead implementation.',
        detectedFlags: ['Resume evidence discrepancy', 'Unverified portfolio claim'],
        suggestedProbes: [
          `Your resume mentions: "${resumeEvidenceSnippet.substring(0, 60)}..." — could you clarify the discrepancy between that claim and your current role?`,
          'What was your exact direct contribution versus the broader team scope on that initiative?'
        ]
      };
    }

    if (text.length > 100 && (hasNumbers || hasTradeoffs) && hasConcreteTech) {
      return {
        answerQuality: 'STRONG',
        score: 92,
        reasoning: 'Well-articulated technical response with explicit production metrics and trade-off justification.',
        detectedFlags: [],
        suggestedProbes: [
          'If this system experienced a 10x traffic surge tomorrow, which subsystem would fail first and how would you redesign it?',
          'How did you manage failure modes and graceful degradation across dependent microservices?'
        ]
      };
    }

    // Default: Shallow / Surface level
    return {
      answerQuality: 'SHALLOW',
      score: 55,
      reasoning: 'Answer provides high-level conceptual explanation but lacks quantified impact, specific failure-mode handling, or architectural constraints.',
      detectedFlags: ['Lacks quantifiable business/technical metrics', 'Broad high-level generalities'],
      suggestedProbes: [
        'Could you quantify the latency or throughput impact of this optimization?',
        'What was the most significant failure mode you encountered, and how did you resolve it under pressure?'
      ]
    };
  }
}

