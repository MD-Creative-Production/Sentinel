'use client';

import React, { useState } from 'react';

type HistoricalPoint = { date: string; riskScore: number };

export default function RiskTrendsDashboard() {
  const [timeFilter, setTimeFilter] = useState<string>('30d');

  // Mock data for charts
  const historicalData: HistoricalPoint[] = [
    { date: '2023-01-01', riskScore: 85 },
    { date: '2023-02-01', riskScore: 70 },
    { date: '2023-03-01', riskScore: 65 },
    { date: '2023-04-01', riskScore: 50 },
    { date: '2023-05-01', riskScore: 55 },
    { date: '2023-06-01', riskScore: 40 },
  ];

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Risk Trends Dashboard
      </h1>

      {/* Time Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label htmlFor="timeFilter" style={{ fontWeight: '500' }}>
          Time Range:{' '}
        </label>
        <select
          id="timeFilter"
          value={timeFilter}
          onChange={e => setTimeFilter(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Historical Charts */}
        <div
          style={{
            border: '1px solid #eaeaea',
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: '#fff',
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Historical Risk Chart</h2>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            {historicalData.map((data: HistoricalPoint, i: number) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    width: '100%',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      backgroundColor:
                        data.riskScore > 60
                          ? '#ef4444'
                          : data.riskScore > 40
                            ? '#eab308'
                            : '#22c55e',
                      height: `${data.riskScore}%`,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                    title={`Risk Score: ${data.riskScore}`}
                  />
                </div>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(data.date).toLocaleString('default', { month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Comparisons */}
        <div
          style={{
            border: '1px solid #eaeaea',
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: '#fff',
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Risk Comparisons</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <span style={{ fontWeight: '500' }}>Engineering</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>45</span>
                <span style={{ color: '#22c55e', fontSize: '14px' }}>↓ 10%</span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <span style={{ fontWeight: '500' }}>Sales</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>72</span>
                <span style={{ color: '#ef4444', fontSize: '14px' }}>↑ 5%</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>Marketing</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>30</span>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>- 0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
