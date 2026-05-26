import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { StepCycleTime } from '../../types/onboarding';

interface Props {
  data: StepCycleTime[];
}

const STEP_LABELS: Record<string, string> = {
  intake: 'Intake',
  kyc: 'KYC',
  aml: 'AML',
  'tech-integration': 'Tech',
  'signatory-verification': 'Sign.',
  'product-configuration': 'Config',
  'go-live': 'Live',
};

const OnboardingPortfolioCycleTime: React.FC<Props> = ({ data }) => {
  const rows = data.map((d) => ({
    step: STEP_LABELS[d.step] ?? d.step,
    Median: d.medianDays,
    p90: d.p90Days,
    inFlight: d.inFlight,
  }));

  return (
    <div className="onb-cycle-chart">
      <div className="onb-cycle-chart-title">Per-step cycle time (business days)</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="step" tick={{ fontSize: 11, fill: '#666666' }} />
          <YAxis tick={{ fontSize: 11, fill: '#666666' }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Median" fill="#3b82f6" />
          <Bar dataKey="p90" fill="#94a3b8" />
        </BarChart>
      </ResponsiveContainer>
      <table className="onb-cycle-flow-table">
        <thead>
          <tr>
            <th>Step</th>
            <th>Median</th>
            <th>p90</th>
            <th>In flight</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.step}>
              <td>{STEP_LABELS[d.step] ?? d.step}</td>
              <td>{d.medianDays} d</td>
              <td>{d.p90Days} d</td>
              <td>{d.inFlight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OnboardingPortfolioCycleTime;
