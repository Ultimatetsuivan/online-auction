import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { useLanguage } from '../context/LanguageContext';

const buildTimeLeft = (deadline) => {
  if (!deadline) {
    return { expired: true, totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const target = new Date(deadline);
  const now = new Date();
  const difference = target - now;

  if (difference <= 0) {
    return { expired: true, totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    totalMs: difference,
    expired: false
  };
};

export const CountdownTimer = ({ productId, deadline, variant = 'standard', showProgress = false }) => {
  const { t, language } = useLanguage();

  // Format deadline for tooltip
  const formatDeadline = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    const locale = language === 'MN' ? 'mn-MN' : 'en-US';
    return date.toLocaleString(locale, options);
  };

  const [timeLeft, setTimeLeft] = useState(() => buildTimeLeft(deadline));
  const [initialDuration, setInitialDuration] = useState(() => {
    const target = deadline ? new Date(deadline) : null;
    return target ? Math.max(target - new Date(), 0) : 0;
  });

  // Calculate time left initially and when deadline changes
  useEffect(() => {
    setTimeLeft(buildTimeLeft(deadline));
    const target = deadline ? new Date(deadline) : null;
    setInitialDuration(target ? Math.max(target - new Date(), 0) : 0);
  }, [deadline]);

  // Client-side fallback timer
  useEffect(() => {
    if (timeLeft.expired) return;

    const timer = setInterval(() => {
      setTimeLeft(buildTimeLeft(deadline));
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, timeLeft.expired]);

  const tooltipText = `${t('auctionEndsOn')}: ${formatDeadline(deadline)}`;

  if (timeLeft.expired) {
    return (
      <span className="text-danger fw-bold" title={tooltipText}>
        {t('auctionEnded')}
      </span>
    );
  }

  // Calculate total hours remaining
  const totalHoursRemaining = timeLeft.days * 24 + timeLeft.hours;

  // Determine urgency level and color
  let urgencyColor = '#28a745'; // Green (> 24 hours)
  let urgencyLevel = 'low';

  if (totalHoursRemaining < 1) {
    urgencyColor = '#dc3545'; // Red (< 1 hour) - URGENT!
    urgencyLevel = 'critical';
  } else if (totalHoursRemaining < 24) {
    urgencyColor = '#ffc107'; // Yellow/Orange (1-24 hours)
    urgencyLevel = 'medium';
  }

  const badgeStyle = {
    backgroundColor: urgencyColor,
    color: 'white',
    fontWeight: '600',
    fontSize: '0.75rem',
    padding: '0.35rem 0.5rem',
    borderRadius: '4px',
    minWidth: '45px',
    textAlign: 'center',
    animation: urgencyLevel === 'critical' ? 'pulse 2s infinite' : 'none'
  };

  const progressPercentage = initialDuration
    ? Math.max(0, Math.min(100, (timeLeft.totalMs / initialDuration) * 100))
    : 0;

  const emphasizeLayout = variant === 'emphasized';

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .countdown-emphasis {
            background: linear-gradient(115deg, #ff7e29, #ffb347);
            border-radius: 12px;
            padding: 0.85rem;
            color: #fff;
            box-shadow: 0 8px 20px rgba(255, 125, 41, 0.35);
          }
          .countdown-emphasis .time-chip {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 60px;
            padding: 0.35rem 0.5rem;
            border-radius: 8px;
            background: rgba(0,0,0,0.2);
            font-weight: 600;
          }
          .countdown-emphasis .time-chip span:first-child {
            font-size: 1rem;
          }
          .countdown-emphasis small {
            color: rgba(255,255,255,0.8);
          }
        `}
      </style>
      {emphasizeLayout ? (
        <div
          className="countdown-emphasis"
          title={tooltipText}
          style={{ cursor: 'help' }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-uppercase small fw-semibold">{t('timeLeft')}</span>
            <span className="badge bg-dark text-white">
              {formatDeadline(deadline)}
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {timeLeft.days > 0 && (
              <div className="time-chip">
                <span>{timeLeft.days}</span>
                <small>{t('daysShort')}</small>
              </div>
            )}
            <div className="time-chip">
              <span>{timeLeft.hours}</span>
              <small>{t('hoursShort')}</small>
            </div>
            <div className="time-chip">
              <span>{timeLeft.minutes}</span>
              <small>{t('minutesShort')}</small>
            </div>
            <div className="time-chip">
              <span>{timeLeft.seconds}</span>
              <small>{t('secondsShort')}</small>
            </div>
          </div>
          {showProgress && (
            <div className="progress mt-3" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div
                className="progress-bar bg-white"
                role="progressbar"
                style={{
                  width: `${progressPercentage}%`,
                  transition: 'width 0.6s ease'
                }}
                aria-valuenow={progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="d-flex justify-content-between align-items-center"
          title={tooltipText}
          style={{ cursor: 'help' }}
        >
          {timeLeft.days > 0 && (
            <span className="me-1" style={badgeStyle}>{timeLeft.days}{t('daysShort')}</span>
          )}
          <span className="me-1" style={badgeStyle}>{timeLeft.hours}{t('hoursShort')}</span>
          <span className="me-1" style={badgeStyle}>{timeLeft.minutes}{t('minutesShort')}</span>
          <span style={badgeStyle}>{timeLeft.seconds}{t('secondsShort')}</span>
        </div>
      )}
    </>
  );
};
