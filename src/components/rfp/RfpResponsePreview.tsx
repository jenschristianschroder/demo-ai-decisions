import React, { useState } from 'react';
import type { ResponseAssembly } from '../../types/rfp';

interface Props {
  assembly: ResponseAssembly;
}

const buildMarkdown = (assembly: ResponseAssembly): string => {
  const lines: string[] = [];
  lines.push('# Executive Summary\n');
  lines.push(assembly.executiveSummary + '\n');

  assembly.responseSections.forEach((sec) => {
    lines.push(`## ${sec.section}\n`);
    lines.push(sec.content + '\n');
  });

  if (assembly.assumptions.length > 0) {
    lines.push('## Assumptions\n');
    assembly.assumptions.forEach((a) => lines.push(`- ${a}`));
    lines.push('');
  }

  if (assembly.openItems.length > 0) {
    lines.push('## Open Items\n');
    assembly.openItems.forEach((o) => lines.push(`- ${o}`));
    lines.push('');
  }

  if (assembly.approvalNeeded.length > 0) {
    lines.push('## Approvals Needed\n');
    assembly.approvalNeeded.forEach((a) => lines.push(`- ${a}`));
    lines.push('');
  }

  if (assembly.submissionChecklist.length > 0) {
    lines.push('## Submission Checklist\n');
    lines.push('| Item | Status | Owner |');
    lines.push('|------|--------|-------|');
    assembly.submissionChecklist.forEach((c) => {
      lines.push(`| ${c.item} | ${c.status} | ${c.owner} |`);
    });
    lines.push('');
  }

  return lines.join('\n');
};

const RfpResponsePreview: React.FC<Props> = ({ assembly }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const md = buildMarkdown(assembly);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rfp-preview-root">
      <div className="rfp-preview-header">
        <h3 className="rfp-preview-title">Response Preview</h3>
        <button className="rfp-preview-copy-btn" onClick={handleCopy}>
          {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
        </button>
      </div>

      <div className="rfp-preview-document">
        <section className="rfp-preview-section">
          <h2 className="rfp-preview-section-heading">Executive Summary</h2>
          <p className="rfp-preview-text">{assembly.executiveSummary}</p>
        </section>

        {assembly.responseSections.map((sec, i) => (
          <section key={i} className="rfp-preview-section">
            <h2 className="rfp-preview-section-heading">{sec.section}</h2>
            <p className="rfp-preview-text">{sec.content}</p>
          </section>
        ))}

        {assembly.assumptions.length > 0 && (
          <section className="rfp-preview-section">
            <h2 className="rfp-preview-section-heading">Assumptions</h2>
            <ul className="rfp-preview-list">
              {assembly.assumptions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </section>
        )}

        {assembly.openItems.length > 0 && (
          <section className="rfp-preview-section">
            <h2 className="rfp-preview-section-heading">Open Items</h2>
            <ul className="rfp-preview-list">
              {assembly.openItems.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </section>
        )}

        {assembly.approvalNeeded.length > 0 && (
          <section className="rfp-preview-section">
            <h2 className="rfp-preview-section-heading">Approvals Needed</h2>
            <ul className="rfp-preview-list">
              {assembly.approvalNeeded.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </section>
        )}

        {assembly.submissionChecklist.length > 0 && (
          <section className="rfp-preview-section">
            <h2 className="rfp-preview-section-heading">Submission Checklist</h2>
            <div className="rfp-preview-table-wrap">
              <table className="rfp-preview-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {assembly.submissionChecklist.map((c, i) => (
                    <tr key={i}>
                      <td>{c.item}</td>
                      <td>{c.status}</td>
                      <td>{c.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default RfpResponsePreview;
