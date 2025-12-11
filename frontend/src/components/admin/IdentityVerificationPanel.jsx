import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IdentityVerificationPanel.css';

const IdentityVerificationPanel = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPendingVerifications();
    fetchStats();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/identity-verification/pending`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingVerifications(response.data.users || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      alert('Баталгаажуулалт татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/identity-verification/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('Энэ хэрэглэгчийг баталгаажуулах уу?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/identity-verification/approve/${userId}`,
        { notes: reviewNotes },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Амжилттай баталгаажууллаа!');
      setSelectedUser(null);
      setReviewNotes('');
      fetchPendingVerifications();
      fetchStats();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Баталгаажуулахад алдаа гарлаа');
    }
  };

  const handleReject = async (userId) => {
    const reason = window.prompt('Татгалзсан шалтгаанаа оруулна уу:');
    if (!reason || reason.trim().length === 0) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/identity-verification/reject/${userId}`,
        { reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Баталгаажуулалт татгалзагдлаа');
      setSelectedUser(null);
      fetchPendingVerifications();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Татгалзахад алдаа гарлаа');
    }
  };

  const openReview = (user) => {
    setSelectedUser(user);
    setReviewNotes('');
  };

  const openImageInNewTab = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="identity-panel-loading">Ачааллаж байна...</div>;
  }

  return (
    <div className="identity-verification-panel">
      <h2>本人確認 - Хувийн мэдээлэл баталгаажуулалт</h2>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Нийт хэрэглэгч</div>
          </div>
          <div className="stat-card verified">
            <div className="stat-value">{stats.verified}</div>
            <div className="stat-label">Баталгаажсан</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Хүлээгдэж буй</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Татгалзсан</div>
          </div>
          <div className="stat-card rate">
            <div className="stat-value">{stats.verificationRate}%</div>
            <div className="stat-label">Баталгаажсан хувь</div>
          </div>
        </div>
      )}

      <p className="verification-count">Хүлээгдэж буй: {pendingVerifications.length}</p>

      {pendingVerifications.length === 0 ? (
        <div className="no-verifications">
          <p>Хүлээгдэж буй баталгаажуулалт байхгүй байна</p>
        </div>
      ) : (
        <div className="verifications-grid">
          {pendingVerifications.map((user) => (
            <div key={user._id} className="verification-card">
              <div className="user-info">
                <div className="user-header">
                  {user.photo?.filePath && (
                    <img src={user.photo.filePath} alt={user.name} className="user-avatar" />
                  )}
                  <div>
                    <h3>{user.name}</h3>
                    <p className="user-email">{user.email}</p>
                    {user.phone && <p className="user-phone">☎ {user.phone}</p>}
                  </div>
                </div>
                <p className="requested-at">
                  Хүсэлт: {new Date(user.identityVerification.requestedAt).toLocaleString('mn-MN')}
                </p>
                <p className="member-since">
                  Бүртгэсэн: {new Date(user.createdAt).toLocaleDateString('mn-MN')}
                </p>
              </div>

              <div className="documents-preview">
                <h4>Баримт бичгүүд</h4>
                <div className="documents-grid">
                  {user.identityVerification.documents.idCardFront?.url && (
                    <div className="document-item">
                      <img
                        src={user.identityVerification.documents.idCardFront.url}
                        alt="ID Front"
                        onClick={() => openImageInNewTab(user.identityVerification.documents.idCardFront.url)}
                      />
                      <span className="document-label">Үнэмлэх (урд)</span>
                    </div>
                  )}
                  {user.identityVerification.documents.idCardBack?.url && (
                    <div className="document-item">
                      <img
                        src={user.identityVerification.documents.idCardBack.url}
                        alt="ID Back"
                        onClick={() => openImageInNewTab(user.identityVerification.documents.idCardBack.url)}
                      />
                      <span className="document-label">Үнэмлэх (ар)</span>
                    </div>
                  )}
                  {user.identityVerification.documents.selfieWithId?.url && (
                    <div className="document-item">
                      <img
                        src={user.identityVerification.documents.selfieWithId.url}
                        alt="Selfie"
                        onClick={() => openImageInNewTab(user.identityVerification.documents.selfieWithId.url)}
                      />
                      <span className="document-label">Үнэмлэхтэй селфи</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-review"
                  onClick={() => openReview(user)}
                >
                  Шалгах
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedUser && (
        <div className="review-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Баталгаажуулалт шалгах</h3>
            <p className="modal-user-name">{selectedUser.name}</p>
            <p className="modal-user-email">{selectedUser.email}</p>

            {/* Full-size documents */}
            <div className="modal-documents">
              <div className="modal-document-section">
                <h4>Үнэмлэхний урд тал</h4>
                {selectedUser.identityVerification.documents.idCardFront?.url && (
                  <img
                    src={selectedUser.identityVerification.documents.idCardFront.url}
                    alt="ID Front"
                    className="modal-document-image"
                    onClick={() => openImageInNewTab(selectedUser.identityVerification.documents.idCardFront.url)}
                  />
                )}
              </div>

              <div className="modal-document-section">
                <h4>Үнэмлэхний ар тал</h4>
                {selectedUser.identityVerification.documents.idCardBack?.url && (
                  <img
                    src={selectedUser.identityVerification.documents.idCardBack.url}
                    alt="ID Back"
                    className="modal-document-image"
                    onClick={() => openImageInNewTab(selectedUser.identityVerification.documents.idCardBack.url)}
                  />
                )}
              </div>

              <div className="modal-document-section">
                <h4>Үнэмлэх барьсан селфи</h4>
                {selectedUser.identityVerification.documents.selfieWithId?.url && (
                  <img
                    src={selectedUser.identityVerification.documents.selfieWithId.url}
                    alt="Selfie"
                    className="modal-document-image"
                    onClick={() => openImageInNewTab(selectedUser.identityVerification.documents.selfieWithId.url)}
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Админы тэмдэглэл (заавал биш)</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Шалгалтын тэмдэглэл..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-approve"
                onClick={() => handleApprove(selectedUser._id)}
              >
                ✓ Баталгаажуулах
              </button>
              <button
                className="btn-reject"
                onClick={() => handleReject(selectedUser._id)}
              >
                ✗ Татгалзах
              </button>
              <button
                className="btn-cancel"
                onClick={() => setSelectedUser(null)}
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

export default IdentityVerificationPanel;
