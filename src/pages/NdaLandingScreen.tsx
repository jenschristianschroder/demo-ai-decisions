import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadTemplateCatalog, loadTemplateById } from '../lib/ndaDataLoader';
import { runNdaTemplateRecommendation, runNdaSingleStage } from '../lib/ndaAi';
import { NDA_TEMPLATE_CATALOG, DEFAULT_INTAKE, setNdaData } from '../data/mockNdaData';
import NdaTemplateRecommendationView from '../components/nda/NdaTemplateRecommendationView';
import NdaTemplateCatalogView from '../components/nda/NdaTemplateCatalogView';
import type { NdaProgressStep, NdaIntakeData, NdaTemplateRecommendation, NdaTemplateId } from '../types/nda';
import './NdaLandingScreen.css';

const NdaLandingScreen: React.FC = () => {
  const navigate = useNavigate();

  // Intake form state
  const [intake, setIntake] = useState<NdaIntakeData>(structuredClone(DEFAULT_INTAKE));

  // Recommendation state
  const [recommending, setRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState<NdaTemplateRecommendation | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<NdaTemplateId | null>(null);

  // Workflow state
  const [generating, setGenerating] = useState(false);
  const [progressSteps, setProgressSteps] = useState<NdaProgressStep[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Show catalog toggle
  const [showCatalog, setShowCatalog] = useState(false);

  const updateIntake = (field: keyof NdaIntakeData, value: string | number | null) => {
    setIntake((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectTemplate = (id: NdaTemplateId) => {
    setSelectedTemplateId(id);
    setIntake((prev) => ({ ...prev, selectedTemplateId: id }));
  };

  const handleRecommend = async () => {
    setRecommending(true);
    setRecommendation(null);
    setErrorMsg('');
    try {
      const catalogText = await loadTemplateCatalog();
      const result = await runNdaTemplateRecommendation(intake, catalogText, (step) => {
        setProgressSteps((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((s) => s.phase === step.phase);
          if (idx >= 0) { updated[idx] = step; return updated; }
          return [...updated, step];
        });
      });
      setRecommendation(result);
      setSelectedTemplateId(result.recommendedTemplateId);
      setIntake((prev) => ({ ...prev, selectedTemplateId: result.recommendedTemplateId }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Recommendation failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setRecommending(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId) return;
    setGenerating(true);
    setSuccessMsg('');
    setErrorMsg('');
    setProgressSteps([]);
    try {
      const templateText = await loadTemplateById(selectedTemplateId);

      // Stage 1: Template Selection
      const selectionOutput = await runNdaSingleStage(
        {
          stage: 'template-selection',
          intakeData: intake,
          templateId: selectedTemplateId,
          templateText,
        },
        (step) => {
          setProgressSteps((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((s) => s.phase === step.phase);
            if (idx >= 0) { updated[idx] = step; return updated; }
            return [...updated, step];
          });
        },
      );

      // Stage 2: Draft Generation
      const draftOutput = await runNdaSingleStage(
        {
          stage: 'draft-generation',
          intakeData: intake,
          templateId: selectedTemplateId,
          templateText,
          priorOutputs: { templateSelection: selectionOutput.templateSelection },
        },
        (step) => {
          setProgressSteps((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((s) => s.phase === step.phase);
            if (idx >= 0) { updated[idx] = step; return updated; }
            return [...updated, step];
          });
        },
      );

      setNdaData({
        scenario: {
          id: 'nda-generated-2026',
          title: `NDA — ${intake.counterpartyName}`,
          description: `AI-generated NDA using ${selectedTemplateId} template.`,
          status: 'draft-generated',
          intakeData: intake,
          agentOutputs: {
            templateRecommendation: recommendation ?? undefined,
            draft: draftOutput.draft as import('../types/nda').NdaDraft,
          },
          progressSteps: [],
        },
      });
      setSuccessMsg('NDA draft generated — view and advance through pipeline stages on the dashboard.');
      setTimeout(() => navigate('/nda/dashboard'), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Workflow failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setIntake(structuredClone(DEFAULT_INTAKE));
    setRecommendation(null);
    setSelectedTemplateId(null);
    setProgressSteps([]);
    setSuccessMsg('');
    setErrorMsg('');
    setShowCatalog(false);
  };

  return (
    <div className="nda-landing-root">
      <div className="nda-landing-card">
        <div className="nda-landing-badge">AI NDA Automation</div>

        <div className="nda-landing-header">
          <div className="nda-landing-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111111"/>
              <path d="M10 7H18L22 11V25H10V7Z" fill="white" opacity="0.9"/>
              <path d="M18 7V11H22" fill="none" stroke="white" strokeWidth="0.5"/>
              <circle cx="16" cy="18" r="3" fill="#111111" opacity="0.3"/>
              <path d="M16 16V20M14 18H18" stroke="#111111" strokeWidth="0.8" opacity="0.5"/>
            </svg>
          </div>
          <div className="nda-landing-title-block">
            <h1 className="nda-landing-title">AI NDA Automation</h1>
            <p className="nda-landing-subtitle">
              Select the right NDA template with AI-assisted recommendation, generate drafts, assess counterparty redlines, and route for approval — all powered by a 7-agent pipeline.
            </p>
          </div>
        </div>

        <div className="nda-landing-value-shift">
          <div className="nda-landing-shift-from">
            <div className="nda-landing-shift-label">From</div>
            <div className="nda-landing-shift-items">
              <span>Manual template selection</span>
              <span>One-size-fits-all NDAs</span>
              <span>Slow redline review</span>
              <span>Ad-hoc approval routing</span>
            </div>
          </div>
          <div className="nda-landing-shift-arrow">{'\u2192'}</div>
          <div className="nda-landing-shift-to">
            <div className="nda-landing-shift-label">To</div>
            <div className="nda-landing-shift-items">
              <span>AI-recommended template matching</span>
              <span>Purpose-specific NDA library</span>
              <span>Automated redline classification</span>
              <span>Playbook-grounded approval tiers</span>
            </div>
          </div>
        </div>

        <div className="nda-landing-features">
          <div className="nda-landing-feature">
            <span className="nda-landing-feature-icon">{'\uD83C\uDFAF'}</span>
            <div>
              <div className="nda-landing-feature-title">Smart Template Selection</div>
              <div className="nda-landing-feature-desc">AI recommends the best NDA template based on purpose, counterparty, and scope</div>
            </div>
          </div>
          <div className="nda-landing-feature">
            <span className="nda-landing-feature-icon">{'\uD83D\uDCCB'}</span>
            <div>
              <div className="nda-landing-feature-title">Automated Draft Generation</div>
              <div className="nda-landing-feature-desc">Fill templates with deal-specific data to produce ready-to-review NDA documents</div>
            </div>
          </div>
          <div className="nda-landing-feature">
            <span className="nda-landing-feature-icon">{'\u2696\uFE0F'}</span>
            <div>
              <div className="nda-landing-feature-title">Redline Assessment</div>
              <div className="nda-landing-feature-desc">Classify counterparty changes against the legal playbook with accept/reject/negotiate recommendations</div>
            </div>
          </div>
          <div className="nda-landing-feature">
            <span className="nda-landing-feature-icon">{'\u2705'}</span>
            <div>
              <div className="nda-landing-feature-title">Approval Routing</div>
              <div className="nda-landing-feature-desc">Automatically determine the correct approval tier based on escalation rules</div>
            </div>
          </div>
        </div>

        <div className="nda-landing-scenario">
          <div className="nda-landing-scenario-label">Demo Scenario</div>
          <div className="nda-landing-scenario-text">Technology Partnership NDA &middot; 7 agents &middot; Full workflow</div>
        </div>

        <div className="nda-landing-outcomes">
          <div className="nda-landing-outcomes-title">Agents Involved</div>
          <div className="nda-landing-outcomes-grid">
            <div className="nda-landing-outcome">
              <span className="nda-landing-outcome-metric">{'\uD83C\uDFAF'}</span>
              <span className="nda-landing-outcome-text">Template Recommender</span>
            </div>
            <div className="nda-landing-outcome">
              <span className="nda-landing-outcome-metric">{'\uD83C\uDFAF'}</span>
              <span className="nda-landing-outcome-text">Template Selector</span>
            </div>
            <div className="nda-landing-outcome">
              <span className="nda-landing-outcome-metric">{'\uD83D\uDCC4'}</span>
              <span className="nda-landing-outcome-text">Draft Generator</span>
            </div>
            <div className="nda-landing-outcome">
              <span className="nda-landing-outcome-metric">{'\uD83D\uDCC4'}</span>
              <span className="nda-landing-outcome-text">Redline Assessor</span>
            </div>
            <div className="nda-landing-outcome">
              <span className="nda-landing-outcome-metric">{'\u2696\uFE0F'}</span>
              <span className="nda-landing-outcome-text">Playbook Validator</span>
            </div>
            <div className="nda-landing-outcome">
              <span className="nda-landing-outcome-metric">{'\u2696\uFE0F'}</span>
              <span className="nda-landing-outcome-text">Approval Router</span>
            </div>
            <div className="nda-landing-outcome">
              <span className="nda-landing-outcome-metric">{'\uD83D\uDCE8'}</span>
              <span className="nda-landing-outcome-text">Dispatch</span>
            </div>
          </div>
        </div>

        {/* Intake Form */}
        <div className="nda-landing-generate">
          <div className="nda-landing-generate-label">NDA Intake</div>
          <p className="nda-landing-generate-hint">
            Fill in the details below and let the AI recommend the best NDA template, or browse the catalog to select manually.
          </p>

          <div className="nda-landing-form">
            <div className="nda-landing-form-row">
              <div className="nda-landing-form-group">
                <label>Counterparty Name</label>
                <input
                  type="text"
                  value={intake.counterpartyName}
                  onChange={(e) => updateIntake('counterpartyName', e.target.value)}
                />
              </div>
              <div className="nda-landing-form-group">
                <label>NDA Type Preference</label>
                <select
                  value={intake.ndaTypePreference}
                  onChange={(e) => updateIntake('ndaTypePreference', e.target.value)}
                >
                  <option value="not-sure">Not Sure</option>
                  <option value="mutual">Mutual</option>
                  <option value="one-way">One-Way</option>
                </select>
              </div>
            </div>

            <div className="nda-landing-form-group">
              <label>Purpose / Context</label>
              <textarea
                value={intake.purpose}
                onChange={(e) => updateIntake('purpose', e.target.value)}
                rows={3}
              />
            </div>

            <div className="nda-landing-form-group">
              <label>Scope of Disclosure</label>
              <textarea
                value={intake.scope}
                onChange={(e) => updateIntake('scope', e.target.value)}
                rows={2}
              />
            </div>

            <div className="nda-landing-form-row">
              <div className="nda-landing-form-group">
                <label>Term (months, optional)</label>
                <input
                  type="number"
                  value={intake.termMonths ?? ''}
                  onChange={(e) => updateIntake('termMonths', e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder="e.g., 24"
                />
              </div>
              <div className="nda-landing-form-group">
                <label>Jurisdiction</label>
                <input
                  type="text"
                  value={intake.jurisdiction}
                  onChange={(e) => updateIntake('jurisdiction', e.target.value)}
                  placeholder="e.g., New York, NY"
                />
              </div>
            </div>

            <div className="nda-landing-form-row">
              <div className="nda-landing-form-group">
                <label>Business Unit</label>
                <input
                  type="text"
                  value={intake.businessUnit}
                  onChange={(e) => updateIntake('businessUnit', e.target.value)}
                />
              </div>
              <div className="nda-landing-form-group">
                <label>Requester Role</label>
                <input
                  type="text"
                  value={intake.requesterRole}
                  onChange={(e) => updateIntake('requesterRole', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="nda-landing-generate-actions">
            <button
              className="nda-landing-btn-primary nda-landing-generate-btn"
              onClick={handleRecommend}
              disabled={recommending || generating}
            >
              {recommending ? 'Analyzing…' : 'Find the Right NDA'}
            </button>
            <button
              className="nda-landing-btn-secondary nda-landing-catalog-toggle"
              onClick={() => setShowCatalog(!showCatalog)}
            >
              {showCatalog ? 'Hide Catalog' : 'Browse Templates'}
            </button>
          </div>

          {/* Catalog browser */}
          {showCatalog && (
            <div className="nda-landing-catalog-panel">
              <NdaTemplateCatalogView
                catalog={NDA_TEMPLATE_CATALOG}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={handleSelectTemplate}
              />
            </div>
          )}

          {/* Recommendation panel */}
          {recommendation && (
            <div className="nda-landing-recommendation">
              <NdaTemplateRecommendationView
                recommendation={recommendation}
                catalog={NDA_TEMPLATE_CATALOG}
                onSelectTemplate={handleSelectTemplate}
                selectedTemplateId={selectedTemplateId}
              />
            </div>
          )}

          {/* Generate button */}
          {selectedTemplateId && (
            <div className="nda-landing-generate-actions" style={{ marginTop: 16 }}>
              <button
                className="nda-landing-btn-primary nda-landing-generate-btn"
                onClick={handleGenerate}
                disabled={generating || recommending}
              >
                {generating ? 'Generating Draft…' : 'Generate NDA Draft'}
              </button>
              <span className="nda-landing-selected-template">
                Template: {NDA_TEMPLATE_CATALOG.find(t => t.id === selectedTemplateId)?.name ?? selectedTemplateId}
              </span>
            </div>
          )}

          {/* Progress */}
          {progressSteps.length > 0 && (
            <div className="nda-landing-progress-list">
              {progressSteps.map((step) => (
                <div
                  key={step.phase}
                  className={`nda-landing-progress-step nda-landing-progress-${step.status}`}
                >
                  <span className="nda-landing-progress-icon">
                    {step.status === 'running' && <span className="nda-landing-spinner-sm" />}
                    {step.status === 'done' && '\u2713'}
                    {step.status === 'error' && '\u2717'}
                  </span>
                  <span className="nda-landing-progress-msg">{step.message}</span>
                </div>
              ))}
            </div>
          )}

          {successMsg && (
            <div className="nda-landing-generate-status nda-landing-generate-success">
              {'\u2713'} {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="nda-landing-generate-status nda-landing-generate-error">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="nda-landing-actions">
          <button className="nda-landing-btn-primary nda-landing-btn-launch" onClick={() => navigate('/nda/dashboard')}>
            Launch Demo
          </button>
          <button className="nda-landing-btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="nda-landing-footer">
          <span className="nda-landing-footer-tag">Azure AI Foundry</span>
          <span className="nda-landing-footer-sep">&middot;</span>
          <span className="nda-landing-footer-tag">React + TypeScript</span>
          <span className="nda-landing-footer-sep">&middot;</span>
          <span className="nda-landing-footer-tag">NDA Automation</span>
        </div>
      </div>
    </div>
  );
};

export default NdaLandingScreen;
