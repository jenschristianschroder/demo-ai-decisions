import React from 'react';
import type { SmeQuestion } from '../../types/rfp';

interface Props {
  questions: SmeQuestion[];
}

const smeStatusColor = (s: string): string => {
  switch (s) {
    case 'answered': return '#166534';
    case 'sent': return '#1d4ed8';
    case 'pending': return '#a16207';
    case 'overdue': return '#b91c1c';
    default: return '#666666';
  }
};

const smeStatusBg = (s: string): string => {
  switch (s) {
    case 'answered': return '#f0fdf4';
    case 'sent': return '#eff6ff';
    case 'pending': return '#fffbeb';
    case 'overdue': return '#fef2f2';
    default: return '#f8f9fa';
  }
};

const RfpSmeQuestions: React.FC<Props> = ({ questions }) => {
  return (
    <div className="rfp-sme-root">
      <h3 className="rfp-sme-title">SME Questions</h3>
      <div className="rfp-sme-table-wrap">
        <table className="rfp-sme-table">
          <thead>
            <tr>
              <th>Assigned SME</th>
              <th>Function</th>
              <th>Question</th>
              <th>Req ID</th>
              <th>Needed By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.questionId}>
                <td>{q.assignedTo}</td>
                <td>{q.function}</td>
                <td className="rfp-sme-question-text">{q.question}</td>
                <td className="rfp-sme-req-id">{q.requirementId}</td>
                <td>{q.neededBy}</td>
                <td>
                  <span
                    className="rfp-sme-badge"
                    style={{ color: smeStatusColor(q.status), background: smeStatusBg(q.status) }}
                  >
                    {q.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RfpSmeQuestions;
