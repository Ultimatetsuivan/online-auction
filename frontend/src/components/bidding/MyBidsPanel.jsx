import React, { useEffect, useState } from 'react';
import axios from '../../utils/axios';
import { buildApiUrl } from '../../config/api';
import { FiTrendingUp, FiAward, FiAlertTriangle } from 'react-icons/fi';

const BidList = ({ title, icon, items }) => {
  return (
    <div className="col-md-4">
      <div className="card h-100 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <span className="me-2 text-primary">{icon}</span>
            <h5 className="mb-0">{title}</h5>
            <span className="badge bg-light text-muted ms-auto">{items.length}</span>
          </div>
          {items.length === 0 ? (
            <p className="text-muted mb-0">No items yet.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {items.map((item) => (
                <li key={item.productId} className="list-group-item px-0">
                  <div className="d-flex align-items-center">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="rounded me-3"
                        style={{ width: 56, height: 56, objectFit: 'cover' }}
                      />
                    )}
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{item.title}</div>
                      <div className="small text-muted">
                        Your bid: ₮{item.userMaxBid?.toLocaleString()} · Current: ₮{(item.currentHighestBid || item.finalPrice || 0).toLocaleString()}
                      </div>
                      <div className="small">
                        {item.auctionStatus && (
                          <span className="badge bg-light text-dark me-2">{item.auctionStatus}</span>
                        )}
                        {item.isLeading && <span className="badge bg-success text-white">Leading</span>}
                        {item.result === 'won' && <span className="badge bg-success text-white">Won</span>}
                        {item.result === 'lost' && <span className="badge bg-danger text-white">Lost</span>}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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

  if (loading) {
    return <div className="alert alert-info">Loading your bidding activity...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="row g-3">
      <BidList title="My bids" icon={<FiTrendingUp />} items={bids} />
      <BidList title="Wins" icon={<FiAward />} items={wins} />
      <BidList title="Losses" icon={<FiAlertTriangle />} items={losses} />
    </div>
  );
};
