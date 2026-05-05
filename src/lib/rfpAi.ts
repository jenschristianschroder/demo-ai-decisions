// ---------------------------------------------------------------------------
// RFP Agent Orchestration — mock/deterministic path
//
// Runs 8 agent stages sequentially, parsing sample data files to produce
// structured outputs. No AI backend is required.
// ---------------------------------------------------------------------------

import type {
  RfpProgressStep,
  RfpAgentOutputs,
  RfpIntakeSummary,
  RfpRequirement,
  KnowledgeMatch,
  DraftAnswer,
  SmeQuestion,
  RiskItem,
  ComplianceRow,
  ComplianceResponseStatus,
  ResponseAssembly,
  RfpDemoData,
  RequirementCategory,
} from '../types/rfp';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Map the two-letter prefix after REQ- to a category name. */
const PREFIX_TO_CATEGORY: Record<string, string> = {
  PC: 'Product',
  VZ: 'Product',
  DI: 'Data Integration',
  SEC: 'Security',
  PRV: 'Privacy',
  IMP: 'Implementation',
  SLA: 'Support',
  LEG: 'Legal',
  PRC: 'Pricing',
  ACC: 'Accessibility',
  RPT: 'Reporting',
  DR: 'Data Residency',
  REF: 'Vendor References',
};

function categoryForPrefix(prefix: string): string {
  return PREFIX_TO_CATEGORY[prefix] ?? 'Product';
}

function lookupCategory(
  category: string,
  categories: RequirementCategory[],
): RequirementCategory | undefined {
  return categories.find(
    (c) => c.category.toLowerCase() === category.toLowerCase(),
  );
}

