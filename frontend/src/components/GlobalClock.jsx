import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export const GlobalClock = ({ className = '', showDate = true, showTimezone = true }) => {
  const { isDarkMode } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get timezone information
  const getTimezoneInfo = () => {
    const offset = -time.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';

    // Get timezone name
    const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      offset: `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      name: timezoneName,
      shortName: new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2]
    };
  };

  const timezone = getTimezoneInfo();

  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = () => {
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`global-clock d-flex align-items-center ${className}`}
      style={{
        fontSize: '14px',
        color: isDarkMode ? '#e2e8f0' : '#4a5568',
      }}
    >
      <i className="bi bi-clock me-2" style={{ fontSize: '16px' }}></i>
      <div className="d-flex flex-column">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>
            {formatTime()}
          </span>
          {showTimezone && (
            <span
              className="badge"
              style={{
                backgroundColor: isDarkMode ? '#4a5568' : '#e2e8f0',
                color: isDarkMode ? '#e2e8f0' : '#4a5568',
                fontSize: '10px',
                fontWeight: '500',
              }}
            >
              {timezone.shortName || timezone.offset}
            </span>
          )}
        </div>
        {showDate && (
          <small
            style={{
              fontSize: '11px',
              color: isDarkMode ? '#a0aec0' : '#718096',
            }}
          >
            {formatDate()}
          </small>
        )}
      </div>
    </div>
  );
};

// Compact version for header/navbar
export const CompactClock = () => {
  const { isDarkMode } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getTimezoneShort = () => {
    return new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];
  };

  return (
    <div
      className="compact-clock d-flex align-items-center gap-2"
      style={{
        fontSize: '13px',
        color: isDarkMode ? '#e2e8f0' : '#4a5568',
      }}
    >
      <i className="bi bi-clock" style={{ fontSize: '14px' }}></i>
      <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
        {formatTime()}
      </span>
      <span
        className="badge"
        style={{
          backgroundColor: isDarkMode ? '#4a5568' : '#e2e8f0',
          color: isDarkMode ? '#e2e8f0' : '#4a5568',
          fontSize: '9px',
        }}
      >
        {getTimezoneShort()}
      </span>
    </div>
  );
};
