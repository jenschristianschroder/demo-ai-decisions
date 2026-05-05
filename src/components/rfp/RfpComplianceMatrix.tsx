import React, { useState, useMemo } from 'react';
import type { ComplianceRow } from '../../types/rfp';

interface Props {
  rows: ComplianceRow[];
}

const statusColor = (s: string): string => {
  switch (s) {
    case 'compliant': return '#166534';
    case 'partial': return '#a16207';
    case 'non-compliant': return '#b91c1c';
    case 'needs-review': return '#7c3aed';
    default: return '#666666';
  }
};

const statusBg = (s: string): string => {
  switch (s) {
    case 'compliant': return '#f0fdf4';
    case 'partial': return '#fffbeb';
    case 'non-compliant': return '#fef2f2';
    case 'needs-review': return '#f5f3ff';
    default: return '#f8f9fa';
  }
};

const riskColor = (r: string): string => {
  switch (r) {
    case 'critical': return '#7f1d1d';
    case 'high': return '#b91c1c';
    case 'medium': return '#a16207';
    case 'low': return '#166534';
    default: return '#666666';
  }
};

const riskBg = (r: string): string => {
  switch (r) {
    case 'critical': return '#fef2f2';
    case 'high': return '#fef2f2';
    case 'medium': return '#fffbeb';
    case 'low': return '#f0fdf4';
    default: return '#f8f9fa';
  }
};

const ALL = '__all__';

const unique = (arr: string[]): string[] => Array.from(new Set(arr)).sort();

const RfpComplianceMatrix: React.FC<Props> = ({ rows }) => {
  const [filterCategory, setFilterCategory] = useState(ALL);
  const [filterOwner, setFilterOwner] = useState(ALL);
  const [filterRisk, setFilterRisk] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);

  const categories = useMemo(() => unique(rows.map((r) => r.category)), [rows]);
  const owners = useMemo(() => unique(rows.map((r) => r.owner)), [rows]);
  const risks = useMemo(() => unique(rows.map((r) => r.risk)), [rows]);
  const statuses = useMemo(() => unique(rows.map((r) => r.responseStatus)), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterCategory !== ALL && r.category !== filterCategory) return false;
      if (filterOwner !== ALL && r.owner !== filterOwner) return false;
      if (filterRisk !== ALL && r.risk !== filterRisk) return false;
      if (filterStatus !== ALL && r.responseStatus !== filterStatus) return false;
      return true;
    });
  }, [rows, filterCategory, filterOwner, filterRisk, filterStatus]);

  return (
    <div className="rfp-compliance-root">
      <h3 className="rfp-compliance-title">Compliance Matrix</h3>

      <div className="rfp-compliance-filters">
        <label className="rfp-compliance-filter">
          <span className="rfp-compliance-filter-label">Category</span>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value={ALL}>All</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="rfp-compliance-filter">
          <span className="rfp-compliance-filter-label">Owner</span>
          <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
            <option value={ALL}>All</option>
            {owners.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="rfp-compliance-filter">
          <span className="rfp-compliance-filter-label">Risk</span>
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
            <option value={ALL}>All</option>
            {risks.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="rfp-compliance-filter">
          <span className="rfp-compliance-filter-label">Status</span>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value={ALL}>All</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="rfp-compliance-table-wrap">
        <table className="rfp-compliance-table">
          <thead>
            <tr>
              <th>Req ID</th>
              <th>Requirement</th>
              <th>Category</th>
              <th>Mandatory</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Evidence</th>
              <th>Next Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.requirementId}>
                <td className="rfp-compliance-id">{row.requirementId}</td>
                <td className="rfp-compliance-req" title={row.requirement}>
                  {row.requirement.length > 80 ? row.requirement.slice(0, 80) + '…' : row.requirement}
                </td>
                <td>{row.category}</td>
                <td>{row.mandatory ? 'Yes' : 'No'}</td>
                <td>{row.owner}</td>
                <td>
                  <span
                    className="rfp-compliance-badge"
                    style={{ color: statusColor(row.responseStatus), background: statusBg(row.responseStatus) }}
                  >
                    {row.responseStatus}
                  </span>
                </td>
                <td>
                  <span
                    className="rfp-compliance-badge"
                    style={{ color: riskColor(row.risk), background: riskBg(row.risk) }}
                  >
                    {row.risk}
                  </span>
                </td>
                <td className="rfp-compliance-evidence">{row.evidence}</td>
                <td>{row.nextAction}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="rfp-compliance-empty">No matching rows</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RfpComplianceMatrix;
