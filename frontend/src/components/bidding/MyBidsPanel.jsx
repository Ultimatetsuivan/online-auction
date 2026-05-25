import React, { useEffect, useState } from 'react';
import axios from '../../utils/axios';
import { buildApiUrl } from '../../config/api';
import { FiTrendingUp, FiAward, FiAlertTriangle, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const SECTION_CONFIG = {
  bids:   { label: 'Идэвхтэй саналууд', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: <FiTrendingUp size={18} /> },
  wins:   { label: 'Хожлууд',           color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <FiAward size={18} /> },
  losses: { label: 'Хожигдсон',         color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <FiAlertTriangle size={18} /> },
};

const StatCard = ({ type, count }) => {
  const cfg = SECTION_CONFIG[type];
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

const BidSection = ({ type, items }) => {
  const navigate = useNavigate();
  const cfg = SECTION_CONFIG[type];

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
        <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>Одоогоор зүйл байхгүй байна.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, i) => (
            <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              {item.image ? (
                <img src={item.image} alt={item.title} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid #e2e8f0' }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 8, background: '#f1f5f9', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Таны санал: <span style={{ fontWeight: 700, color: 'var(--bn-accent)' }}>₮{item.userMaxBid?.toLocaleString()}</span>
                  {' · '}
                  Одоогийн: <span style={{ fontWeight: 600, color: '#475569' }}>₮{(item.currentHighestBid || item.finalPrice || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {item.auctionStatus && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#f1f5f9', color: '#64748b' }}>{item.auctionStatus}</span>
                  )}
                  {item.isLeading && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#dcfce7', color: '#16a34a' }}>Түрүүлж байна</span>
                  )}
                  {item.result === 'won' && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#dcfce7', color: '#16a34a' }}>Хожсон</span>
                  )}
                  {item.result === 'lost' && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#fef2f2', color: '#dc2626' }}>Хожигдсон</span>
                  )}
                </div>
              </div>
              <button onClick={() => navigate(`/products/${item.productId}`)}
                style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 11px', fontSize: 11, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <FiExternalLink size={11} /> Харах
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MyBidsPanel = () => {
  const [bids, setBids] = useState([]);
  const [wins, setWins] = useState([]);
  const [losses, setLosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [bidsRes, winsRes, lossesRes] = await Promise.all([
          axios.get(buildApiUrl('/api/bidding/my')),
          axios.get(buildApiUrl('/api/bidding/my-wins')),
          axios.get(buildApiUrl('/api/bidding/my-losses')),
        ]);
        setBids(bidsRes.data?.bids || []);
        setWins(winsRes.data?.wins || []);
        setLosses(lossesRes.data?.losses || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bidding info');
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <StatCard type="bids"   count={bids.length} />
        <StatCard type="wins"   count={wins.length} />
        <StatCard type="losses" count={losses.length} />
      </div>
      {/* Sections */}
      <BidSection type="bids"   items={bids} />
      <BidSection type="wins"   items={wins} />
      <BidSection type="losses" items={losses} />
    </div>
  );
};
