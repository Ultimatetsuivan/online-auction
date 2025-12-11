import React, { useEffect, useState } from 'react';
import axios from '../../utils/axios';
import { buildApiUrl } from '../../config/api';
import { FiPlayCircle, FiClock, FiAlertOctagon, FiCheckCircle } from 'react-icons/fi';

const ProductList = ({ title, icon, items }) => (
  <div className="col-md-6">
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <span className="me-2 text-primary">{icon}</span>
          <h5 className="mb-0">{title}</h5>
          <span className="badge bg-light text-muted ms-auto">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <p className="text-muted mb-0">No listings here yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td className="fw-semibold">{p.title}</td>
                    <td>₮{(p.currentBid || p.price || 0).toLocaleString()}</td>
                    <td>
                      <span className="badge bg-light text-dark text-uppercase">{p.auctionStatus || 'n/a'}</span>
                      {p.sold && <span className="badge bg-success text-white ms-1">Sold</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
);

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

  if (loading) return <div className="alert alert-info">Loading your listings...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="row g-3">
      <ProductList title="Active auctions" icon={<FiPlayCircle />} items={active} />
      <ProductList title="Scheduled" icon={<FiClock />} items={scheduled} />
      <ProductList title="Ended - relist" icon={<FiAlertOctagon />} items={endedUnsold} />
      <ProductList title="Sold" icon={<FiCheckCircle />} items={sold} />
    </div>
  );
};
