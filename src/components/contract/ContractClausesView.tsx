import React from 'react';
import type { ExtractedClause } from '../../types/contract';

interface Props {
  clauses: ExtractedClause[];
}

const categoryColor = (c: string): string => {
  switch (c) {
    case 'liability': return '#b91c1c';
    case 'indemnification': return '#7f1d1d';
    case 'termination': return '#a16207';
    case 'payment': return '#166534';
    case 'confidentiality': return '#6d28d9';
    case 'force-majeure': return '#0e7490';
    case 'dispute-resolution': return '#1d4ed8';
    case 'data-protection': return '#7c3aed';
    case 'intellectual-property': return '#b45309';
    case 'warranty': return '#047857';
    case 'insurance': return '#4338ca';
    case 'compliance': return '#0369a1';
    default: return '#666666';
  }
};

const categoryBg = (c: string): string => {
  switch (c) {
    case 'liability': return '#fef2f2';
    case 'indemnification': return '#fef2f2';
    case 'termination': return '#fffbeb';
    case 'payment': return '#f0fdf4';
    case 'confidentiality': return '#f5f3ff';
    case 'force-majeure': return '#ecfeff';
    case 'dispute-resolution': return '#eff6ff';
    case 'data-protection': return '#f5f3ff';
    case 'intellectual-property': return '#fffbeb';
    case 'warranty': return '#f0fdf4';
    case 'insurance': return '#eef2ff';
    case 'compliance': return '#f0f9ff';
    default: return '#f8f9fa';
  }
};

const ContractClausesView: React.FC<Props> = ({ clauses }) => {
  return (
    <div className="contract-clauses-root">
      <h3 className="contract-clauses-title">Extracted Clauses</h3>
      <div className="contract-clauses-table-wrap">
        <table className="contract-clauses-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Section</th>
              <th>Has Definitions</th>
              <th>Related Clauses</th>
            </tr>
          </thead>
          <tbody>
            {clauses.map((clause) => (
              <tr key={clause.clauseId}>
                <td className="contract-clauses-id">{clause.clauseId}</td>
                <td>{clause.title}</td>
                <td>
                  <span
                    className="contract-clauses-category-badge"
                    style={{ color: categoryColor(clause.category), background: categoryBg(clause.category) }}
                  >
                    {clause.category}
                  </span>
                </td>
                <td>{clause.section}</td>
                <td>{clause.hasDefinitions ? 'Yes' : 'No'}</td>
                <td>{clause.relatedClauses.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractClausesView;
