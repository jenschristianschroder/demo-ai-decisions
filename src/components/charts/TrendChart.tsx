import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendDataPoint {
  month: string;
  actual: number;
  budget: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  currency: string;
  title?: string;
}

const formatAmount = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  return `${(value / 1000).toFixed(0)}k`;
};

export const TrendLineChart: React.FC<TrendChartProps> = ({ data, title }) => (
  <div className="chart-wrapper">
    {title && <div className="chart-title">{title}</div>}
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666666' }} />
        <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: '#666666' }} />
        <Tooltip formatter={(v: number) => formatAmount(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="actual" stroke="#111111" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
        <Line type="monotone" dataKey="budget" stroke="#999999" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Budget" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const TrendBarChart: React.FC<TrendChartProps> = ({ data, title }) => (
  <div className="chart-wrapper">
    {title && <div className="chart-title">{title}</div>}
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666666' }} />
        <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: '#666666' }} />
        <Tooltip formatter={(v: number) => formatAmount(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="actual" fill="#111111" name="Actual" radius={[3, 3, 0, 0]} />
        <Bar dataKey="budget" fill="#cccccc" name="Budget" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
