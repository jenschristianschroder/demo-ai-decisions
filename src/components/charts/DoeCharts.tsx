import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';

// ---------------------------------------------------------------------------
// DoE charts (Recharts) — matching the existing enterprise chart style used in
// src/components/charts/TrendChart.tsx (black/grey palette, small grey axes).
// ---------------------------------------------------------------------------

export interface MainEffectDatum {
  factor: string;     // factor name
  magnitude: number;  // |effect|
  significant: boolean;
}

export const MainEffectBarChart: React.FC<{ data: MainEffectDatum[]; unit: string; title?: string }> = ({
  data,
  unit,
  title,
}) => (
  <div className="chart-wrapper">
    {title && <div className="chart-title">{title}</div>}
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="factor" tick={{ fontSize: 11, fill: '#666666' }} />
        <YAxis tick={{ fontSize: 11, fill: '#666666' }} />
        <Tooltip formatter={(v: number) => `${v} ${unit}`.trim()} />
        <Bar dataKey="magnitude" name={`Effect magnitude${unit ? ` (${unit})` : ''}`} radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.significant ? '#111111' : '#cccccc'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export interface ParetoDatum {
  term: string;       // 'A', 'A×B', ...
  magnitude: number;  // |effect|
  significant: boolean;
}

export const ParetoChart: React.FC<{ data: ParetoDatum[]; unit: string; title?: string }> = ({
  data,
  unit,
  title,
}) => (
  <div className="chart-wrapper">
    {title && <div className="chart-title">{title}</div>}
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#666666' }} />
        <YAxis type="category" dataKey="term" width={48} tick={{ fontSize: 11, fill: '#666666' }} />
        <Tooltip formatter={(v: number) => `${v} ${unit}`.trim()} />
        <Bar dataKey="magnitude" name={`|Effect|${unit ? ` (${unit})` : ''}`} radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.significant ? '#111111' : '#cccccc'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export interface InteractionDatum {
  level: string;     // x-axis level of factor 1 (e.g. 'Low', 'High')
  [series: string]: string | number; // one numeric series per factor-2 level
}

export const InteractionPlot: React.FC<{
  data: InteractionDatum[];
  seriesKeys: string[];
  unit: string;
  title?: string;
}> = ({ data, seriesKeys, unit, title }) => (
  <div className="chart-wrapper">
    {title && <div className="chart-title">{title}</div>}
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#666666' }} />
        <YAxis tick={{ fontSize: 11, fill: '#666666' }} />
        <Tooltip formatter={(v: number) => `${v} ${unit}`.trim()} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {seriesKeys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke={i === 0 ? '#111111' : '#999999'}
            strokeWidth={2}
            strokeDasharray={i === 0 ? undefined : '4 2'}
            dot={{ r: 3 }}
            name={k}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);
