import React from 'react';
import './Skeleton.css';

// Base Skeleton component
export const Skeleton = ({ width, height, borderRadius = '4px', className = '' }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
};

// Skeleton for product cards
export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <Skeleton width="100%" height="200px" borderRadius="8px" className="skeleton-card-image" />
      <div className="skeleton-card-content">
        <Skeleton width="70%" height="20px" className="skeleton-card-title" />
        <Skeleton width="50%" height="16px" className="skeleton-card-subtitle" />
        <div className="skeleton-card-footer">
          <Skeleton width="40%" height="24px" />
          <Skeleton width="30%" height="24px" />
        </div>
      </div>
    </div>
  );
};

// Skeleton for product detail page
export const SkeletonProductDetail = () => {
  return (
    <div className="skeleton-product-detail">
      <div className="skeleton-detail-left">
        <Skeleton width="100%" height="400px" borderRadius="8px" />
        <div className="skeleton-detail-thumbnails">
          <Skeleton width="80px" height="80px" borderRadius="8px" />
          <Skeleton width="80px" height="80px" borderRadius="8px" />
          <Skeleton width="80px" height="80px" borderRadius="8px" />
          <Skeleton width="80px" height="80px" borderRadius="8px" />
        </div>
      </div>
      <div className="skeleton-detail-right">
        <Skeleton width="80%" height="32px" className="skeleton-detail-title" />
        <Skeleton width="40%" height="24px" className="skeleton-detail-price" />
        <Skeleton width="100%" height="1px" className="skeleton-detail-divider" />
        <Skeleton width="100%" height="60px" className="skeleton-detail-description" />
        <Skeleton width="100%" height="100px" className="skeleton-detail-bids" />
        <Skeleton width="100%" height="48px" borderRadius="8px" className="skeleton-detail-button" />
      </div>
    </div>
  );
};

// Skeleton for lists
export const SkeletonList = ({ count = 3 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <Skeleton width="60px" height="60px" borderRadius="8px" />
          <div className="skeleton-list-content">
            <Skeleton width="60%" height="18px" />
            <Skeleton width="40%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton for text
export const SkeletonText = ({ lines = 3, width = '100%' }) => {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : width}
          height="16px"
          className="skeleton-text-line"
        />
      ))}
    </div>
  );
};

export default Skeleton;
