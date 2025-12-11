import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export const PriceHistoryChart = ({ bids, startingPrice, startDate, endDate }) => {
  const { isDarkMode } = useTheme();

  // Prepare data for the chart
  const chartData = useMemo(() => {
    if (!bids || bids.length === 0) {
      // Show just the starting price
      return [
        {
          time: new Date(startDate).getTime(),
          price: startingPrice,
          label: 'Starting',
          date: new Date(startDate),
        },
      ];
    }

    // Start with the initial price at auction start
    const data = [
      {
        time: new Date(startDate).getTime(),
        price: startingPrice,
        label: 'Starting Price',
        date: new Date(startDate),
      },
    ];

    // Add all bids
    bids.forEach((bid, index) => {
      if (bid && bid.price && bid.createdAt) {
        data.push({
          time: new Date(bid.createdAt).getTime(),
          price: bid.price,
          label: `Bid ${index + 1}`,
          bidder: bid.user?.name || 'Anonymous',
          date: new Date(bid.createdAt),
        });
      }
    });

    // Sort by time
    data.sort((a, b) => a.time - b.time);

    return data;
  }, [bids, startingPrice, startDate]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: isDarkMode ? '#2d3748' : '#fff',
            border: `1px solid ${isDarkMode ? '#4a5568' : '#ddd'}`,
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <p
            className="mb-1"
            style={{
              fontWeight: 'bold',
              color: isDarkMode ? '#fff' : '#333',
              fontSize: '14px',
            }}
          >
            ₮{data.price.toLocaleString()}
          </p>
          {data.bidder && (
            <p
              className="mb-1"
              style={{
                fontSize: '12px',
                color: isDarkMode ? '#a0aec0' : '#666',
              }}
            >
              {data.bidder}
            </p>
          )}
          <p
            className="mb-0"
            style={{
              fontSize: '11px',
              color: isDarkMode ? '#718096' : '#888',
            }}
          >
            {data.date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format X-axis (time)
  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      // Show time if within last 24 hours
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      // Show date if older
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Format Y-axis (price)
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `₮${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₮${(value / 1000).toFixed(0)}K`;
    }
    return `₮${value}`;
  };

  return (
    <div className="price-history-chart">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0" style={{ color: isDarkMode ? '#fff' : '#333' }}>
          <i className="bi bi-graph-up me-2"></i>
          Price History
        </h6>
        <small style={{ color: isDarkMode ? '#a0aec0' : '#666' }}>
          {chartData.length} data point{chartData.length !== 1 ? 's' : ''}
        </small>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF6A00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDarkMode ? '#4a5568' : '#e2e8f0'}
          />
          <XAxis
            dataKey="time"
            tickFormatter={formatXAxis}
            stroke={isDarkMode ? '#a0aec0' : '#666'}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke={isDarkMode ? '#a0aec0' : '#666'}
            style={{ fontSize: '12px' }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#FF6A00"
            strokeWidth={2}
            fill="url(#colorPrice)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>

      {chartData.length === 1 && (
        <div className="text-center mt-3">
          <small style={{ color: isDarkMode ? '#a0aec0' : '#888' }}>
            <i className="bi bi-info-circle me-1"></i>
            No bids yet. Graph will update as bids come in.
          </small>
        </div>
      )}
    </div>
  );
};
