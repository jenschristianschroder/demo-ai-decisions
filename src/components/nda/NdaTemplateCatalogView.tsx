import React from 'react';
import type { NdaTemplateSummary, NdaTemplateId } from '../../types/nda';

interface Props {
  catalog: NdaTemplateSummary[];
  selectedTemplateId: NdaTemplateId | null;
  onSelectTemplate: (id: NdaTemplateId) => void;
}

const NdaTemplateCatalogView: React.FC<Props> = ({ catalog, selectedTemplateId, onSelectTemplate }) => {
  return (
    <div className="nda-catalog-root">
      <h3 className="nda-catalog-title">NDA Template Catalog</h3>
      <div className="nda-catalog-grid">
        {catalog.map((template) => (
          <div
            key={template.id}
            className={`nda-catalog-card ${selectedTemplateId === template.id ? 'nda-catalog-card--selected' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelectTemplate(template.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTemplate(template.id);
              }
            }}
          >
            <div className="nda-catalog-card-header">
              <span className="nda-catalog-card-name">{template.name}</span>
              <span className={`nda-catalog-card-type nda-catalog-card-type--${template.type}`}>
                {template.type}
              </span>
            </div>
            <div className="nda-catalog-card-desc">{template.description}</div>
            <div className="nda-catalog-card-meta">
              <span className="nda-catalog-card-meta-label">Term:</span> {template.defaultTermRange}
            </div>
            <div className="nda-catalog-card-meta">
              <span className="nda-catalog-card-meta-label">Jurisdiction:</span> {template.defaultJurisdictions.join(', ')}
            </div>
            <div className="nda-catalog-card-uses">
              {template.typicalUseCases.map((uc) => (
                <span key={uc} className="nda-catalog-card-use-pill">{uc}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NdaTemplateCatalogView;
