import React from 'react';
import type { ContractDocumentSummary } from '../../types/contract';

interface Props {
  summary: ContractDocumentSummary;
}

const ContractDocumentSummaryView: React.FC<Props> = ({ summary }) => {
  return (
    <div className="contract-summary-root">
      <h3 className="contract-summary-title">Document Summary</h3>

      <div className="contract-summary-grid">
        <div className="contract-summary-field">
          <span className="contract-summary-label">Contract Title</span>
          <span className="contract-summary-value">{summary.contractTitle}</span>
        </div>
        <div className="contract-summary-field">
          <span className="contract-summary-label">Contract Type</span>
          <span className="contract-summary-value">{summary.contractType}</span>
        </div>
        <div className="contract-summary-field">
          <span className="contract-summary-label">Effective Date</span>
          <span className="contract-summary-value">{summary.effectiveDate}</span>
        </div>
        <div className="contract-summary-field">
          <span className="contract-summary-label">Expiration Date</span>
          <span className="contract-summary-value">{summary.expirationDate}</span>
        </div>
        <div className="contract-summary-field">
          <span className="contract-summary-label">Governing Law</span>
          <span className="contract-summary-value">{summary.governingLaw}</span>
        </div>
        <div className="contract-summary-field">
          <span className="contract-summary-label">Language</span>
          <span className="contract-summary-value">{summary.language}</span>
        </div>
        <div className="contract-summary-field">
          <span className="contract-summary-label">Total Clauses</span>
          <span className="contract-summary-value">{summary.totalClauses}</span>
        </div>
      </div>

      <h4 className="contract-summary-section-title">Parties</h4>
      <div className="contract-summary-table-wrap">
        <table className="contract-summary-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {summary.parties.map((party) => (
              <tr key={party.name}>
                <td>{party.name}</td>
                <td>{party.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="contract-summary-highlight">{summary.summary}</div>
    </div>
  );
};

export default ContractDocumentSummaryView;
