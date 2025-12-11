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
import { PriceHistoryChart } from '../../components/PriceHistoryChart';

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
  const [reserveMet, setReserveMet] = useState(true);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: null, count: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [sellerStats, setSellerStats] = useState({ averageRating: null, count: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [isUserWinning, setIsUserWinning] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winData, setWinData] = useState(null);
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

  const isWinner = useMemo(() => {
    if (!currentUser || !productDetails || !productDetails.sold) return false;
    const winnerId = productDetails.soldTo?._id || productDetails.soldTo?.id || productDetails.soldTo;
    const userId = currentUser._id || currentUser.id;
    return winnerId && userId && winnerId === userId;
  }, [currentUser, productDetails]);

  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token || localStorage.getItem('token');
  };

  const fetchReviews = async (pId, sellerId) => {
    try {
      const [productReviewRes, sellerReviewRes] = await Promise.all([
        axios.get(buildApiUrl(`/api/reviews/product/${pId}`)),
        sellerId ? axios.get(buildApiUrl(`/api/reviews/user/${sellerId}`)) : Promise.resolve({ data: {} })
      ]);
      setProductReviews(productReviewRes.data?.reviews || []);
      setReviewStats({
        averageRating: productReviewRes.data?.averageRating,
        count: productReviewRes.data?.count || 0
      });
      setSellerStats({
        averageRating: sellerReviewRes.data?.averageRating,
        count: sellerReviewRes.data?.count || 0
      });
    } catch (err) {
      console.error('Review fetch error', err);
    }
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
        setReserveMet(!productInfo.data?.reservePrice || (productInfo.data?.currentBid || productInfo.data?.price || 0) >= productInfo.data.reservePrice);

        // Ensure pastBids is always an array
        const bidsData = bidHistory.data?.history || bidHistory.data || [];
        setPastBids(Array.isArray(bidsData) ? bidsData : []);

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

        // Check if user is winning (top bidder)
        const bidsArray = Array.isArray(bidsData) ? bidsData : [];
        if (currentUser && bidsArray.length > 0) {
          const topBid = bidsArray[0];
          const topBidderId = topBid?.user?._id || topBid?.user?.id || topBid?.user;
          const currentUserId = currentUser._id || currentUser.id;
          setIsUserWinning(topBidderId === currentUserId && !outbidStatus);
        } else {
          setIsUserWinning(false);
        }

        const currentPrice = productInfo.data.currentBid || productInfo.data.price;
        setUserBidAmount(currentPrice + (productInfo.data.minIncrement || 1000));
        fetchReviews(productId, productInfo.data.user?._id);

        // Fetch buyer info if owner and product is sold
        if (productInfo.data.sold && productInfo.data.soldTo && currentUser) {
          const ownerId = productInfo.data.user?._id || productInfo.data.user?.id || productInfo.data.user;
          const userId = currentUser._id || currentUser.id;
          if (ownerId === userId) {
            try {
              const buyerId = productInfo.data.soldTo._id || productInfo.data.soldTo.id || productInfo.data.soldTo;
              const buyerResponse = await axios.get(buildApiUrl(`/api/user/${buyerId}`));
              setBuyerInfo(buyerResponse.data);
            } catch (err) {
              console.error('Failed to fetch buyer info:', err);
            }
          }
        }

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

        // Preserve user data from original productDetails to avoid losing seller information
        setProductDetails(prev => ({
          ...updatedProduct,
          user: prev.user || updatedProduct.user // Keep original user if available
        }));
        setReserveMet(!updatedProduct.reservePrice || (updatedProduct.currentBid || updatedProduct.price || 0) >= updatedProduct.reservePrice);
        setUserBidAmount(updatedProduct.currentBid + 500);
      }
    };

    const handleNewBidNotification = (newBid) => {
      if (newBid.product === productDetails._id) {
        setPastBids(previousBids => {
          const updated = [newBid, ...previousBids];

          // Update winning status
          if (currentUser) {
            const topBidderId = newBid?.user?._id || newBid?.user?.id || newBid?.user;
            const currentUserId = currentUser._id || currentUser.id;
            setIsUserWinning(topBidderId === currentUserId);
          }

          return updated;
        });
      }
    };

    const handleProductSold = (data) => {
      if (data.productId === productDetails._id) {
        // Check if current user is the winner
        const winnerId = data.buyerId;
        const userId = currentUser?._id || currentUser?.id;

        if (winnerId && userId && winnerId === userId) {
          // Current user won!
          setWinData({
            title: productDetails.title,
            price: data.price || productDetails.currentBid,
            image: productDetails.images?.[0]?.url,
            method: 'Auction'
          });
          setShowWinModal(true);
        }

        // Update product status
        setProductDetails(prev => ({
          ...prev,
          sold: true,
          soldTo: winnerId,
          auctionStatus: 'ended',
          soldAt: new Date().toISOString()
        }));
      }
    };

    socketConnection.on('bidUpdate', handlePriceUpdate);
    socketConnection.on('newBid', handleNewBidNotification);
    socketConnection.on('productSold', handleProductSold);
    socketConnection.on('bidError', (error) => setErrorMessage(error.message));

    return () => {
      socketConnection.off('bidUpdate', handlePriceUpdate);
      socketConnection.off('newBid', handleNewBidNotification);
      socketConnection.off('productSold', handleProductSold);
      socketConnection.off('bidError');
    };
  }, [socketConnection, productDetails, currentUser]);

  const submitBid = async () => {
    const token = getAuthToken();

    if (!token) {
      navigate('/login');
      return;
    }

    setBidError(null);

    // Unformat the bid amount to get the actual number
    const bidValue = parseFloat(unformatNumber(userBidAmount)) || 0;

    const minimumBid = (productDetails.currentBid || productDetails.price) + (productDetails.minIncrement || 1);
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
        setIsUserWinning(true); // User just placed the highest bid
      }

      setProductDetails(response.data.product);
      if (typeof response.data.reserveMet === 'boolean') {
        setReserveMet(response.data.reserveMet);
      }
      setPastBids(previousBids => [response.data.bid, ...previousBids]);
      setUserBidAmount(response.data.product.currentBid + (productDetails.minIncrement || 500));

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

  const handleBuyNow = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!productDetails?.buyNowPrice || productDetails.sold) return;
    setBuyNowLoading(true);
    try {
      const response = await axios.post(
        buildApiUrl(`/api/product/${productDetails._id}/buy-now`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Show celebration modal
      setWinData({
        title: productDetails.title,
        price: productDetails.buyNowPrice,
        image: productDetails.images?.[0]?.url,
        method: 'Buy Now'
      });
      setShowWinModal(true);

      setProductDetails(prev => ({
        ...prev,
        sold: true,
        soldTo: response.data.soldTo,
        currentBid: productDetails.buyNowPrice,
        auctionStatus: 'ended'
      }));
      setReserveMet(true);
      setShowReviewPrompt(true); // Show review prompt after successful purchase
    } catch (error) {
      console.error('Buy now error:', error);
      toast.error(error.response?.data?.message || 'Unable to complete buy now');
    } finally {
      setBuyNowLoading(false);
    }
  };

  const submitReview = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!productDetails?.user?._id) return;
    try {
      await axios.post(
        buildApiUrl('/api/reviews'),
        {
          productId: productDetails._id,
          toUserId: productDetails.user._id,
          rating: reviewRating,
          comment: reviewComment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Review submitted');
      setReviewComment('');
      setShowReviewPrompt(false); // Close review prompt after submission
      fetchReviews(productDetails._id, productDetails.user._id);
    } catch (error) {
      console.error('Review submit error:', error);
      toast.error(error.response?.data?.message || 'Unable to submit review');
    }
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

  const handleSellNowToTopBidder = async () => {
    if (!productDetails?._id || productDetails.sold) return;
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Check if there are any bids
    if (pastBids.length === 0) {
      toast.error('No bids yet. Cannot sell to top bidder.');
      return;
    }

    const topBid = pastBids[0];
    const topBidder = topBid?.user?.name || 'Anonymous';
    const topBidAmount = topBid?.price || productDetails.currentBid;

    // Show confirmation dialog with details
    const confirmMessage = `⚠️ CONFIRM INSTANT SALE\n\n` +
      `You are about to sell this item instantly to:\n\n` +
      `Buyer: ${topBidder}\n` +
      `Amount: $${formatNumber(topBidAmount.toString())}\n\n` +
      `This action is IRREVERSIBLE and will:\n` +
      `• End the auction immediately\n` +
      `• Mark the item as sold\n` +
      `• Notify the winning bidder\n\n` +
      `Are you absolutely sure you want to proceed?`;

    const firstConfirm = window.confirm(confirmMessage);
    if (!firstConfirm) return;

    // Second confirmation to prevent accidents
    const secondConfirm = window.confirm(
      `FINAL CONFIRMATION\n\n` +
      `This is your last chance to cancel.\n\n` +
      `Sell to ${topBidder} for $${formatNumber(topBidAmount.toString())}?`
    );
    if (!secondConfirm) return;

    try {
      const response = await axios.post(
        buildApiUrl(`/api/product/${productDetails._id}/sell-now`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Item sold to ${topBidder} for $${formatNumber(topBidAmount.toString())}!`);

      // Update product details to reflect sold status
      setProductDetails(prev => ({
        ...prev,
        sold: true,
        soldTo: response.data.soldTo || topBid?.user?._id,
        currentBid: topBidAmount,
        auctionStatus: 'ended',
        soldAt: new Date().toISOString()
      }));

      // Fetch buyer info for seller
      try {
        const buyerId = topBid?.user?._id || topBid?.user?.id;
        const buyerResponse = await axios.get(buildApiUrl(`/api/user/${buyerId}`));
        setBuyerInfo(buyerResponse.data);
      } catch (err) {
        console.error('Failed to fetch buyer info:', err);
      }

      // Emit socket event to notify bidders
      if (socketConnection) {
        socketConnection.emit('productSold', {
          productId: productDetails._id,
          buyerId: topBid?.user?._id,
          price: topBidAmount
        });
      }
    } catch (error) {
      console.error('Sell now error:', error);
      toast.error(error.response?.data?.message || 'Unable to complete instant sale. Please try again.');
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
      {/* Main Product Section - eBay Style */}
      <div className="row mb-4">
        {/* Left: Image Gallery */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body p-3">
              {/* Main Image with Controls */}
              <div className="position-relative mb-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <img
                  src={productDetails.images[currentImageIndex]?.url || '/default.png'}
                  className="d-block w-100"
                  alt={`Product view ${currentImageIndex + 1}`}
                  style={{
                    height: '450px',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />

                {/* Navigation Arrows */}
                {productDetails.images.length > 1 && (
                  <>
                    <button
                      className="position-absolute top-50 start-0 translate-middle-y btn btn-light rounded-circle ms-2"
                      onClick={prevImage}
                      style={{ width: '45px', height: '45px', opacity: 0.9 }}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <button
                      className="position-absolute top-50 end-0 translate-middle-y btn btn-light rounded-circle me-2"
                      onClick={nextImage}
                      style={{ width: '45px', height: '45px', opacity: 0.9 }}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {productDetails.images.length > 1 && (
                <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollBehavior: 'smooth' }}>
                  {productDetails.images.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 ${index === currentImageIndex ? 'border-primary' : 'border-secondary'}`}
                      style={{
                        width: '80px',
                        height: '80px',
                        cursor: 'pointer',
                        border: index === currentImageIndex ? '3px solid' : '2px solid',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        opacity: index === currentImageIndex ? 1 : 0.6,
                        transition: 'all 0.2s'
                      }}
                    >
                      <img
                        src={image.url || '/default.png'}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Seller Info, Price & CTAs */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              {/* Title & Like */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h1 className="h4 mb-0 flex-grow-1">{productDetails.title}</h1>
                {productDetails && <LikeButton product={productDetails} size="lg" />}
              </div>

              {/* Condition & Category */}
              <div className="mb-3 pb-3 border-bottom">
                <p className="mb-1 text-muted small">
                  <strong>Category:</strong> {productDetails.category?.name || 'Not specified'}
                </p>
                <p className="mb-0 text-muted small">
                  <strong>Status:</strong> <span className={productDetails.sold ? 'text-success' : 'text-warning'}>
                    {productDetails.sold ? 'Sold' : 'Available'}
                  </span>
                </p>
              </div>

              {/* Price Section - eBay Style */}
              <div className="mb-4">
                <div className="d-flex align-items-baseline mb-2">
                  <span className="text-muted me-2" style={{ fontSize: '14px' }}>Current bid:</span>
                  <span
                    className={`fs-3 fw-bold ${
                      !isOwner && isUserWinning && !productDetails.sold ? 'text-success' :
                      !isOwner && isUserOutbid ? 'text-danger' :
                      'text-primary'
                    }`}
                  >
                    ${formatNumber((productDetails.currentBid || productDetails.price).toString())}
                  </span>
                </div>

                {productDetails.reservePrice && !reserveMet && (
                  <div className="alert alert-warning py-2 mb-2 small">
                    <i className="bi bi-info-circle me-1"></i>
                    Reserve not met (${formatNumber(productDetails.reservePrice.toString())})
                  </div>
                )}

                {productDetails.buyNowPrice && !productDetails.sold && (
                  <div className="d-flex align-items-baseline mb-2">
                    <span className="text-muted me-2" style={{ fontSize: '14px' }}>Buy It Now:</span>
                    <span className="fs-5 fw-semibold text-success">
                      ${formatNumber(productDetails.buyNowPrice.toString())}
                    </span>
                  </div>
                )}

                <p className="text-muted small mb-0">
                  <i className="bi bi-tag me-1"></i>
                  Starting bid: ${formatNumber(productDetails.price.toString())}
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="p-3 bg-light rounded mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    <i className="bi bi-clock me-1"></i>Time left:
                  </span>
                  <CountdownTimer deadline={productDetails.bidDeadline} />
                </div>
              </div>

              {/* Owner Controls */}
              {isOwner && !productDetails.sold && (
                <div className="alert alert-info border-0 mb-4 py-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="small">
                      <i className="bi bi-person-badge me-1"></i>Your listing
                    </strong>
                    <span className="badge bg-white text-primary border small">
                      {pastBids.length} bids
                    </span>
                  </div>

                  {/* Top Bidder Info */}
                  {pastBids.length > 0 && (
                    <div className="mb-2 p-2 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted d-block">Top Bidder:</small>
                          <strong className="small">{pastBids[0]?.user?.name || 'Anonymous'}</strong>
                        </div>
                        <div className="text-end">
                          <small className="text-muted d-block">Current Bid:</small>
                          <strong className="text-success">${formatNumber((pastBids[0]?.price || productDetails.currentBid).toString())}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-2">
                    {/* Sell Now Button - only show if there are bids */}
                    {pastBids.length > 0 && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={handleSellNowToTopBidder}
                        title="End auction now and sell to top bidder"
                      >
                        <i className="bi bi-check-circle me-1"></i>Sell Now
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={handleOwnerManageShortcut}
                    >
                      <i className="bi bi-sliders me-1"></i>Settings
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleDeleteListing}
                    >
                      <i className="bi bi-trash me-1"></i>Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Owner Controls - Sold State */}
              {isOwner && productDetails.sold && (
                <div className="alert alert-success border-3 border-success mb-4">
                  <div className="text-center mb-3">
                    <i className="bi bi-cash-coin text-success" style={{ fontSize: '2.5rem' }}></i>
                    <h5 className="mt-2 mb-0 text-success">
                      <strong>Item Sold Successfully!</strong>
                    </h5>
                  </div>
                  <div className="text-center mb-3">
                    <p className="mb-1">
                      <strong>Sale Price:</strong> <span className="fs-5 text-success">${formatNumber(productDetails.currentBid.toString())}</span>
                    </p>
                    <p className="mb-0 small text-muted">
                      Sold on {new Date(productDetails.soldAt).toLocaleString()}
                    </p>
                  </div>

                  {buyerInfo && (
                    <>
                      <hr />
                      <div className="p-3 bg-light rounded">
                        <h6 className="mb-2">
                          <i className="bi bi-person-circle me-2"></i>Buyer Contact Information
                        </h6>
                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <strong className="small d-block text-muted">Name:</strong>
                            <span>{buyerInfo.name || 'N/A'}</span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="small d-block text-muted">Email:</strong>
                            <span>{buyerInfo.email || 'N/A'}</span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="small d-block text-muted">Phone:</strong>
                            <span className="fw-semibold">
                              {buyerInfo.phone || 'Not provided'}
                            </span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <button
                              className="btn btn-sm btn-outline-primary w-100"
                              onClick={() => navigate(`/profile/${buyerInfo._id}`)}
                            >
                              <i className="bi bi-person me-1"></i>View Buyer Profile
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="alert alert-info mt-3 mb-0 py-2 small">
                        <i className="bi bi-info-circle me-2"></i>
                        Please contact the buyer to arrange pickup/delivery. Funds have been received.
                      </div>
                    </>
                  )}

                  <div className="mt-3">
                    <button
                      className="btn btn-sm btn-outline-primary w-100"
                      onClick={handleOwnerManageShortcut}
                    >
                      <i className="bi bi-sliders me-1"></i>View All My Products
                    </button>
                  </div>
                </div>
              )}

              {/* Bidding Section for Non-Owners */}
              {!productDetails.sold && !isOwner && (
                <div className="mb-4">
                  {/* Winning Status Indicator */}
                  {isUserWinning && !isUserOutbid && pastBids.length > 0 && (
                    <div className="alert alert-success d-flex align-items-center py-2 mb-2 small" role="alert">
                      <i className="bi bi-trophy-fill me-2"></i>
                      <div>
                        <strong>You're the top bidder!</strong>
                        <br />
                        <small>Keep watching - someone might outbid you</small>
                      </div>
                    </div>
                  )}

                  {/* Outbid Warning */}
                  {isUserOutbid && (
                    <div className="alert alert-danger d-flex align-items-center py-2 mb-2 small" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <div>
                        <strong>You've been outbid!</strong>
                        <br />
                        <small>Place a higher bid to win</small>
                      </div>
                    </div>
                  )}

                  <label className="form-label small fw-semibold">
                    Place bid (min ${formatNumber(((productDetails.currentBid || productDetails.price) + 1).toString())})
                  </label>
                  <div className="input-group mb-2">
                    <span className="input-group-text">$</span>
                    <input
                      type="text"
                      className="form-control"
                      value={userBidAmount}
                      onChange={(e) => setUserBidAmount(formatNumber(e.target.value))}
                      placeholder={(productDetails.currentBid || productDetails.price) + 1}
                    />
                    <button
                      className={`btn ${isUserOutbid ? 'btn-danger' : 'btn-primary'}`}
                      onClick={submitBid}
                    >
                      {isUserOutbid ? 'Bid Again' : 'Place Bid'}
                    </button>
                  </div>

                  {productDetails.buyNowPrice && (
                    <button
                      className="btn btn-success w-100"
                      disabled={buyNowLoading}
                      onClick={handleBuyNow}
                    >
                      <i className="bi bi-cart-check me-2"></i>
                      {buyNowLoading ? 'Processing...' : `Buy It Now - $${formatNumber(productDetails.buyNowPrice.toString())}`}
                    </button>
                  )}

                  {bidError && (
                    <div className="alert alert-danger mt-2 py-2 small">
                      {bidError}
                    </div>
                  )}
                </div>
              )}

              {!productDetails.sold && isOwner && (
                <div className="alert alert-secondary py-2 small">
                  <i className="bi bi-info-circle me-1"></i>
                  You cannot bid on your own listing.
                </div>
              )}

              {/* Winner Display - Show if user won */}
              {productDetails.sold && isWinner && (
                <div className="alert alert-success border-3 border-success mb-4">
                  <div className="text-center mb-3">
                    <i className="bi bi-trophy-fill text-warning" style={{ fontSize: '3rem' }}></i>
                    <h4 className="mt-2 mb-0 text-success">
                      <strong>🎉 Congratulations! You Won!</strong>
                    </h4>
                  </div>
                  <div className="text-center mb-3">
                    <p className="mb-1">
                      <strong>Purchase Price:</strong> <span className="fs-5 text-success">${formatNumber(productDetails.currentBid.toString())}</span>
                    </p>
                    <p className="mb-0 small text-muted">
                      Won on {new Date(productDetails.soldAt).toLocaleString()}
                    </p>
                  </div>
                  <hr />
                  <div className="p-3 bg-light rounded">
                    <h6 className="mb-2">
                      <i className="bi bi-person-circle me-2"></i>Seller Contact Information
                    </h6>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <strong className="small d-block text-muted">Name:</strong>
                        <span>{productDetails.user?.name || 'N/A'}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <strong className="small d-block text-muted">Email:</strong>
                        <span>{productDetails.user?.email || 'N/A'}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <strong className="small d-block text-muted">Phone:</strong>
                        <span className="fw-semibold">
                          {productDetails.user?.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <button
                          className="btn btn-sm btn-outline-primary w-100"
                          onClick={() => navigate(`/profile/${productDetails.user?._id}`)}
                        >
                          <i className="bi bi-person me-1"></i>View Seller Profile
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 mb-4" style={{
                    backgroundColor: '#d4edda',
                    border: '1px solid #28a745',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    color: '#155724',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <i className="bi bi-check-circle-fill" style={{ fontSize: '1.2rem', color: '#28a745' }}></i>
                    <span>Please contact the seller to arrange pickup/delivery. Funds have been transferred.</span>
                  </div>
                </div>
              )}

              {/* Regular Sold Display - Show if sold but user didn't win */}
              {productDetails.sold && !isWinner && (
                <div className="alert alert-secondary py-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  <strong>Sold</strong> for ${formatNumber(productDetails.currentBid.toString())}
                  <br />
                  <small className="text-muted">{new Date(productDetails.soldAt).toLocaleString()}</small>
                </div>
              )}

              {/* Review Prompt after Purchase */}
              {showReviewPrompt && productDetails.sold && !isOwner && isWinner && (
                <div className="mb-4" style={{
                  backgroundColor: '#fff5e6',
                  border: '2px solid #FF6A00',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 4px 12px rgba(255, 106, 0, 0.15)'
                }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="mb-2" style={{
                        color: '#FF6A00', 
                        fontWeight: '700',
                        fontSize: '1.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <i className="bi bi-star-fill" style={{ color: '#ffc107', fontSize: '1.4rem' }}></i>
                        How was your experience?
                      </h5>
                      <p className="mb-0" style={{ color: '#0a58ca', fontSize: '0.95rem' }}>
                        Share your thoughts about this purchase and help other buyers!
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowReviewPrompt(false)}
                      aria-label="Close"
                      style={{ opacity: 0.6 }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    ></button>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold mb-2" style={{ color: '#0a58ca', fontSize: '0.95rem' }}>
                      Your rating
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex gap-1" style={{ fontSize: '1.8rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="btn p-0 border-0"
                            onClick={() => setReviewRating(star)}
                            style={{
                              color: star <= reviewRating ? '#ffc107' : '#dee2e6',
                              fontSize: '1.8rem',
                              lineHeight: '1',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              if (star > reviewRating) {
                                e.currentTarget.style.color = '#ffc107';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (star > reviewRating) {
                                e.currentTarget.style.color = '#dee2e6';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <span style={{ color: '#0a58ca', fontWeight: '600', fontSize: '0.95rem' }}>
                        {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2" style={{ color: '#0a58ca', fontSize: '0.95rem' }}>
                      Your review
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tell us about your experience with this seller and product..."
                      style={{
                        borderRadius: '12px',
                        border: '2px solid #b3d9ff',
                        padding: '14px 16px',
                        fontSize: '0.95rem',
                        resize: 'vertical',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#FF6A00';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#b3d9ff';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <small className="text-muted" style={{ fontSize: '0.85rem', marginTop: '6px', display: 'block' }}>
                      Your review helps other buyers make informed decisions
                    </small>
                  </div>
                  
                  <div className="d-flex gap-3">
                    <button 
                      className="btn btn-primary" 
                      onClick={submitReview}
                      style={{
                        borderRadius: '12px',
                        padding: '12px 28px',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)',
                        transition: 'all 0.3s ease',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 110, 253, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 110, 253, 0.3)';
                      }}
                    >
                      <i className="bi bi-send me-2"></i>Submit Review
                    </button>
                    <button 
                      className="btn btn-outline-secondary" 
                      onClick={() => setShowReviewPrompt(false)}
                      style={{
                        borderRadius: '12px',
                        padding: '12px 28px',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        borderWidth: '2px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#6c757d';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = '#6c757d';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              )}

              {/* Seller Info Card */}
              <div className="border-top pt-4 mt-4">
                <h6 className="text-muted small mb-3 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  Seller Information
                </h6>
                <div
                  className="d-flex align-items-center p-3 rounded"
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.3s ease',
                    backgroundColor: 'transparent',
                    border: '1px solid #e9ecef'
                  }}
                  onClick={() => navigate(`/profile/${productDetails.user?._id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#FF6A00';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e9ecef';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #FF6A00',
                    padding: '2px',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {productDetails.user?.photo?.filePath ? (
                      <img
                        src={productDetails.user.photo.filePath}
                        alt="Seller"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%'
                        }}
                      />
                    ) : (
                      <i className="bi bi-person-circle" style={{ fontSize: '2.5rem', color: '#6c757d' }}></i>
                    )}
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <p className="mb-1 fw-bold" style={{ fontSize: '1.05rem', color: '#212529' }}>
                      {productDetails.user?.name || 'Anonymous'}
                    </p>
                    {sellerStats.averageRating ? (
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-warning" style={{ fontSize: '1rem' }}>★</span>
                        <span style={{ fontWeight: '600', color: '#495057' }}>
                          {sellerStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                          ({sellerStats.count} {sellerStats.count === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>No reviews yet</span>
                    )}
                  </div>
                  <i className="bi bi-chevron-right text-muted" style={{ fontSize: '1.2rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle History Report - Show only if VIN exists */}
      {productDetails.vin && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="bi bi-file-earmark-text me-2"></i>{t('vehicleHistoryReport')}
                </h5>
              </div>
              <div className="card-body">
                {productDetails.vehicleHistoryReport?.available ? (
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-shield-check text-success fs-3 me-3"></i>
                        <div>
                          <h6 className="mb-1">{t('reportAvailableForPurchase')}</h6>
                          <p className="mb-0 text-muted small">
                            <i className="bi bi-patch-check-fill text-primary me-1"></i>
                            {t('trustedPartner')}: {productDetails.vehicleHistoryReport.provider}
                          </p>
                        </div>
                      </div>
                      {productDetails.vehicleHistoryReport.reportUrl && (
                        <a
                          href={productDetails.vehicleHistoryReport.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm mt-2"
                        >
                          <i className="bi bi-file-earmark-pdf me-1"></i>
                          View Full Report
                        </a>
                      )}
                    </div>
                    <div className="col-md-4 text-center">
                      <img
                        src={`https://logo.clearbit.com/${productDetails.vehicleHistoryReport.provider?.toLowerCase()}.com`}
                        alt={productDetails.vehicleHistoryReport.provider}
                        className="img-fluid"
                        style={{ maxHeight: '60px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-secondary mb-3">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>{t('reportNotAvailable')}</strong>
                    </div>
                    <p className="mb-2"><strong>{t('possibleReasonsNotAvailable')}</strong></p>
                    <ul className="small text-muted">
                      <li>{t('reasonTooOldNoHistory')}</li>
                      <li>{t('reasonManufacturedBefore1981')}</li>
                      <li>{t('reasonNo17DigitVIN')}</li>
                      <li>{t('reasonNotIntendedForUS')}</li>
                      <li>{t('reasonIncorrectVIN')}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Specifics Grid */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>{t('itemSpecifics')}
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* Rich Text Description */}
                <div className="col-12">
                  <div className="p-4 bg-light rounded">
                    <h6 className="text-muted mb-3">
                      <i className="bi bi-text-paragraph me-2"></i>
                      {t('description')}
                    </h6>
                    <div
                      className="description-content"
                      dangerouslySetInnerHTML={{
                        __html: productDetails.description || '<p class="text-muted">No description provided</p>'
                      }}
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="col-md-3 col-6">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-muted small mb-1">{t('category')}</h6>
                    <p className="mb-0">{productDetails.category?.name || 'N/A'}</p>
                  </div>
                </div>

                {/* Listed Date */}
                <div className="col-md-3 col-6">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-muted small mb-1">{t('listed')}</h6>
                    <p className="mb-0">{new Date(productDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Vehicle-Specific Fields */}
                {productDetails.year && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('year')}</h6>
                      <p className="mb-0 fw-semibold">{productDetails.year}</p>
                    </div>
                  </div>
                )}

                {productDetails.make && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('make')}</h6>
                      <p className="mb-0 fw-semibold">{productDetails.make}</p>
                    </div>
                  </div>
                )}

                {productDetails.model && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('model')}</h6>
                      <p className="mb-0 fw-semibold">{productDetails.model}</p>
                    </div>
                  </div>
                )}

                {productDetails.mileage && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('mileage')}</h6>
                      <p className="mb-0 fw-semibold">{productDetails.mileage.toLocaleString()} km</p>
                    </div>
                  </div>
                )}

                {productDetails.vin && (
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('vin')}</h6>
                      <p className="mb-0 fw-semibold font-monospace">{productDetails.vin}</p>
                    </div>
                  </div>
                )}

                {productDetails.transmission && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('transmission')}</h6>
                      <p className="mb-0 fw-semibold">{t(productDetails.transmission)}</p>
                    </div>
                  </div>
                )}

                {productDetails.fuelType && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('fuelType')}</h6>
                      <p className="mb-0 fw-semibold">{t(productDetails.fuelType)}</p>
                    </div>
                  </div>
                )}

                {productDetails.vehicleTitle && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('vehicleTitle')}</h6>
                      <p className="mb-0 fw-semibold">{t(productDetails.vehicleTitle)}</p>
                    </div>
                  </div>
                )}

                {/* General Item Fields */}
                {productDetails.condition && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('condition')}</h6>
                      <p className="mb-0 fw-semibold">{t(productDetails.condition)}</p>
                    </div>
                  </div>
                )}

                {productDetails.brand && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('brand')}</h6>
                      <p className="mb-0 fw-semibold">{productDetails.brand}</p>
                    </div>
                  </div>
                )}

                {productDetails.color && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('color')}</h6>
                      <p className="mb-0 fw-semibold">{productDetails.color}</p>
                    </div>
                  </div>
                )}

                {productDetails.size && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">{t('size')}</h6>
                      <p className="mb-0 fw-semibold">{productDetails.size}</p>
                    </div>
                  </div>
                )}

                {/* Pricing Information */}
                <div className="col-md-3 col-6">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-muted small mb-1">{t('startingPrice')}</h6>
                    <p className="mb-0 fw-semibold">${formatNumber(productDetails.price.toString())}</p>
                  </div>
                </div>

                <div className="col-md-3 col-6">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-muted small mb-1">{t('bids')}</h6>
                    <p className="mb-0 fw-semibold">{pastBids.length}</p>
                  </div>
                </div>

                {productDetails.reservePrice && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">Reserve Price</h6>
                      <p className="mb-0 fw-semibold">${formatNumber(productDetails.reservePrice.toString())}</p>
                    </div>
                  </div>
                )}

                {productDetails.minIncrement && (
                  <div className="col-md-3 col-6">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted small mb-1">Min Increment</h6>
                      <p className="mb-0 fw-semibold">${formatNumber(productDetails.minIncrement.toString())}</p>
                    </div>
                  </div>
                )}

                {/* Custom Item Specifics from Map */}
                {productDetails.itemSpecifics && Object.keys(productDetails.itemSpecifics).length > 0 && (
                  Object.entries(productDetails.itemSpecifics).map(([key, value]) => (
                    <div key={key} className="col-md-3 col-6">
                      <div className="p-3 bg-light rounded">
                        <h6 className="text-muted small mb-1">{key}</h6>
                        <p className="mb-0 fw-semibold">{value}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid History & Price Chart */}
      <div className="row mb-4">
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>Bid History
              </h5>
            </div>
            <div className="card-body">
              {pastBids.length > 0 ? (
                <>
                  {groupedHistory.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {groupedHistory.slice(0, 4).map((summary, index) => (
                        <div key={`${summary.userName}-${index}`} className="badge bg-light text-dark border">
                          <strong>{summary.userName}</strong>
                          <span className="ms-2 text-muted">{summary.count} bid{summary.count > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead className="table-light">
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
                              <td className="fw-bold text-primary">${bid.price?.toLocaleString() || 'N/A'}</td>
                              <td className="text-muted small">{bid.createdAt ? new Date(bid.createdAt).toLocaleString() : 'Unknown'}</td>
                            </tr>
                          ) : null
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {hasMoreHistory && (
                    <div className="text-center mt-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setHistoryExpanded(prev => !prev)}
                      >
                        {historyExpanded ? 'Show Less' : `View All ${pastBids.length} Bids`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-clock-history fs-1 text-muted mb-3 d-block"></i>
                  <p className="text-muted">No bids yet. Be the first!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>Price History
              </h5>
            </div>
            <div className="card-body">
              <PriceHistoryChart
                bids={pastBids}
                startingPrice={productDetails.price}
                startDate={productDetails.createdAt || productDetails.auctionStart}
                endDate={productDetails.bidDeadline}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-star me-2"></i>Reviews
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 border-end">
                  {reviewStats.count ? (
                    <div className="text-center p-3">
                      <h2 className="display-4 mb-0">{reviewStats.averageRating?.toFixed(1)}</h2>
                      <div className="text-warning mb-2">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`bi bi-star${i < Math.round(reviewStats.averageRating) ? '-fill' : ''}`}></i>
                        ))}
                      </div>
                      <p className="text-muted small mb-0">{reviewStats.count} review{reviewStats.count > 1 ? 's' : ''}</p>
                    </div>
                  ) : (
                    <div className="text-center p-3">
                      <p className="text-muted">No reviews yet</p>
                    </div>
                  )}

                  {!isOwner && isWinner && productDetails.sold && (
                    <div className="p-3 border-top">
                      <h6 className="mb-2">Leave a review</h6>
                      <select
                        className="form-select form-select-sm mb-2"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                      >
                        {[5,4,3,2,1].map((r) => (
                          <option key={r} value={r}>{'★'.repeat(r)} {r} star{r > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <textarea
                        className="form-control form-control-sm mb-2"
                        rows="2"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience"
                      />
                      <button className="btn btn-sm btn-primary w-100" onClick={submitReview}>
                        Submit Review
                      </button>
                    </div>
                  )}
                </div>

                <div className="col-md-8">
                  {productReviews.length > 0 ? (
                    <div className="p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {productReviews.map((rev) => (
                        <div key={rev._id} className="border-bottom pb-3 mb-3">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <strong>{rev.fromUser?.name || 'Buyer'}</strong>
                            <span className="text-warning">
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </span>
                          </div>
                          <p className="text-muted small mb-1">{new Date(rev.createdAt).toLocaleDateString()}</p>
                          <p className="mb-0">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-5">
                      <i className="bi bi-chat-left-text fs-1 text-muted mb-3 d-block"></i>
                      <p className="text-muted">No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Description Section */}
      {productDetails.sellerDescription && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>{t('itemDescriptionFromSeller')}
                </h5>
              </div>
              <div className="card-body">
                {/* Seller Info Banner */}
                <div className="alert alert-light border d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center">
                    <img
                      src={productDetails.user?.photo?.filePath || '/default.png'}
                      alt={productDetails.user?.name}
                      className="rounded-circle me-3"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        border: '3px solid #dee2e6'
                      }}
                    />
                    <div>
                      <h6 className="mb-1">{productDetails.user?.name || 'Anonymous Seller'}</h6>
                      {sellerStats.averageRating && (
                        <div className="small">
                          <span className="text-warning">★★★★★</span>
                          <span className="ms-2 fw-bold">{sellerStats.averageRating.toFixed(1)}</span>
                          <span className="text-muted ms-1">({sellerStats.count} {t('itemsSold')})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate(`/profile/${productDetails.user?._id}`)}
                    >
                      <i className="bi bi-shop me-1"></i>{t('viewStore')}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => window.location.href = `mailto:${productDetails.user?.email}`}
                    >
                      <i className="bi bi-envelope me-1"></i>{t('contactUs')}
                    </button>
                  </div>
                </div>

                {/* Rich Description Content */}
                <div
                  className="seller-description-content p-4 bg-light rounded"
                  dangerouslySetInnerHTML={{ __html: productDetails.sellerDescription }}
                  style={{
                    minHeight: '200px',
                    lineHeight: '1.8',
                    fontSize: '15px'
                  }}
                />

                {/* Shipping & Payment Info */}
                <div className="row mt-4 g-3">
                  <div className="col-md-4">
                    <div className="p-3 border rounded text-center">
                      <i className="bi bi-truck fs-3 text-primary mb-2 d-block"></i>
                      <h6 className="mb-1">{t('shipping')}</h6>
                      <p className="small text-muted mb-0">{t('seeItemDescription')}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 border rounded text-center">
                      <i className="bi bi-geo-alt fs-3 text-success mb-2 d-block"></i>
                      <h6 className="mb-1">{t('located')}</h6>
                      <p className="small text-muted mb-0">{productDetails.user?.address || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 border rounded text-center">
                      <i className="bi bi-credit-card fs-3 text-warning mb-2 d-block"></i>
                      <h6 className="mb-1">{t('payments')}</h6>
                      <p className="small text-muted mb-0">{t('fullPaymentRequired')} 3 {t('withinDaysOfClose')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Similar Listings */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-grid-3x3-gap me-2"></i>Similar Listings
              </h5>
            </div>
            <div className="card-body">
              {recommendedProducts.length > 0 ? (
                <div className="row g-3">
                  {recommendedProducts.map((product) => (
                    <div key={product._id} className="col-lg-3 col-md-4 col-sm-6">
                      <Link
                        to={`/products/${product._id}`}
                        className="text-decoration-none"
                      >
                        <div className="card h-100 border hover-shadow" style={{ transition: 'box-shadow 0.2s' }}>
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images.find(img => img.isPrimary)?.url || product.images[0]?.url}
                              alt={product.title}
                              className="card-img-top"
                              style={{ height: '150px', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="bg-light d-flex align-items-center justify-content-center"
                            style={{
                              height: '150px',
                              display: product.images && product.images.length > 0 ? 'none' : 'flex'
                            }}
                          >
                            <i className="bi bi-image text-muted" style={{ fontSize: '40px' }}></i>
                          </div>
                          <div className="card-body p-3">
                            <h6 className="card-title text-truncate mb-2">{product.title}</h6>
                            <p className="mb-0 fw-bold text-primary">
                              ${formatNumber((product.currentBid || product.price).toString())}
                            </p>
                            <p className="mb-0 text-muted small">
                              {product.sold ? 'Sold' : `${product.bids || 0} bid${product.bids !== 1 ? 's' : ''}`}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-box-seam fs-1 text-muted mb-3 d-block"></i>
                  <p className="text-muted">No similar items found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🎉 CELEBRATION MODAL - Shown when user wins! */}
      {showWinModal && winData && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setShowWinModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div
              className="modal-content border-0 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <div className="modal-body text-center p-5">
                {/* Confetti-style celebration */}
                <div className="mb-4" style={{ fontSize: '80px', animation: 'bounce 1s infinite' }}>
                  🎉🏆🎊
                </div>

                <h1 className="display-3 fw-bold mb-3" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  CONGRATULATIONS!
                </h1>

                <h2 className="h3 mb-4">🎯 YOU WON THE AUCTION! 🎯</h2>

                {winData.image && (
                  <div className="mb-4">
                    <img
                      src={winData.image}
                      alt={winData.title}
                      className="img-fluid rounded shadow"
                      style={{
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '4px solid rgba(255,255,255,0.3)'
                      }}
                    />
                  </div>
                )}

                <div className="bg-white text-dark rounded p-4 mb-4">
                  <h4 className="mb-3">{winData.title}</h4>
                  <div className="d-flex justify-content-around align-items-center">
                    <div>
                      <small className="text-muted d-block">Winning Price</small>
                      <h2 className="text-success mb-0">
                        ${formatNumber(winData.price.toString())}
                      </h2>
                    </div>
                    <div className="vr" style={{ height: '50px' }}></div>
                    <div>
                      <small className="text-muted d-block">Method</small>
                      <h5 className="mb-0">
                        <span className="badge bg-primary">{winData.method}</span>
                      </h5>
                    </div>
                  </div>
                </div>

                <div className="alert alert-light mb-4">
                  <p className="mb-2">
                    <strong>✨ What happens next?</strong>
                  </p>
                  <p className="mb-0 small">
                    • Funds have been deducted from your balance<br />
                    • Seller contact information is now visible above<br />
                    • Contact the seller to arrange pickup/delivery<br />
                    • Don't forget to leave a review!
                  </p>
                </div>

                <div className="d-flex gap-3 justify-content-center">
                  <button
                    className="btn btn-light btn-lg px-5"
                    onClick={() => {
                      setShowWinModal(false);
                      setShowReviewPrompt(true);
                    }}
                  >
                    <i className="bi bi-star-fill me-2"></i>
                    Leave a Review
                  </button>
                  <button
                    className="btn btn-outline-light btn-lg px-5"
                    onClick={() => setShowWinModal(false)}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .modal.show {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .seller-description-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .seller-description-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 15px 0;
        }

        .seller-description-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }

        .seller-description-content table td,
        .seller-description-content table th {
          padding: 12px;
          border: 1px solid #dee2e6;
        }

        .seller-description-content h1,
        .seller-description-content h2,
        .seller-description-content h3 {
          margin-top: 25px;
          margin-bottom: 15px;
          color: #333;
        }

        .seller-description-content ul,
        .seller-description-content ol {
          margin: 15px 0;
          padding-left: 25px;
        }

        .seller-description-content a {
          color: #FF6A00;
          text-decoration: none;
        }

        .seller-description-content a:hover {
          text-decoration: underline;
        }

        /* Rich Text Description Styling */
        .description-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
        }

        .description-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 15px 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .description-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          background: white;
        }

        .description-content table td,
        .description-content table th {
          padding: 12px;
          border: 1px solid #dee2e6;
        }

        .description-content table th {
          background-color: #f8f9fa;
          font-weight: 600;
        }

        .description-content h1,
        .description-content h2,
        .description-content h3,
        .description-content h4,
        .description-content h5,
        .description-content h6 {
          margin-top: 20px;
          margin-bottom: 10px;
          color: #333;
          font-weight: 600;
        }

        .description-content h1 { font-size: 2rem; }
        .description-content h2 { font-size: 1.5rem; }
        .description-content h3 { font-size: 1.25rem; }

        .description-content ul,
        .description-content ol {
          margin: 15px 0;
          padding-left: 25px;
        }

        .description-content li {
          margin: 5px 0;
        }

        .description-content a {
          color: #FF6A00;
          text-decoration: none;
        }

        .description-content a:hover {
          text-decoration: underline;
        }

        .description-content p {
          margin-bottom: 10px;
        }

        .description-content strong {
          font-weight: 600;
          color: #333;
        }

        .description-content em {
          font-style: italic;
        }

        .description-content blockquote {
          border-left: 4px solid #FF6A00;
          padding-left: 15px;
          margin: 15px 0;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default Details;
