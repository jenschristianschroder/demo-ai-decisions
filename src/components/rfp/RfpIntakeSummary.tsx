import React from 'react';
import type { RfpIntakeSummary as IntakeData } from '../../types/rfp';

interface Props {
  intake: IntakeData;
}

const RfpIntakeSummary: React.FC<Props> = ({ intake }) => {
  return (
    <div className="rfp-intake-root">
      <h3 className="rfp-intake-title">Intake Summary</h3>

      <div className="rfp-intake-grid">
        <div className="rfp-intake-field">
          <span className="rfp-intake-label">Buyer</span>
          <span className="rfp-intake-value">{intake.buyerName}</span>
        </div>
        <div className="rfp-intake-field">
          <span className="rfp-intake-label">RFP Title</span>
          <span className="rfp-intake-value">{intake.rfpTitle}</span>
        </div>
        <div className="rfp-intake-field">
          <span className="rfp-intake-label">RFP Number</span>
          <span className="rfp-intake-value">{intake.rfpNumber}</span>
        </div>
        <div className="rfp-intake-field">
          <span className="rfp-intake-label">Deadline</span>
          <span className="rfp-intake-value">{intake.deadline}</span>
        </div>
        <div className="rfp-intake-field">
          <span className="rfp-intake-label">Submission Method</span>
          <span className="rfp-intake-value">{intake.submissionMethod}</span>
        </div>
        <div className="rfp-intake-field">
          <span className="rfp-intake-label">Contact</span>
          <span className="rfp-intake-value">{intake.contactPerson} ({intake.contactEmail})</span>
        </div>
      </div>

      <p className="rfp-intake-summary">{intake.summary}</p>

      {/* Evaluation Criteria */}
      <h4 className="rfp-intake-section-title">Evaluation Criteria</h4>
      <div className="rfp-intake-table-wrap">
        <table className="rfp-intake-table">
          <thead>
            <tr>
              <th>Criteria</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {intake.evaluationCriteria.map((ec) => (
              <tr key={ec.criteria}>
                <td>{ec.criteria}</td>
                <td>{ec.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Required Attachments */}
      <h4 className="rfp-intake-section-title">Required Attachments</h4>
      <ul className="rfp-intake-list">
        {intake.requiredAttachments.map((att) => (
          <li key={att} className="rfp-intake-list-item">{att}</li>
        ))}
      </ul>

      {/* Key Dates */}
      <h4 className="rfp-intake-section-title">Key Dates</h4>
      <div className="rfp-intake-table-wrap">
        <table className="rfp-intake-table">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {intake.keyDates.map((kd) => (
              <tr key={kd.milestone}>
                <td>{kd.milestone}</td>
                <td>{kd.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Open Questions */}
      {intake.openQuestions.length > 0 && (
        <>
          <h4 className="rfp-intake-section-title">Open Questions</h4>
          <ul className="rfp-intake-list">
            {intake.openQuestions.map((q, i) => (
              <li key={i} className="rfp-intake-list-item">{q}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default RfpIntakeSummary;
