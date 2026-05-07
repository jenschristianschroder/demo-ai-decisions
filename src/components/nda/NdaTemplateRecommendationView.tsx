import React from 'react';
import type { NdaTemplateRecommendation, NdaTemplateSummary, NdaTemplateId } from '../../types/nda';

interface Props {
  recommendation: NdaTemplateRecommendation;
  catalog: NdaTemplateSummary[];
  onSelectTemplate: (id: NdaTemplateId) => void;
  selectedTemplateId: NdaTemplateId | null;
}

const confidenceColor = (c: number) =>
  c >= 0.8 ? '#166534' : c >= 0.6 ? '#92400e' : '#991b1b';
const confidenceBg = (c: number) =>
  c >= 0.8 ? '#f0fdf4' : c >= 0.6 ? '#fffbeb' : '#fef2f2';
const confidenceBorder = (c: number) =>
  c >= 0.8 ? '#86efac' : c >= 0.6 ? '#fde68a' : '#fca5a5';

const NdaTemplateRecommendationView: React.FC<Props> = ({
  recommendation,
  catalog,
  onSelectTemplate,
  selectedTemplateId,
}) => {
  const topTemplate = catalog.find(t => t.id === recommendation.recommendedTemplateId);

  return (
    <div className="nda-recommend-root">
      <h3 className="nda-recommend-title">Template Recommendation</h3>

      {/* Top pick */}
      <div
        className={`nda-recommend-top ${selectedTemplateId === recommendation.recommendedTemplateId ? 'nda-recommend-top--selected' : ''}`}
      >
        <div className="nda-recommend-top-header">
          <span className="nda-recommend-top-name">{topTemplate?.name ?? recommendation.recommendedTemplateId}</span>
          <span
            className="nda-recommend-confidence"
            style={{
              color: confidenceColor(recommendation.confidence),
              background: confidenceBg(recommendation.confidence),
              borderColor: confidenceBorder(recommendation.confidence),
            }}
          >
            {Math.round(recommendation.confidence * 100)}% match
          </span>
        </div>
        {topTemplate && (
          <div className="nda-recommend-top-desc">{topTemplate.description}</div>
        )}
        <div className="nda-recommend-reasoning">{recommendation.reasoning}</div>
        <button
          className="nda-recommend-btn"
          onClick={() => onSelectTemplate(recommendation.recommendedTemplateId)}
        >
          {selectedTemplateId === recommendation.recommendedTemplateId ? '✓ Selected' : 'Use this template'}
        </button>
      </div>

      {/* Alternatives */}
      {recommendation.alternatives.length > 0 && (
        <>
          <h4 className="nda-recommend-alt-title">Alternatives</h4>
          <div className="nda-recommend-alt-list">
            {recommendation.alternatives.map((alt) => {
              const altTemplate = catalog.find(t => t.id === alt.templateId);
              return (
                <div
                  key={alt.templateId}
                  className={`nda-recommend-alt-card ${selectedTemplateId === alt.templateId ? 'nda-recommend-alt-card--selected' : ''}`}
                >
                  <div className="nda-recommend-alt-name">{altTemplate?.name ?? alt.templateId}</div>
                  <div className="nda-recommend-alt-reason">{alt.reason}</div>
                  <button
                    className="nda-recommend-alt-btn"
                    onClick={() => onSelectTemplate(alt.templateId)}
                  >
                    {selectedTemplateId === alt.templateId ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Clarifying questions */}
      {recommendation.clarifyingQuestions.length > 0 && (
        <div className="nda-recommend-questions">
          <h4 className="nda-recommend-questions-title">Clarifying Questions</h4>
          <p className="nda-recommend-questions-hint">The agent suggests answering these to improve the recommendation:</p>
          <ul className="nda-recommend-questions-list">
            {recommendation.clarifyingQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NdaTemplateRecommendationView;
