import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import "../../index.css";
import { buildApiUrl } from '../../config/api';
import { useToast } from '../../components/common/Toast';

const UserProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productError, setProductError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = storedUser?.token || localStorage.getItem('token');
        const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        // Try fetch user info (best effort; ignore failure)
        try {
          const userRes = await axios.get(buildApiUrl(`/api/users/${id}`), authConfig);
          setUser(userRes.data);
        } catch {
          // Endpoint may not exist; continue
        }

        // Fetch products and filter by this user (primary data, avoids admin-only endpoint)
        try {
          const prodRes = await axios.get(buildApiUrl(`/api/product/products`), authConfig);
          const all = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []);
          const prodData = all.filter(p => {
            const sellerId =
              (typeof p.user === 'object' && p.user?._id) ? p.user._id.toString()
                : (typeof p.seller === 'object' && p.seller?._id) ? p.seller._id.toString()
                : (typeof p.user === 'string') ? p.user
                : (typeof p.seller === 'string') ? p.seller
                : '';
            return sellerId === id;
          });
          setProducts(prodData);

          // Derive user if not loaded
          if (!user && Array.isArray(prodData) && prodData.length > 0) {
            const any = prodData.find(p => p.user || p.seller);
            if (any) {
              const seller = any.user || any.seller;
              setUser({
                _id: id,
                name: seller?.name || 'User',
                email: seller?.email || '',
                photo: seller?.photo
              });
            }
          }
        } catch (e) {
          setProducts([]);
          setProductError('Failed to load user products');
        }

      } catch (err) {
        // Only set a hard error if absolutely nothing could be loaded
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // Check if current user is following this profile
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = storedUser?.token;

        if (!token || !id) return;

        const response = await axios.get(buildApiUrl('/api/mylist/following'), {
          headers: { Authorization: `Bearer ${token}` }
        });

        const isFollowingUser = response.data.some(f => f.following?._id === id);
        setIsFollowing(isFollowingUser);
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    };

    checkFollowStatus();
  }, [id]);

  const handleFollowToggle = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const token = storedUser?.token;
      const currentUserId = storedUser?._id;

      if (!token) {
        toast.error('Please login to follow users');
        navigate('/login');
        return;
      }

      // Don't allow following yourself
      if (currentUserId === id) {
        toast.error('You cannot follow yourself');
        return;
      }

      setFollowLoading(true);

      if (isFollowing) {
        // Unfollow
        await axios.delete(buildApiUrl(`/api/mylist/follow/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await axios.post(buildApiUrl(`/api/mylist/follow/${id}`), {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(true);
        toast.success('Following successfully');
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      toast.error(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container my-5">
        <div className="text-center">
          <div className="spinner-border" role="status" style={{ color: '#FF6A00' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Even if user API failed, we can still render based on products; only block on a fatal error
  // Keep soft errors inline on page

  return (
    <div className="container my-4">
      {error && (
        <div className="alert alert-warning mb-3">Some profile details could not be loaded.</div>
      )}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={user?.photo?.filePath || '/default.png'}
                alt={user?.name || 'User'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
          <div>
            <h3 className="mb-1">{user?.name || 'User'}</h3>
            {user?.email && <div className="text-muted">{user.email}</div>}
            <div className="small text-muted">{products.length} products</div>
          </div>
        </div>

        {/* Follow Button */}
        <div>
          <button
            className={`btn ${isFollowing ? 'btn-outline-secondary' : 'btn-primary'}`}
            onClick={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading...
              </>
            ) : isFollowing ? (
              <>
                <i className="bi bi-person-check me-2"></i>
                Following
              </>
            ) : (
              <>
                <i className="bi bi-person-plus me-2"></i>
                Follow
              </>
            )}
          </button>
        </div>
      </div>

      {productError && (
        <div className="alert alert-warning">Could not load products for this user.</div>
      )}

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {products.map((product) => (
          <div className="col" key={product._id}>
            <div className="card h-100 product-card">
              {product.image && (
                <img
                  src={product.image}
                  className="card-img-top product-image"
                  alt={product.title}
                  onClick={() => navigate(`/products/${product._id}`)}
                  style={{ cursor: 'pointer' }}
                />
              )}
              <div className="card-body">
                <h5 className="card-title">{product.title}</h5>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-primary">{product.currentBid}₮</span>
                  <span className={`badge ${product.sold ? 'bg-success' : 'bg-secondary'}`}>
                    {product.sold ? 'Зарагдсан' : 'Зарагдаагүй'}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    Дэлгэрэнгүй
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-12">
            <div className="alert alert-info">No products found for this user.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;


