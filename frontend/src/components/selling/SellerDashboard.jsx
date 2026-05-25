import React, { useEffect, useState } from 'react';
import axios from '../../utils/axios';
import { buildApiUrl } from '../../config/api';
import { FiPlayCircle, FiClock, FiAlertOctagon, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  active:    { label: 'Идэвхтэй',   color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: <FiPlayCircle size={18} /> },
  scheduled: { label: 'Хуваарьт',  color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: <FiClock size={18} /> },
  ended:     { label: 'Дууссан',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: <FiAlertOctagon size={18} /> },
  sold:      { label: 'Зарагдсан', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <FiCheckCircle size={18} /> },
};

const StatCard = ({ type, count }) => {
  const cfg = STATUS_CONFIG[type];
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${cfg.border}`, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
        {cfg.icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{cfg.label}</div>
      </div>
    </div>
  );
};

const ProductSection = ({ type, items }) => {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[type];

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{cfg.label}</span>
        </div>
        <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, border: `1px solid ${cfg.border}` }}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>Одоогоор зар байхгүй байна.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <th style={{ padding: '8px 20px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>Нэр</th>
                <th style={{ padding: '8px 20px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>Үнэ</th>
                <th style={{ padding: '8px 20px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>Төлөв</th>
                <th style={{ padding: '8px 20px', borderBottom: '1px solid #f1f5f9' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={p._id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{p.title}</td>
                  <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, color: 'var(--bn-accent)' }}>₮{(p.currentBid || p.price || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                      background: p.sold ? '#dcfce7' : p.auctionStatus === 'active' ? '#eff6ff' : p.auctionStatus === 'scheduled' ? '#f5f3ff' : '#fff7ed',
                      color: p.sold ? '#16a34a' : p.auctionStatus === 'active' ? '#3b82f6' : p.auctionStatus === 'scheduled' ? '#8b5cf6' : '#f59e0b' }}>
                      {p.sold ? 'Зарагдсан' : p.auctionStatus === 'active' ? 'Идэвхтэй' : p.auctionStatus === 'scheduled' ? 'Хуваарьт' : p.auctionStatus === 'ended' ? 'Дууссан' : p.auctionStatus || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                    <button onClick={() => navigate(`/products/${p._id}`)}
                      style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FiExternalLink size={11} /> Харах
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const SellerDashboard = () => {
  const [active, setActive] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [endedUnsold, setEndedUnsold] = useState([]);
  const [sold, setSold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [activeRes, scheduledRes, endedRes, soldRes] = await Promise.all([
          axios.get(buildApiUrl('/api/product/my/active')),
          axios.get(buildApiUrl('/api/product/my/scheduled')),
          axios.get(buildApiUrl('/api/product/my/ended-unsold')),
          axios.get(buildApiUrl('/api/product/my/sold')),
        ]);
        setActive(activeRes.data || []);
        setScheduled(scheduledRes.data || []);
        setEndedUnsold(endedRes.data || []);
        setSold(soldRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load seller dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Ачаалж байна...</div>
  );
  if (error) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>{error}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard type="active"    count={active.length} />
        <StatCard type="scheduled" count={scheduled.length} />
        <StatCard type="ended"     count={endedUnsold.length} />
        <StatCard type="sold"      count={sold.length} />
      </div>
      {/* Product sections */}
      <ProductSection type="active"    items={active} />
      <ProductSection type="scheduled" items={scheduled} />
      <ProductSection type="ended"     items={endedUnsold} />
      <ProductSection type="sold"      items={sold} />
    </div>
  );
};