function subtractDays(dateStr: string, days: number): string {
  const m = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
  if (!m) return dateStr;
  const d = new Date(`${m[1]} ${m[2]}, ${m[3]}`);
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Agent 1 — Intake
// ---------------------------------------------------------------------------

function runIntakeAgent(rfpText: string): RfpIntakeSummary {
  const buyerMatch = rfpText.match(/^## (.+)/m);
  const buyerName = buyerMatch ? buyerMatch[1].trim() : 'Unknown Buyer';

  const rfpTitleMatch = rfpText.match(/^# (.+)/m);
  const rfpTitle = rfpTitleMatch ? rfpTitleMatch[1].trim() : 'Untitled RFP';

  const rfpNumberMatch = rfpText.match(/\*\*RFP Number:\*\*\s*(.+)/);
  const rfpNumber = rfpNumberMatch ? rfpNumberMatch[1].trim() : '';

  const deadlineMatch = rfpText.match(/\*\*Submission Deadline:\*\*\s*(.+)/);
  const deadline = deadlineMatch ? deadlineMatch[1].trim() : '';

  const submissionMatch = rfpText.match(/\*\*Submission Method:\*\*\s*(.+)/);
  const submissionMethod = submissionMatch ? submissionMatch[1].trim() : '';

  const contactMatch = rfpText.match(/\*\*Contact Person:\*\*\s*(.+)/);
  const contactPerson = contactMatch ? contactMatch[1].trim() : '';

  const emailMatch = rfpText.match(/\*\*Email:\*\*\s*(.+)/);
  const contactEmail = emailMatch ? emailMatch[1].trim() : '';

  // Extract required attachments
  const attachSection = rfpText.match(
    /### Required Attachments\n([\s\S]*?)(?=\n---|\n## )/,
  );
  const requiredAttachments: string[] = [];
  if (attachSection) {
    const lines = attachSection[1].split('\n');
    for (const line of lines) {
      const m = line.match(/^\d+\.\s+(.+)/);
      if (m) requiredAttachments.push(m[1].trim());
    }
  }

  // Extract evaluation criteria
  const evalCriteria: { criteria: string; weight: string }[] = [];
  const evalSection = rfpText.match(
    /## 3\. Evaluation Criteria[\s\S]*?\|[\s\S]*?\|[\s\S]*?\|([\s\S]*?)(?=\n---|\n## )/,
  );
  if (evalSection) {
    const rows = evalSection[1].split('\n').filter((l) => l.includes('|'));
    for (const row of rows) {
      const cells = row
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.length >= 2 && !cells[0].startsWith('---')) {
        evalCriteria.push({ criteria: cells[0], weight: cells[1] });
      }
    }
  }

  // Extract key dates
  const keyDates: { milestone: string; date: string }[] = [];
  const datesSection = rfpText.match(
    /## 16\. Key Dates[\s\S]*?\|[\s\S]*?\|[\s\S]*?\|([\s\S]*?)(?=\n---|\n## |$)/,
  );
  if (datesSection) {
    const rows = datesSection[1].split('\n').filter((l) => l.includes('|'));
    for (const row of rows) {
      const cells = row
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      if (cells.length >= 2 && !cells[0].startsWith('---')) {
        keyDates.push({ milestone: cells[0], date: cells[1] });
      }
    }
  }

  // Count requirements for the summary
  const reqCount = (rfpText.match(/REQ-[A-Z]+-\d+/g) ?? []).length;
  const categorySet = new Set(
    (rfpText.match(/REQ-([A-Z]+)-/g) ?? []).map((m) => m.replace('REQ-', '').replace('-', '')),
  );

  const openQuestions: string[] = [];
  if (!deadline) openQuestions.push('Submission deadline could not be parsed from the RFP.');
  if (requiredAttachments.length === 0)
    openQuestions.push('No required attachments section was found.');

  return {
    buyerName,
    rfpTitle,
    rfpNumber,
    deadline,
    submissionMethod,
    contactPerson,
    contactEmail,
    requiredAttachments,
    evaluationCriteria: evalCriteria,
    keyDates,
    summary: `Enterprise analytics RFP from ${buyerName} with ${reqCount} requirements across ${categorySet.size} categories. Submission deadline: ${deadline || 'N/A'}.`,
    openQuestions,
    reasoning: `Parsed the RFP document header, submission instructions, evaluation criteria table, and key dates schedule. Identified ${reqCount} requirements across ${categorySet.size} categories from the ${buyerName} RFP.`,
  };
}

// ---------------------------------------------------------------------------
// Agent 2 — Requirement Extraction
// ---------------------------------------------------------------------------

function runRequirementExtractionAgent(
  rfpText: string,
  categories: RequirementCategory[],
): RfpRequirement[] {
  const requirements: RfpRequirement[] = [];
  const regex = /- (REQ-([A-Z]+)-\d+):\s*(.+)/g;
  let match: RegExpExecArray | null;

  // Find which section each requirement belongs to by tracking section headings
  const lines = rfpText.split('\n');
  let currentSection = '';

  const sectionMap = new Map<string, string>();
  for (const line of lines) {
    const sectionMatch = line.match(/^##+ \d+(?:\.\d+)?\s+(.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
    }
    const reqIdMatch = line.match(/(REQ-[A-Z]+-\d+)/);
    if (reqIdMatch) {
      sectionMap.set(reqIdMatch[1], currentSection);
    }
  }

  while ((match = regex.exec(rfpText)) !== null) {
    const reqId = match[1];
    const prefix = match[2];
    const text = match[3].trim();
    const category = categoryForPrefix(prefix);
    const catEntry = lookupCategory(category, categories);
    const isOptional = text.includes('(Optional)');

    requirements.push({
      requirementId: reqId,
      sourceSection: sectionMap.get(reqId) ?? 'Unknown Section',
      requirementText: text,
      category,
      mandatory: !isOptional,
      owner: catEntry?.defaultOwner ?? 'Unassigned',
      riskLevel: (catEntry?.defaultRiskLevel?.toLowerCase() as RfpRequirement['riskLevel']) ?? 'medium',
      status: 'identified',
    });
  }

  return requirements;
}

// ---------------------------------------------------------------------------
// Agent 3 — Knowledge Retrieval
// ---------------------------------------------------------------------------

function runKnowledgeRetrievalAgent(
  requirements: RfpRequirement[],
  demoData: RfpDemoData,
): KnowledgeMatch[] {
  const matches: KnowledgeMatch[] = [];

  for (const req of requirements) {
    const matchedSources: string[] = [];
    let bestAnswer = '';
    let confidence: KnowledgeMatch['confidence'] = 'none';

    // Search approved answer library by category / keyword overlap
    for (const ans of demoData.approvedAnswers) {
      if (ans.category.toLowerCase() !== req.category.toLowerCase()) continue;
      // Check if the question pattern keywords appear in the requirement text
      const keywords = ans.questionPattern
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const reqLower = req.requirementText.toLowerCase();
      const hitCount = keywords.filter((kw) => reqLower.includes(kw)).length;
      if (hitCount >= 2 || (keywords.length > 0 && hitCount / keywords.length > 0.4)) {
        matchedSources.push(`approved-answer-library.csv (${ans.id})`);
        bestAnswer = ans.approvedAnswer;
        confidence = ans.approvalStatus === 'approved' ? 'high' : 'medium';
        break; // take first good match
      }
    }

    // Search knowledge files for relevant content by keyword matching
    if (confidence === 'none' || confidence === 'medium') {
      const reqWords = req.requirementText
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);
      for (const kf of demoData.knowledgeFiles) {
        const contentLower = kf.content.toLowerCase();
        const hits = reqWords.filter((w) => contentLower.includes(w)).length;
        if (hits >= 3) {
          matchedSources.push(kf.filename);
          if (confidence === 'none') confidence = 'low';
          if (!bestAnswer) {
            // Extract a relevant snippet (first paragraph mentioning a keyword)
            const paragraphs = kf.content.split(/\n\n/);
            for (const p of paragraphs) {
              const pLower = p.toLowerCase();
              if (reqWords.some((w) => pLower.includes(w)) && p.trim().length > 30) {
                bestAnswer = p.trim().slice(0, 300);
                break;
              }
            }
          }
        }
      }
    }

    const stalenessWarning =
      matchedSources.length > 0 && confidence === 'low'
        ? 'Matched content may not directly address this requirement; SME review recommended.'
        : undefined;

    const missingInformation =
      confidence === 'none'
        ? 'No matching content found in the approved answer library or knowledge base.'
        : undefined;

    matches.push({
      requirementId: req.requirementId,
      matchedSources,
      recommendedAnswerMaterial: bestAnswer,
      confidence,
      stalenessWarning,
      missingInformation,
    });
  }

  return matches;
}

// ---------------------------------------------------------------------------
// Agent 4 — Drafting
// ---------------------------------------------------------------------------

function runDraftingAgent(
  requirements: RfpRequirement[],
  knowledgeMatches: KnowledgeMatch[],
): DraftAnswer[] {
  const drafts: DraftAnswer[] = [];

  for (const req of requirements) {
    const km = knowledgeMatches.find((k) => k.requirementId === req.requirementId);
    if (!km || km.confidence === 'none') {
      drafts.push({
        requirementId: req.requirementId,
        draftAnswer: '',
        sourceFiles: [],
        confidence: 'low',
        needsSmeReview: true,
        reviewReason: 'No matching content found in knowledge base. SME input required to draft response.',
      });
      continue;
    }

    const needsReview = km.confidence === 'low' || req.riskLevel === 'high' || req.riskLevel === 'critical';
    const answerText = km.recommendedAnswerMaterial
      ? `Based on our approved response library: ${km.recommendedAnswerMaterial}`
      : 'Draft pending — source material identified but requires synthesis.';

    drafts.push({
      requirementId: req.requirementId,
      draftAnswer: answerText,
      sourceFiles: km.matchedSources,
      confidence: km.confidence === 'high' ? 'high' : km.confidence === 'medium' ? 'medium' : 'low',
      needsSmeReview: needsReview,
      reviewReason: needsReview
        ? `${km.confidence === 'low' ? 'Low confidence match' : 'High-risk category'} — SME review recommended before submission.`
        : undefined,
    });
  }

  return drafts;
}

// ---------------------------------------------------------------------------
// Agent 5 — SME Routing
// ---------------------------------------------------------------------------

function runSmeRoutingAgent(
  requirements: RfpRequirement[],
  draftAnswers: DraftAnswer[],
  knowledgeMatches: KnowledgeMatch[],
  demoData: RfpDemoData,
  deadline: string,
): SmeQuestion[] {
  const questions: SmeQuestion[] = [];
  let qIdx = 1;

  for (const req of requirements) {
    const draft = draftAnswers.find((d) => d.requirementId === req.requirementId);
    const km = knowledgeMatches.find((k) => k.requirementId === req.requirementId);
    if (!draft?.needsSmeReview) continue;

    // Find SME by matching category to function/expertise
    const sme = demoData.smeDirectory.find((s) => {
      const expertiseLower = s.expertise.toLowerCase();
      const funcLower = s.function.toLowerCase();
      const catLower = req.category.toLowerCase();
      return funcLower.includes(catLower) || expertiseLower.includes(catLower) || catLower.includes(funcLower);
    }) ?? demoData.smeDirectory[0]; // fallback to first SME

    if (!sme) continue;

    const slaHours = sme.responseSlaHours || 24;
    const neededBy = subtractDays(deadline, Math.ceil(slaHours / 24) + 7);

    const noMatch = km?.confidence === 'none';
    const questionText = noMatch
      ? `No approved answer exists for requirement ${req.requirementId}: "${req.requirementText}". Please provide a response or indicate if this requirement cannot be met.`
      : `Please review the drafted response for ${req.requirementId}: "${req.requirementText}". The draft is based on ${km?.matchedSources.join(', ') ?? 'general knowledge'} but confidence is ${km?.confidence ?? 'low'}. Please verify accuracy and completeness.`;

    questions.push({
      questionId: `SME-Q-${String(qIdx).padStart(3, '0')}`,
      requirementId: req.requirementId,
      assignedTo: sme.name,
      function: sme.function,
      question: questionText,
      neededBy,
      status: 'pending',
    });
    qIdx++;
  }

  return questions;
}

// ---------------------------------------------------------------------------
// Agent 6 — Risk Review
// ---------------------------------------------------------------------------

function runRiskReviewAgent(
  requirements: RfpRequirement[],
  draftAnswers: DraftAnswer[],
  demoData: RfpDemoData,
): RiskItem[] {
  const risks: RiskItem[] = [];
  let rIdx = 1;

  for (const req of requirements) {
    const reqTextLower = req.requirementText.toLowerCase();
    const draft = draftAnswers.find((d) => d.requirementId === req.requirementId);
    const combinedText = `${reqTextLower} ${(draft?.draftAnswer ?? '').toLowerCase()}`;

    for (const rule of demoData.riskRules) {
      // Check if the trigger pattern matches (case-insensitive keyword search)
      const triggerWords = rule.triggerPattern
        .toLowerCase()
        .split(/\s+or\s+|\s+and\s+|,/)
        .map((w) => w.trim())
        .filter(Boolean);
      const triggered = triggerWords.some((tw) => combinedText.includes(tw));

      if (triggered) {
        risks.push({
          riskId: `RISK-FOUND-${String(rIdx).padStart(3, '0')}`,
          requirementId: req.requirementId,
          riskArea: rule.riskArea,
          severity: rule.severity,
          trigger: rule.triggerPattern,
          reason: rule.reason,
          recommendedAction: rule.recommendedAction,
          requiredApprover: rule.requiredApprover,
          status: 'identified',
        });
        rIdx++;
      }
    }
  }

  return risks;
}

// ---------------------------------------------------------------------------
// Agent 7 — Compliance
// ---------------------------------------------------------------------------

function runComplianceAgent(
  requirements: RfpRequirement[],
  draftAnswers: DraftAnswer[],
  risks: RiskItem[],
): ComplianceRow[] {
  return requirements.map((req) => {
    const draft = draftAnswers.find((d) => d.requirementId === req.requirementId);
    const hasRisk = risks.some((r) => r.requirementId === req.requirementId);

    let responseStatus: ComplianceResponseStatus;
    let evidence: string;
    let nextAction: string;

    if (!draft || !draft.draftAnswer) {
      responseStatus = 'pending';
      evidence = 'No draft response available.';
      nextAction = 'Assign to SME for response drafting.';
    } else if (draft.needsSmeReview) {
      responseStatus = 'needs-review';
      evidence = `Draft prepared from: ${draft.sourceFiles.join(', ') || 'general knowledge'}. Pending SME review.`;
      nextAction = 'Await SME review and approval.';
    } else if (hasRisk) {
      responseStatus = 'partial';
      evidence = `Draft prepared but risk items identified. Sources: ${draft.sourceFiles.join(', ')}.`;
      nextAction = 'Address risk items before finalizing.';
    } else if (draft.confidence === 'high') {
      responseStatus = 'compliant';
      evidence = `Approved response from: ${draft.sourceFiles.join(', ')}.`;
      nextAction = 'Include in final submission.';
    } else {
      responseStatus = 'partial';
      evidence = `Draft with ${draft.confidence} confidence from: ${draft.sourceFiles.join(', ') || 'knowledge base'}.`;
      nextAction = 'Review and strengthen response before submission.';
    }

    return {
      requirementId: req.requirementId,
      requirement: req.requirementText,
      category: req.category,
      mandatory: req.mandatory,
      owner: req.owner,
      responseStatus,
      risk: req.riskLevel,
      evidence,
      nextAction,
    };
  });
}

// ---------------------------------------------------------------------------
// Agent 8 — Response Assembly
// ---------------------------------------------------------------------------

function runAssemblyAgent(
  intake: RfpIntakeSummary,
  requirements: RfpRequirement[],
  draftAnswers: DraftAnswer[],
  smeQuestions: SmeQuestion[],
  risks: RiskItem[],
  compliance: ComplianceRow[],
  demoData: RfpDemoData,
): ResponseAssembly {
  const compliantCount = compliance.filter((c) => c.responseStatus === 'compliant').length;
  const pendingCount = compliance.filter(
    (c) => c.responseStatus === 'pending' || c.responseStatus === 'needs-review',
  ).length;
  const mandatoryCount = requirements.filter((r) => r.mandatory).length;
  const highRiskCount = risks.filter((r) => r.severity === 'high' || r.severity === 'critical').length;

  const executiveSummary = [
    `Northstar Analytics is pleased to submit this response to the ${intake.rfpTitle} (${intake.rfpNumber}) issued by ${intake.buyerName}.`,
    `Our platform addresses ${compliantCount} of ${requirements.length} requirements with approved responses, with ${pendingCount} items pending SME review.`,
    `${mandatoryCount} mandatory requirements have been identified, and ${highRiskCount} high/critical risk items require executive attention before submission.`,
    `We bring extensive experience serving government and public sector clients, as evidenced by our reference implementations.`,
  ].join(' ');

  // Build response sections grouped by category
  const categoryGroups = new Map<string, DraftAnswer[]>();
  for (const draft of draftAnswers) {
    const req = requirements.find((r) => r.requirementId === draft.requirementId);
    const cat = req?.category ?? 'Other';
    const group = categoryGroups.get(cat) ?? [];
    group.push(draft);
    categoryGroups.set(cat, group);
  }

  const responseSections: { section: string; content: string }[] = [];
  for (const [category, drafts] of categoryGroups) {
    const answeredCount = drafts.filter((d) => d.draftAnswer).length;
    const content = `${answeredCount} of ${drafts.length} requirements in this category have draft responses prepared. ${
      drafts.some((d) => d.needsSmeReview)
        ? 'Some responses are pending SME review.'
        : 'All responses are approved.'
    }`;
    responseSections.push({ section: category, content });
  }

  const assumptions = [
    'All pricing will be based on the standard Northstar Analytics rate card unless otherwise negotiated.',
    'Implementation timeline assumes Acme provides test environment access within 2 weeks of contract signing.',
    'Data migration scope is limited to structured data sources identified during discovery.',
    'Security questionnaire responses are based on current SOC 2 Type II audit findings.',
  ];

  const openItems: string[] = [];
  if (smeQuestions.length > 0) {
    openItems.push(`${smeQuestions.length} SME questions pending response.`);
  }
  if (pendingCount > 0) {
    openItems.push(`${pendingCount} requirements need SME review or response drafting.`);
  }
  if (highRiskCount > 0) {
    openItems.push(`${highRiskCount} high/critical risk items require executive review.`);
  }

  const approvalNeeded: string[] = [];
  const approverSet = new Set(
    risks
      .filter((r) => r.severity === 'high' || r.severity === 'critical')
      .map((r) => r.requiredApprover),
  );
  for (const approver of approverSet) {
    const approverRisks = risks.filter(
      (r) => r.requiredApprover === approver && (r.severity === 'high' || r.severity === 'critical'),
    );
    approvalNeeded.push(
      `${approver}: ${approverRisks.length} risk item(s) — ${approverRisks.map((r) => r.riskArea).join(', ')}.`,
    );
  }

  const submissionChecklist = demoData.submissionChecklist.map((item) => ({
    item: item.item,
    status: item.defaultStatus,
    owner: item.owner,
  }));

  return {
    executiveSummary,
    responseSections,
    assumptions,
    openItems,
    approvalNeeded,
    submissionChecklist,
  };
}

// ---------------------------------------------------------------------------
// Main workflow orchestrator
// ---------------------------------------------------------------------------

export async function runRfpWorkflow(
  rfpText: string,
  demoData: RfpDemoData,
  onProgress: (step: RfpProgressStep) => void,
): Promise<RfpAgentOutputs> {
  // --- Agent 1: Intake ---
  onProgress({ phase: 'intake', status: 'running', message: 'Analyzing RFP document structure and metadata…' });
  await delay(350);
  const intake = runIntakeAgent(rfpText);
  onProgress({
    phase: 'intake',
    status: 'done',
    message: `Parsed RFP from ${intake.buyerName}. Deadline: ${intake.deadline || 'N/A'}.`,
    reasoning: intake.reasoning,
  });

  // --- Agent 2: Requirement Extraction ---
  onProgress({ phase: 'requirements', status: 'running', message: 'Extracting and categorizing requirements…' });
  await delay(400);
  const requirements = runRequirementExtractionAgent(rfpText, demoData.requirementCategories);
  const categorySet = new Set(requirements.map((r) => r.category));
  onProgress({
    phase: 'requirements',
    status: 'done',
    message: `Identified ${requirements.length} requirements across ${categorySet.size} categories from the ${intake.buyerName} RFP.`,
    reasoning: `Scanned the full RFP document for REQ- prefixed items. Categorized each requirement by its prefix code (e.g., PC→Product, SEC→Security). Cross-referenced requirement-categories.csv to assign default owners and risk levels. ${requirements.filter((r) => r.mandatory).length} mandatory and ${requirements.filter((r) => !r.mandatory).length} optional requirements found.`,
  });

  // --- Agent 3: Knowledge Retrieval ---
  onProgress({ phase: 'knowledge', status: 'running', message: 'Searching approved answer library and knowledge base…' });
  await delay(450);
  const knowledgeMatches = runKnowledgeRetrievalAgent(requirements, demoData);
  const highConfCount = knowledgeMatches.filter((k) => k.confidence === 'high').length;
  const matchedCount = knowledgeMatches.filter((k) => k.confidence !== 'none').length;
  onProgress({
    phase: 'knowledge',
    status: 'done',
    message: `Matched ${matchedCount} of ${requirements.length} requirements to approved answer library entries. ${highConfCount} high-confidence matches.`,
    reasoning: `Searched ${demoData.approvedAnswers.length} approved answers by category and keyword overlap. Scanned ${demoData.knowledgeFiles.length} knowledge base files for supplementary content. ${knowledgeMatches.filter((k) => k.confidence === 'none').length} requirements had no matching content.`,
  });

  // --- Agent 4: Drafting ---
  onProgress({ phase: 'drafting', status: 'running', message: 'Drafting responses from matched content…' });
  await delay(400);
  const draftAnswers = runDraftingAgent(requirements, knowledgeMatches);
  const draftedCount = draftAnswers.filter((d) => d.draftAnswer).length;
  const reviewCount = draftAnswers.filter((d) => d.needsSmeReview).length;
  onProgress({
    phase: 'drafting',
    status: 'done',
    message: `Drafted ${draftedCount} responses. ${reviewCount} flagged for SME review.`,
    reasoning: `Generated draft answers using approved answer library content and knowledge base materials. Responses with low confidence or in high-risk categories were flagged for subject matter expert review. ${draftAnswers.filter((d) => !d.draftAnswer).length} requirements could not be auto-drafted.`,
  });

  // --- Agent 5: SME Routing ---
  onProgress({ phase: 'sme-routing', status: 'running', message: 'Routing questions to subject matter experts…' });
  await delay(300);
  const smeQuestions = runSmeRoutingAgent(requirements, draftAnswers, knowledgeMatches, demoData, intake.deadline);
  const smeNames = new Set(smeQuestions.map((q) => q.assignedTo));
  onProgress({
    phase: 'sme-routing',
    status: 'done',
    message: `Routed ${smeQuestions.length} questions to ${smeNames.size} SMEs.`,
    reasoning: `Identified requirements needing SME input based on draft confidence and risk level. Matched SMEs from the directory by function and expertise area. Calculated needed-by dates based on submission deadline minus each SME's response SLA plus a 7-day buffer.`,
  });

  // --- Agent 6: Risk Review ---
  onProgress({ phase: 'risk-review', status: 'running', message: 'Scanning for contractual and compliance risks…' });
  await delay(350);
  const risks = runRiskReviewAgent(requirements, draftAnswers, demoData);
  const highRiskCount = risks.filter(
    (r) => r.severity === 'high' || r.severity === 'critical',
  ).length;
  const riskAreas = [...new Set(risks.map((r) => r.riskArea))];
  onProgress({
    phase: 'risk-review',
    status: 'done',
    message: `Flagged ${risks.length} risk items. ${highRiskCount} high/critical severity.`,
    reasoning: `Checked all ${requirements.length} requirements and draft responses against ${demoData.riskRules.length} risk rules. ${highRiskCount > 0 ? `Flagged ${highRiskCount} high-risk items including ${riskAreas.slice(0, 3).join(', ')}.` : 'No critical risk items found.'} Each risk includes a recommended action and required approver.`,
  });

  // --- Agent 7: Compliance ---
  onProgress({ phase: 'compliance', status: 'running', message: 'Building compliance matrix…' });
  await delay(300);
  const compliance = runComplianceAgent(requirements, draftAnswers, risks);
  const compliantCount = compliance.filter((c) => c.responseStatus === 'compliant').length;
  onProgress({
    phase: 'compliance',
    status: 'done',
    message: `Compliance matrix complete. ${compliantCount} of ${compliance.length} requirements fully compliant.`,
    reasoning: `Evaluated each requirement's response status based on draft availability, confidence level, and associated risks. ${compliance.filter((c) => c.responseStatus === 'pending').length} pending, ${compliance.filter((c) => c.responseStatus === 'needs-review').length} need review, ${compliance.filter((c) => c.responseStatus === 'partial').length} partial compliance.`,
  });

  // --- Agent 8: Response Assembly ---
  onProgress({ phase: 'assembly', status: 'running', message: 'Assembling final response package…' });
  await delay(500);
  const assembly = runAssemblyAgent(intake, requirements, draftAnswers, smeQuestions, risks, compliance, demoData);
  onProgress({
    phase: 'assembly',
    status: 'done',
    message: `Response package assembled. ${assembly.openItems.length} open items, ${assembly.approvalNeeded.length} approvals needed.`,
    reasoning: `Generated executive summary, compiled ${assembly.responseSections.length} response sections by category, documented ${assembly.assumptions.length} assumptions, and built submission checklist with ${assembly.submissionChecklist.length} items. ${assembly.openItems.length > 0 ? `Key open items: ${assembly.openItems[0]}` : 'No open items.'}`,
  });

  // --- Complete ---
  onProgress({ phase: 'complete', status: 'done', message: 'All agents complete. RFP response ready for review.' });

  return {
    intake,
    requirements,
    knowledgeMatches,
    draftAnswers,
    smeQuestions,
    risks,
    compliance,
    assembly,
  };
}
