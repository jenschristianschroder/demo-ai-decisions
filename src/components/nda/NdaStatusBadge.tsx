import React from 'react';
import type { NdaStatus } from '../../types/nda';

const STATUS_LABELS: Record<NdaStatus, string> = {
  intake: 'Intake',
  'template-selected': 'Template Selected',
  'draft-generated': 'Draft Generated',
  'redline-reviewed': 'Redline Reviewed',
  validated: 'Validated',
  approved: 'Approved',
  dispatched: 'Dispatched',
  signed: 'Signed',
};

interface Props {
  status: NdaStatus;
}

const NdaStatusBadge: React.FC<Props> = ({ status }) => {
  return (
    <span className={`nda-status-badge nda-status-badge--${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
};

export default NdaStatusBadge;
