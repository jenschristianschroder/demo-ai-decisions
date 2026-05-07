import React from 'react';
import type { NdaDraft } from '../../types/nda';

interface Props {
  draft: NdaDraft;
}

const NdaDraftView: React.FC<Props> = ({ draft }) => {
  return (
    <div className="nda-draft-root">
      <h3 className="nda-draft-title">Generated NDA Draft</h3>

      <div className="nda-draft-grid">
        <div className="nda-draft-field">
          <span className="nda-draft-label">Title</span>
          <span className="nda-draft-value">{draft.title}</span>
        </div>
        <div className="nda-draft-field">
          <span className="nda-draft-label">Template</span>
          <span className="nda-draft-value">{draft.templateId} v{draft.templateVersion}</span>
        </div>
        <div className="nda-draft-field">
          <span className="nda-draft-label">Effective Date</span>
          <span className="nda-draft-value">{draft.effectiveDate}</span>
        </div>
        <div className="nda-draft-field">
          <span className="nda-draft-label">Term</span>
          <span className="nda-draft-value">{draft.term}</span>
        </div>
        <div className="nda-draft-field">
          <span className="nda-draft-label">Governing Law</span>
          <span className="nda-draft-value">{draft.governingLaw}</span>
        </div>
      </div>

      <h4 className="nda-draft-section-title">Parties</h4>
      <div className="nda-draft-table-wrap">
        <table className="nda-draft-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {draft.parties.map((party) => (
              <tr key={party.name}>
                <td>{party.name}</td>
                <td>{party.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="nda-draft-highlight">{draft.summary}</div>

      <h4 className="nda-draft-section-title">Full Document</h4>
      <pre className="nda-draft-content">{draft.content}</pre>

      {draft.reasoning && (
        <div className="nda-draft-reasoning">
          <span className="nda-draft-reasoning-label">Agent Reasoning:</span> {draft.reasoning}
        </div>
      )}
    </div>
  );
};

export default NdaDraftView;
