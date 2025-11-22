import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { io } from 'socket.io-client';
import { CountdownTimer } from '../../components/Timer';
import { apiConfig, buildApiUrl } from '../../config/api';
import { useToast } from '../../components/common/Toast';
import { SkeletonProductDetail } from '../../components/common/Skeleton';
import { LikeButton } from '../../components/LikeButton';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const Details = () => {
  const toast = useToast();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const { id: productId } = useParams();
  const navigate = useNavigate();

  // Number formatting helpers
  const formatNumber = (value) => {
    if (!value) return '';
    const numericValue = value.toString().replace(/[^\d]/g, '');
    if (!numericValue) return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const unformatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
  };

  const [productDetails, setProductDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [userBidAmount, setUserBidAmount] = useState('');
  const [socketConnection, setSocketConnection] = useState(null);
  const [pastBids, setPastBids] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [bidError, setBidError] = useState(null);
  const [isUserOutbid, setIsUserOutbid] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const historyPreviewCount = 8;

  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse stored user', error);
      return null;
    }
  }, []);
  const visibleBids = historyExpanded ? pastBids : pastBids.slice(0, historyPreviewCount);
  const hasMoreHistory = pastBids.length > historyPreviewCount;
  const groupedHistory = useMemo(() => {
    const map = new Map();
    pastBids.forEach((bid) => {
      if (!bid) return;
      const userId = bid.user && typeof bid.user === 'object'
        ? bid.user._id || bid.user.id
        : bid.user || bid.userId || 'anonymous';
      const existing = map.get(userId) || {
        userName: bid.user?.name || 'Anonymous',
        count: 0,
        lastAmount: bid.price,
        lastTime: bid.createdAt
      };
      existing.count += 1;
      if (bid.createdAt && (!existing.lastTime || new Date(bid.createdAt) > new Date(existing.lastTime))) {
        existing.lastTime = bid.createdAt;
        existing.lastAmount = bid.price;
      }
      map.set(userId, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [pastBids]);

  const isOwner = useMemo(() => {
    if (!currentUser || !productDetails) return false;
    const ownerId = productDetails.user?._id || productDetails.user?.id || productDetails.user;
    const userId = currentUser._id || currentUser.id;
    return ownerId && userId && ownerId === userId;
  }, [currentUser, productDetails]);

  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
  };
  
  const nextImage = () => {
    setCurrentImageIndex(prev => 
      (prev + 1) % productDetails.images.length
    );
  };
  const prevImage = () => {
    setCurrentImageIndex(prev => 
      (prev - 1 + productDetails.images.length) % productDetails.images.length
    );
  };
  useEffect(() => {
    const token = getAuthToken();
    const socket = io(apiConfig.socketURL, {
      withCredentials: true,
      transports: ['websocket'],
      query: token ? { token } : {}
    });
    setSocketConnection(socket);

    return () => socket.disconnect();
  }, []);

  const checkBidStatus = async (productId) => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await axios.get(
        buildApiUrl(`/api/bidding/check-bid-status/${productId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.isOutbid;
    } catch (error) {
      console.error('Error checking bid status:', error);
      return false;
    }
  };

  useEffect(() => {
    const getProductData = async () => {
      try {
        setIsLoading(true);
        
        const [productInfo, bidHistory, allProducts] = await Promise.all([
          axios.get(buildApiUrl(`/api/product/${productId}`)),
          axios.get(buildApiUrl(`/api/bidding/${productId}`)),
          axios.get(buildApiUrl('/api/product/products'))
        ]);
  
        setProductDetails(productInfo.data);
        setPastBids(bidHistory.data?.history || []);
        
        // Handle different response formats
        const products = Array.isArray(allProducts.data) 
          ? allProducts.data 
          : allProducts.data?.data || [];
        
        const similarProducts = products
          .filter(p => 
            p._id !== productId && 
            (p.category === productInfo.data.category || 
             p.category?._id === productInfo.data.category)
          )
          .sort(() => 0.5 - Math.random()) 
          .slice(0, 4); 
        
        setRecommendedProducts(similarProducts);
        
        const outbidStatus = await checkBidStatus(productId);
        setIsUserOutbid(outbidStatus);
        
        const currentPrice = productInfo.data.currentBid || productInfo.data.price;
        setUserBidAmount(currentPrice + 1000);
        
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Couldn't load product details");
      } finally {
        setIsLoading(false);
      }
    };
  
    getProductData();
  }, [productId]);

  useEffect(() => {
    if (!socketConnection || !productDetails) return;

    const handlePriceUpdate = async (updatedProduct) => {
      if (updatedProduct._id === productDetails._id) {
        const outbidStatus = await checkBidStatus(updatedProduct._id);
        setIsUserOutbid(outbidStatus);
        
        setProductDetails(updatedProduct);
        setUserBidAmount(updatedProduct.currentBid + 500);
      }
    };

    const handleNewBidNotification = (newBid) => {
      if (newBid.product === productDetails._id) {
        setPastBids(previousBids => [newBid, ...previousBids]);
      }
    };

    socketConnection.on('bidUpdate', handlePriceUpdate);
    socketConnection.on('newBid', handleNewBidNotification);
    socketConnection.on('bidError', (error) => setErrorMessage(error.message));

    return () => {
      socketConnection.off('bidUpdate', handlePriceUpdate);
      socketConnection.off('newBid', handleNewBidNotification);
      socketConnection.off('bidError');
    };
  }, [socketConnection, productDetails]);

  const submitBid = async () => {
    const token = getAuthToken();

    if (!token) {
      navigate('/login');
      return;
    }

    setBidError(null);

    // Unformat the bid amount to get the actual number
    const bidValue = parseFloat(unformatNumber(userBidAmount)) || 0;

    const minimumBid = (productDetails.currentBid || productDetails.price) + 1;
    if (bidValue <= minimumBid) {
      setBidError("Та илүү өндөр үнэ санал болгох ёстой.");
      return;
    }

    try {
      const response = await axios.post(
        buildApiUrl('/api/bidding/'),
        {
          productId: productDetails._id,
          price: bidValue,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.sold) {
        socketConnection.emit('productSold', {
          productId: productDetails._id,
          buyerId: response.data.buyerId,
          price: userBidAmount
        });
        toast.success(`Та энэ барааг ${userBidAmount}₮-р худалдан авлаа!`);
      } else {
        socketConnection.emit('bidUpdate', response.data.product);
        socketConnection.emit('newBid', response.data.bid);
        toast.success("Амжилттай үнэ өглөө");

        setIsUserOutbid(false);
      }

      setProductDetails(response.data.product);
      setPastBids(previousBids => [response.data.bid, ...previousBids]);
      setUserBidAmount(response.data.product.currentBid + 500); 
      
    } catch (error) {
      console.error('Bidding error:', error);
      setBidError(error.response?.data?.message || 'Үнийн санал өгөхөд алдаа гарлаа');
    }
  };

  const handleOwnerManageShortcut = () => {
    if (!productDetails) return;
    localStorage.setItem('pendingProductManage', productDetails._id);
    navigate(`/profile?tab=myProducts&highlight=${productDetails._id}`);
  };

  const handleDeleteListing = async () => {
    if (!productDetails?._id) return;
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to remove this listing?');
    if (!confirmDelete) return;

    try {
      await axios.delete(buildApiUrl(`/api/product/${productDetails._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Listing removed successfully');
      navigate('/products');
    } catch (error) {
      console.error('Delete listing error:', error);
      toast.error(error.response?.data?.message || 'Unable to remove listing right now.');
    }
  };

  if (isLoading) {
    return (
      <div className="container my-4">
        <SkeletonProductDetail />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">
          <h5>Алдаа гарлаа</h5>
          <p>{errorMessage}</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Дахин оролдох
          </button>
        </div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="container my-5">
        <div className="alert alert-info">
          <h5>Product not found</h5>
          <Link to="/products" className="btn btn-outline-primary">
            View other products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4 shadow-sm">
            <div className="row g-0">
              <div className="col-md-6 position-relative">
                <div 
                  id="productCarousel" 
                  className="carousel slide"
                  style={{ height: '100%' }}
                >
                  <div className="carousel-inner" style={{ height: '100%' }}>
                    {productDetails.images.map((image, index) => (
                      <div 
                        key={index}
                        className={`carousel-item ${index === currentImageIndex ? 'active' : ''}`}
                        style={{ height: '100%' }}
                      >
                        <img
                          src={image.url || '/default.png'}
                          className="d-block w-100"
                          alt={`Product view ${index + 1}`}
                          style={{
                            height: '400px',
                            objectFit: 'contain',
                            backgroundColor: '#f8f9fa'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {productDetails.images.length > 1 && (
                    <>
                      <button 
                        className="carousel-control-prev"
                        type="button"
                        onClick={prevImage}
                        style={{ width: '40px' }}
                      >
                        <span className="carousel-control-prev-icon bg-dark rounded-circle p-2"></span>
                      </button>
                      <button 
                        className="carousel-control-next"
                        type="button"
                        onClick={nextImage}
                        style={{ width: '40px' }}
                      >
                        <span className="carousel-control-next-icon bg-dark rounded-circle p-2"></span>
                      </button>
                    </>
                  )}
                </div>

                {productDetails.images.length > 1 && (
                  <div className="carousel-indicators position-static mt-2">
                    {productDetails.images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`mx-1 ${index === currentImageIndex ? 'active' : ''}`}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: index === currentImageIndex ? '#FF6A00' : '#6c757d'
                        }}
                        onClick={() => setCurrentImageIndex(index)}
                      ></button>
                    ))}
                  </div>
                )}
              </div>
              

              
              <div className="col-md-6">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h1 className="card-title flex-grow-1">{productDetails.title}</h1>
                    {productDetails && (
                      <LikeButton product={productDetails} size="lg" />
                    )}
                  </div>
                  <p className="card-text text-muted mb-4">{productDetails.description}</p>
                  
                  <div className="pricing-section mb-4 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Одоогийн үнэ:</span>
                      <span className="fs-4 text-danger fw-bold">
                        ₮{formatNumber((productDetails.currentBid || productDetails.price).toString())}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">Үндсэн үнэ:</small>
                      <small className="text-muted">₮{formatNumber(productDetails.price.toString())}</small>
                    </div>
                  </div>

                  <div className="auction-timer mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Үлдсэн цаг:</span>
                      <CountdownTimer deadline={productDetails.bidDeadline} />
                    </div>
                  </div>

                  {isOwner && (
                    <div
                      className="alert alert-info border-0 mb-4"
                      style={{ border: '1px dashed rgba(0,0,0,0.2)' }}
                    >
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-badge me-2"></i>
                          <strong>{t('myProducts')}</strong>
                        </div>
                        <span className="badge bg-white text-primary border">
                          {pastBids.length} bids tracked
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={handleOwnerManageShortcut}
                        >
                          <i className="bi bi-sliders me-1"></i>
                          {t('settings')}
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          type="button"
                          onClick={handleDeleteListing}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Delete
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          type="button"
                          onClick={() => setHistoryExpanded(true)}
                        >
                          <i className="bi bi-clock-history me-1"></i>
                          Bid history
                        </button>
                      </div>
                    </div>
                  )}
                  {!productDetails.sold && (
                    <div className="bid-form mb-4">
                      <label htmlFor="bidAmount" className="form-label">
                        Таны санал (хамгийн бага ₮{formatNumber(((productDetails.currentBid || productDetails.price) + 1).toString())})
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₮</span>
                        <input
                          type="text"
                          id="bidAmount"
                          className="form-control"
                          value={userBidAmount}
                          onChange={(e) => setUserBidAmount(formatNumber(e.target.value))}
                          placeholder={(productDetails.currentBid || productDetails.price) + 1}
                        />
                        <button
                          className={`btn fw-bold ${isUserOutbid ? 'btn-danger' : 'btn-warning'}`}
                          type="button"
                          onClick={submitBid}
                        >
                          {isUserOutbid ? 'Таны үнийн санал хүчингүй боллоо!' : 'Үнийн санал өгөх'}
                        </button>
                      </div>
                      {bidError && (
                        <div className="alert alert-danger mt-2">
                          {bidError}
                        </div>
                      )}
                    </div>
                  )}

                  {productDetails.sold && (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Энэ бараа нь ₮{formatNumber(productDetails.currentBid.toString())} төгрөгөөр {new Date(productDetails.soldAt).toLocaleString()}-нд зарагдасан
                    </div>
                  )}

                  <div className="product-meta mt-4">
                    <h5 className="mb-3">Барааны мэдээлэл</h5>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Ангилал:</span>
                        <span>{productDetails.category?.name || 'Not specified'}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Эхэлсэн хугадаа:</span>
                        <span>{new Date(productDetails.createdAt).toLocaleDateString()}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>Төлөв:</span>
                        <span className={productDetails.sold ? 'text-success' : 'text-warning'}>
                          {productDetails.sold ? 'Sold' : 'Available'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h2 className="h5 mb-0">Үнийн саналууд</h2>
            </div>
            <div className="card-body">
              {pastBids.length > 0 ? (
                <>
                  {groupedHistory.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {groupedHistory.slice(0, 4).map((summary, index) => (
                        <div key={`${summary.userName}-${index}`} className={`badge ${isDarkMode ? 'bg-secondary text-white' : 'bg-light text-dark'}`}>
                          <strong>{summary.userName}</strong>
                          <span className={`ms-2 ${isDarkMode ? 'text-light' : 'text-muted'}`}>{summary.count} bids</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Bidder</th>
                        <th>Amount</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBids.map((bid) => (
                        bid ? (
                          <tr key={bid._id || bid.createdAt}>
                            <td>{bid.user?.name || 'Anonymous'}</td>
                            <td className="fw-bold">₮{bid.price?.toLocaleString() || 'N/A'}</td>
                            <td>{bid.createdAt ? new Date(bid.createdAt).toLocaleString() : 'Unknown'}</td>
                          </tr>
                        ) : null
                      ))}
                    </tbody>
                  </table>
                </div>
                  {hasMoreHistory && (
                    <div className="text-center mt-3">
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setHistoryExpanded(prev => !prev)}
                      >
                        {historyExpanded ? 'Hide older history' : 'View entire history'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-clock-history fs-1 text-muted mb-3"></i>
                  <p className="text-muted">Ямар нэгэн үнийн санал ирээгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div
            className="card mb-4 shadow-sm"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => navigate(`/profile/${productDetails.user?._id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div className="card-header bg-info text-white">
              <h2 className="h5 mb-0">Худалдагч</h2>
            </div>
            <div className="card-body text-center">
              <img
                src={productDetails.user?.photo?.filePath || '/default.png'}
                className="rounded-circle mb-3 seller-avatar"
                alt="Seller"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  border: '3px solid #17a2b8'
                }}
              />
              <h3 className="h5 mb-1">{productDetails.user?.name || 'Нууц хэрэглэгч'}</h3>
              <p className="text-muted small mb-1">{productDetails.user?.email || ''}</p>
              <p className="mb-2">{productDetails.user?.phone || ''}</p>
              <span className="badge bg-info">
                <i className="bi bi-cursor-fill me-1"></i>
                Профайл үзэх
              </span>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-warning text-white">
              <h2 className="h5 mb-0">Ижил төстэй бараанууд</h2>
            </div>
            <div className="card-body">
              {recommendedProducts.length > 0 ? (
                <div className="list-group">
                  {recommendedProducts.map((product) => (
                    <Link 
                      key={product._id} 
                      to={`/products/${product._id}`} 
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex align-items-center">
                        <img 
                          src={product.images?.find(img => img.isPrimary)?.url || '/default.png'}
                          alt={product.title}
                          className="rounded me-3"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />

                        <div>
                          <h3 className="h6 mb-1">{product.title}</h3>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Үнэ:</span>
                            <span className="fw-bold">₮{formatNumber((product.currentBid || product.price).toString())}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-box-seam fs-1 text-muted mb-3"></i>
                  <p className="text-muted">Ижил төстэй бараа олдсонгүй</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;


