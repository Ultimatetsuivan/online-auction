import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VerificationPanel.css';

const VerificationPanel = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [badgeType, setBadgeType] = useState('basic');
  const [issueCertificate, setIssueCertificate] = useState(false);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/verification/pending`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingVerifications(response.data.products || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      alert('Баталгаажуулалт татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    if (!window.confirm('Энэ бүтээгдэхүүнийг баталгаажуулах уу?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/verification/approve/${productId}`,
        {
          badgeType,
          issueCertificate,
          notes: reviewNotes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Амжилттай баталгаажууллаа!');
      setSelectedProduct(null);
      setReviewNotes('');
      setBadgeType('basic');
      setIssueCertificate(false);
      fetchPendingVerifications();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Баталгаажуулахад алдаа гарлаа');
    }
  };

  const handleReject = async (productId) => {
    const reason = window.prompt('Татгалзсан шалтгаанаа оруулна уу:');
    if (!reason || reason.trim().length === 0) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/verification/reject/${productId}`,
        { reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Баталгаажуулалт татгалзагдлаа');
      setSelectedProduct(null);
      fetchPendingVerifications();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Татгалзахад алдаа гарлаа');
    }
  };

  const openReview = (product) => {
    setSelectedProduct(product);
    setReviewNotes('');
    setBadgeType('basic');
    setIssueCertificate(false);
  };

  if (loading) {
    return <div className="verification-panel-loading">Ачааллаж байна...</div>;
  }

  return (
    <div className="verification-panel">
      <h2>Баталгаажуулалт хүлээгдэж буй бараанууд</h2>
      <p className="verification-count">Нийт: {pendingVerifications.length}</p>

      {pendingVerifications.length === 0 ? (
        <div className="no-verifications">
          <p>Хүлээгдэж буй баталгаажуулалт байхгүй байна</p>
        </div>
      ) : (
        <div className="verifications-grid">
          {pendingVerifications.map((product) => (
            <div key={product._id} className="verification-card">
              <div className="product-info">
                <h3>{product.title}</h3>
                <p className="category">{product.category}</p>
                <p className="brand">{product.brand}</p>
                <p className="seller">
                  Зарагч: {product.user?.name} ({product.user?.email})
                </p>
                <p className="requested-at">
                  Хүсэлт: {new Date(product.verification.requestedAt).toLocaleString('mn-MN')}
                </p>
              </div>

              <div className="verification-photos">
                <h4>Баталгаажуулах зургууд ({product.verification.photos?.length || 0})</h4>
                <div className="photos-grid">
                  {product.verification.photos?.map((photo, index) => (
                    <div key={index} className="photo-item">
                      <img src={photo.url} alt={photo.type} />
                      <span className="photo-label">
                        {photo.type}
                        {photo.required && <span className="required-badge">*</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-review"
                  onClick={() => openReview(product)}
                >
                  Шалгах
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedProduct && (
        <div className="review-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Баталгаажуулалт шалгах</h3>
            <p className="modal-product-title">{selectedProduct.title}</p>

            <div className="form-group">
              <label>Бэлгийн төрөл</label>
              <select value={badgeType} onChange={(e) => setBadgeType(e.target.value)}>
                <option value="basic">Үндсэн (Ногоон)</option>
                <option value="premium">Түвшин дээд (Мөнгөлөг)</option>
                <option value="luxury">Тансаг (Алтан)</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={issueCertificate}
                  onChange={(e) => setIssueCertificate(e.target.checked)}
                />
                Гэрчилгээ олгох
              </label>
            </div>

            <div className="form-group">
              <label>Тэмдэглэл (заавал биш)</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Админы тэмдэглэл..."
                rows={4}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-approve"
                onClick={() => handleApprove(selectedProduct._id)}
              >
                ✓ Баталгаажуулах
              </button>
              <button
                className="btn-reject"
                onClick={() => handleReject(selectedProduct._id)}
              >
                ✗ Татгалзах
              </button>
              <button
                className="btn-cancel"
                onClick={() => setSelectedProduct(null)}
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPanel;
