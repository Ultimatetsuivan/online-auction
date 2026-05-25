import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { CountdownTimer } from '../../components/Timer';
import { apiConfig, buildApiUrl } from '../../config/api';
import { useToast } from '../../components/common/Toast';
import { LikeButton } from '../../components/LikeButton';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { PriceHistoryChart } from '../../components/PriceHistoryChart';
import { getErrorMessage, isConflictError } from '../../utils/errorHandler';
import { post } from '../../utils/apiClient';

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
  const [depositInfo, setDepositInfo] = useState(null); // { depositRequired, hasDeposit, depositAmount }
  const [depositLoading, setDepositLoading] = useState(false);
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
        userName: bid.user?.name || 'Нэргүй',
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

  const checkDepositStatus = async (pId) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await axios.get(
        buildApiUrl(`/api/deposits/check/${pId}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDepositInfo(response.data);
    } catch (err) {
      console.error('Deposit status check error:', err);
    }
  };

  const handlePlaceDeposit = async () => {
    const token = getAuthToken();
    if (!token) { navigate('/login'); return; }
    setDepositLoading(true);
    try {
      await axios.post(
        buildApiUrl('/api/deposits/'),
        { productId: productDetails._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Дэнчин амжилттай байршуулагдлаа');
      await checkDepositStatus(productDetails._id);
    } catch (err) {
      const msg = err.response?.data?.error || 'Дэнчин байршуулахад алдаа гарлаа';
      toast.error(msg);
    } finally {
      setDepositLoading(false);
    }
  };

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
        const bidsArray = Array.isArray(bidsData) ? bidsData : [];
        setPastBids(bidsArray);

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
        await checkDepositStatus(productId);

        // Check if user is winning (top bidder)
        if (currentUser && bidsArray.length > 0) {
          const topBid = bidsArray[0];
          const topBidderId = topBid?.user?._id || topBid?.user?.id || topBid?.user;
          const currentUserId = currentUser._id || currentUser.id;
          setIsUserWinning(topBidderId === currentUserId && !outbidStatus);
        } else {
          setIsUserWinning(false);
        }

        const currentPrice = productInfo.data.currentBid || productInfo.data.price;
        setUserBidAmount(currentPrice + Math.max(productInfo.data.minIncrement || 5000, 5000));
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
        setUserBidAmount(updatedProduct.currentBid + Math.max(updatedProduct.minIncrement || 5000, 5000));
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

    const minimumBid = (productDetails.currentBid || productDetails.price) + Math.max(productDetails.minIncrement || 5000, 5000);
    if (bidValue < minimumBid) {
      setBidError(`Та ₮${formatNumber(minimumBid.toString())}-аас дээш үнэ санал өгөх ёстой`);
      return;
    }

    try {
      // Use new API client with improved error handling
      const response = await post('/api/bidding/', {
        productId: productDetails._id,
        price: bidValue,
      });

      // Handle new backend response format: { success: true, biddingProduct, product, reserveMet }
      if (response.success) {
        const { product, biddingProduct, reserveMet: newReserveMet } = response;

        // Update product details
        setProductDetails(product);
        setReserveMet(newReserveMet);

        // Update bid history
        setPastBids(previousBids => [biddingProduct, ...previousBids]);

        // Emit socket updates (for real-time updates to other users)
        if (socketConnection) {
          socketConnection.emit('bidUpdate', product);
          socketConnection.emit('newBid', biddingProduct);
        }

        // Update UI state
        setIsUserOutbid(false);
        setIsUserWinning(true); // User just placed the highest bid
        setUserBidAmount(''); // Clear bid input

        // Show success message
        toast.success(`Амжилттай ₮{formatNumber(bidValue.toString())}₮ үнэ өглөө`);
      }

    } catch (error) {
      // Handle deposit requirement
      if (error.response?.data?.requiresDeposit) {
        setDepositInfo({
          depositRequired: true,
          hasDeposit: false,
          depositAmount: error.response.data.depositAmount
        });
        return;
      }

      // Use improved error handling
      const errorMsg = getErrorMessage(error);
      setBidError(errorMsg);

      // Handle specific error cases
      if (isConflictError(error)) {
        // Race condition - another user bid at the same time
        toast.error('Өөр хэрэглэгч яг одоо санал өгсөн байна. Дахин оролдоно уу');
        // Refresh product data to show latest bid
        const refreshData = await axios.get(buildApiUrl(`/api/product/${productDetails._id}`));
        setProductDetails(refreshData.data);
      } else {
        toast.error(errorMsg);
      }

      console.error('Bidding error:', error);
    }
  };

  const handleOwnerManageShortcut = () => {
    if (!productDetails) return;
    localStorage.setItem('pendingProductManage', productDetails._id);
    navigate(`/profile/tab/myProducts?highlight=${productDetails._id}`);
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
      toast.error(error.response?.data?.message || 'Худалдаж авахад алдаа гарлаа');
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
      toast.success('Үнэлгээ амжилттай илгээгдлээ');
      setReviewComment('');
      setShowReviewPrompt(false); // Close review prompt after submission
      fetchReviews(productDetails._id, productDetails.user._id);
    } catch (error) {
      console.error('Review submit error:', error);
      toast.error(error.response?.data?.message || 'Үнэлгээ илгээхэд алдаа гарлаа');
    }
  };

  const handleDeleteListing = async () => {
    if (!productDetails?._id) return;
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const confirmDelete = window.confirm('Энэ зарлагыг устгахдаа итгэлтэй байна уу?');
    if (!confirmDelete) return;

    try {
      await axios.delete(buildApiUrl(`/api/product/${productDetails._id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Зарлага амжилттай устгагдлаа');
      navigate('/products');
    } catch (error) {
      console.error('Delete listing error:', error);
      toast.error(error.response?.data?.message || 'Одоогоор зарлагыг устгах боломжгүй.');
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
      toast.error('Санал байхгүй байна. Хамгийн өндөр саналтай хэрэглэгчид зарах боломжгүй.');
      return;
    }

    const topBid = pastBids[0];
    const topBidder = topBid?.user?.name || 'Нэргүй';
    const topBidAmount = topBid?.price || productDetails.currentBid;

    // Show confirmation dialog with details
    const confirmMessage = `⚠️ ШУУД ЗАРАХ БАТАЛГААЖУУЛАЛТ\n\n` +
      `Та энэ барааг дараах хэрэглэгчид шууд зарах гэж байна:\n\n` +
      `Худалдан авагч: ${topBidder}\n` +
      `Дүн: ₮${formatNumber(topBidAmount.toString())}\n\n` +
      `Энэ үйлдлийг буцаах БОЛОМЖГҮЙ бөгөөд:\n` +
      `• Дуудлага шууд дуусна\n` +
      `• Бараа зарагдсан гэж тэмдэглэгдэнэ\n` +
      `• Хожсон оролцогчид мэдэгдэл илгээгдэнэ\n\n` +
      `Үргэлжлүүлэх үү?`;

    const firstConfirm = window.confirm(confirmMessage);
    if (!firstConfirm) return;

    // Second confirmation to prevent accidents
    const secondConfirm = window.confirm(
      `ЭЦСИЙН БАТАЛГААЖУУЛАЛТ\n\n` +
      `Энэ бол таны сүүлчийн боломж.\n\n` +
      `${topBidder}-д ₮${formatNumber(topBidAmount.toString())}-д зарах уу?`
    );
    if (!secondConfirm) return;

    try {
      const response = await axios.post(
        buildApiUrl(`/api/product/${productDetails._id}/sell-now`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${topBidder}-д ₮${formatNumber(topBidAmount.toString())}-д амжилттай зарагдлаа!`);

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
      toast.error(error.response?.data?.message || 'Шууд зарахад алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  // ── Design tokens (admin panel style) ───────────────────────────────────
  const s = {
    card: { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
    tag: (bg, color) => ({ background: bg, color, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }),
    btn: (bg, color, border) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: border || 'none', background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }),
  };

  const isFixedPrice = productDetails?.sellType === 'fixed' || productDetails?.sellType === 'buy_now';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: 'var(--bn-primary)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ ...s.card, padding: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#dc2626', marginBottom: 16 }}>{errorMessage}</p>
          <button style={s.btn('var(--bn-primary)', '#fff')} onClick={() => window.location.reload()}>Дахин оролдох</button>
        </div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
        <div style={{ ...s.card, padding: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 16 }}>Бараа олдсонгүй</p>
          <Link to="/products"><button style={s.btn('var(--bn-primary)', '#fff')}>Бараа үзэх</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 60 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }`}</style>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 13, color: '#94a3b8' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Нүүр</Link>
          <span>›</span>
          <Link to="/products" style={{ color: '#64748b', textDecoration: 'none' }}>Бараанууд</Link>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{productDetails.title}</span>
        </div>

        {/* ── TOP: Image + Bid Panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>

          {/* LEFT: Image gallery */}
          <div style={{ ...s.card, overflow: 'hidden' }}>
            <div style={{ position: 'relative', background: '#f8fafc', aspectRatio: '4/3', overflow: 'hidden' }}>
              <img
                src={productDetails.images[currentImageIndex]?.url || '/default.png'}
                alt={productDetails.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {productDetails.images.length > 1 && (
                <>
                  <button onClick={prevImage} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#0f172a' }}>‹</button>
                  <button onClick={nextImage} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#0f172a' }}>›</button>
                  <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.45)', color: '#fff', borderRadius: 999, padding: '3px 10px', fontSize: 12 }}>
                    {currentImageIndex + 1} / {productDetails.images.length}
                  </div>
                </>
              )}
              {/* Like button */}
              <div style={{ position: 'absolute', top: 12, right: 12 }} onClick={(e) => e.stopPropagation()}>
                <LikeButton product={productDetails} size="lg" />
              </div>
            </div>
            {productDetails.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto' }}>
                {productDetails.images.map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentImageIndex(idx)} style={{ flexShrink: 0, width: 68, height: 68, borderRadius: 10, overflow: 'hidden', border: `2px solid ${idx === currentImageIndex ? 'var(--bn-primary)' : '#e2e8f0'}`, cursor: 'pointer', padding: 0, opacity: idx === currentImageIndex ? 1 : 0.6, transition: 'all 0.15s' }}>
                    <img src={img.url || '/default.png'} alt={`View ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Bid panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 }}>

            {/* Title + badges */}
            <div style={{ ...s.card, padding: 20 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.35 }}>{productDetails.title}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {isFixedPrice
                  ? <span style={s.tag('#f0fdf4', '#16a34a')}>Тогтмол үнэ</span>
                  : <span style={s.tag('#fff7ed', '#ea580c')}>Дуудлага</span>}
                {productDetails.sold
                  ? <span style={s.tag('#f1f5f9', '#64748b')}>Зарагдсан</span>
                  : <span style={s.tag('#f0fdf4', '#16a34a')}>Идэвхтэй</span>}
                {(productDetails.category?.name || productDetails.category?.title) && (
                  <span style={s.tag('#f1f5f9', '#475569')}>{productDetails.category?.name || productDetails.category?.title}</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div style={{ ...s.card, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {isFixedPrice ? 'Үнэ' : 'Одоо зарагдаж байгаа үнэ'}
              </p>
              <div style={{ fontSize: 36, fontWeight: 800, color: isUserWinning && !productDetails.sold ? '#16a34a' : isUserOutbid ? '#dc2626' : 'var(--bn-accent)', lineHeight: 1.1, marginBottom: 6 }}>
                ₮{formatNumber((productDetails.currentBid || productDetails.price || 0).toString())}
              </div>
              {!isFixedPrice && productDetails.price && productDetails.currentBid > productDetails.price && (
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px' }}>Эхлэх: ₮{formatNumber(productDetails.price.toString())}</p>
              )}
              {productDetails.buyNowPrice && !productDetails.sold && !isFixedPrice && (
                <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, margin: '6px 0 0' }}>Шууд авах: ₮{formatNumber(productDetails.buyNowPrice.toString())}</p>
              )}
              {productDetails.reservePrice && !reserveMet && (
                <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#b45309' }}>
                  Хамгийн бага үнэ хүрсэнгүй — ₮{formatNumber(productDetails.reservePrice.toString())}
                </div>
              )}
            </div>

            {/* Countdown (auction only) */}
            {!isFixedPrice && !productDetails.sold && (
              <div style={{ ...s.card, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Үлдсэн хугацаа</p>
                <CountdownTimer deadline={productDetails.bidDeadline} />
              </div>
            )}

            {/* Status banners */}
            {isUserWinning && !isUserOutbid && pastBids.length > 0 && !productDetails.sold && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>🏆</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: '0 0 2px' }}>Та тэргүүлж байна!</p>
                  <p style={{ fontSize: 12, color: '#16a34a', margin: 0 }}>Анхаарал тавьж байгаарай — хэн нэгэн давж болно</p>
                </div>
              </div>
            )}
            {isUserOutbid && !productDetails.sold && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', margin: '0 0 2px' }}>Таны санал давагдлаа!</p>
                  <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>Илүү өндөр санал тавиарай</p>
                </div>
              </div>
            )}

            {/* Bid form for non-owners */}
            {!productDetails.sold && !isOwner && (
              <div style={{ ...s.card, padding: 20 }}>
                {productDetails.sellType === 'auction' ? (
                  <>
                    {/* Deposit required banner */}
                    {depositInfo?.depositRequired && !depositInfo?.hasDeposit && (
                      <div style={{ background: '#fffbeb', border: '1.5px solid #fbbf24', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>Дэнчин шаардлагатай</p>
                        <p style={{ fontSize: 12, color: '#78350f', margin: '0 0 12px', lineHeight: 1.5 }}>
                          Энэ бараа их үнэтэй тул дуудлагад оролцохын тулд <strong>₮{formatNumber(depositInfo.depositAmount.toString())}</strong> дэнчин байршуулах шаардлагатай. Дуусмагц буцаана.
                        </p>
                        <button
                          onClick={handlePlaceDeposit}
                          disabled={depositLoading}
                          style={{ ...s.btn('#f59e0b', '#fff'), width: '100%', padding: '11px', fontSize: 14, opacity: depositLoading ? 0.6 : 1 }}
                        >
                          {depositLoading ? 'Боловсруулж байна…' : `₮${formatNumber(depositInfo.depositAmount.toString())} дэнчин байршуулах`}
                        </button>
                      </div>
                    )}
                    {/* Deposit held badge */}
                    {depositInfo?.depositRequired && depositInfo?.hasDeposit && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                        <span>✓</span> ₮{formatNumber(depositInfo.depositAmount.toString())} дэнчин байршуулсан — санал тавих боломжтой
                      </div>
                    )}
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                      Санал тавих (хамгийн бага ₮{formatNumber(((productDetails.currentBid || productDetails.price) + Math.max(productDetails.minIncrement || 5000, 5000)).toString())})
                    </p>
                    {/* Quick increment chips */}
                    {(() => {
                      const base = productDetails.currentBid || productDetails.price || 0;
                      const inc = Math.max(productDetails.minIncrement || 5000, 5000);
                      const presets = [inc, inc * 2, inc * 5, inc * 10];
                      const disabled = depositInfo?.depositRequired && !depositInfo?.hasDeposit;
                      return (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', opacity: disabled ? 0.4 : 1 }}>
                          {presets.map((delta) => (
                            <button
                              key={delta}
                              disabled={disabled}
                              onClick={() => setUserBidAmount(formatNumber(String(base + delta)))}
                              style={{ padding: '6px 12px', background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--bn-primary)', cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                            >
                              +₮{formatNumber(String(delta))}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, opacity: (depositInfo?.depositRequired && !depositInfo?.hasDeposit) ? 0.4 : 1 }}>
                      <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', flex: 1 }}>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 13px', background: '#f8fafc', fontSize: 14, fontWeight: 700, color: '#64748b', borderRight: '1.5px solid #e2e8f0', flexShrink: 0 }}>₮</span>
                        <input type="text" value={userBidAmount} onChange={(e) => setUserBidAmount(formatNumber(e.target.value))} placeholder={String((productDetails.currentBid || productDetails.price) + Math.max(productDetails.minIncrement || 5000, 5000))} disabled={depositInfo?.depositRequired && !depositInfo?.hasDeposit} style={{ flex: 1, padding: '11px 14px', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#0f172a', background: '#fff' }} />
                      </div>
                      <button onClick={submitBid} disabled={depositInfo?.depositRequired && !depositInfo?.hasDeposit} style={{ padding: '11px 20px', background: isUserOutbid ? '#dc2626' : 'var(--bn-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: (depositInfo?.depositRequired && !depositInfo?.hasDeposit) ? 'not-allowed' : 'pointer', borderRadius: 10, flexShrink: 0 }}>
                        {isUserOutbid ? 'Дахин санал тавих' : 'Санал тавих'}
                      </button>
                    </div>
                    {productDetails.buyNowPrice && (
                      <button onClick={handleBuyNow} disabled={buyNowLoading} style={{ ...s.btn('#16a34a', '#fff'), width: '100%', padding: '11px', fontSize: 14, opacity: buyNowLoading ? 0.6 : 1 }}>
                        {buyNowLoading ? 'Боловсруулж байна…' : `Шууд авах — ₮${formatNumber(productDetails.buyNowPrice.toString())}`}
                      </button>
                    )}
                    {bidError && <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#dc2626' }}>{bidError}</div>}
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--bn-accent)', margin: '0 0 16px' }}>₮{formatNumber(productDetails.price.toString())}</p>
                    <button onClick={handleBuyNow} disabled={buyNowLoading} style={{ ...s.btn('#16a34a', '#fff'), width: '100%', padding: '13px', fontSize: 15, opacity: buyNowLoading ? 0.6 : 1 }}>
                      {buyNowLoading ? 'Боловсруулж байна…' : 'Шууд авах'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Owner — active listing */}
            {isOwner && !productDetails.sold && (
              <div style={{ ...s.card, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Таны зарлага</p>
                  <span style={s.tag('#eff6ff', '#3b82f6')}>{pastBids.length} санал</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  {[['Үзэлт', productDetails.views || 0], ['Оролцогч', productDetails.bidStats?.totalBidders || 0], ['Нийт санал', productDetails.bidStats?.totalBids || 0]].map(([label, value]) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{value}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {pastBids.length > 0 && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: '#16a34a', margin: '0 0 6px', fontWeight: 700 }}>🏆 Тэргүүлэгч</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{pastBids[0]?.user?.name || 'Нэргүй'}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>₮{formatNumber((pastBids[0]?.price || productDetails.currentBid).toString())}</span>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {pastBids.length > 0 && (
                    <button onClick={handleSellNowToTopBidder} style={{ ...s.btn('#eef2ff', 'var(--bn-primary)', '1.5px solid #c7d2fe'), flex: 1 }}>Шууд зарах</button>
                  )}
                  <button onClick={handleOwnerManageShortcut} style={{ ...s.btn('#f1f5f9', '#475569', '1.5px solid #e2e8f0'), flex: 1 }}>Тохиргоо</button>
                  <button onClick={handleDeleteListing} style={{ ...s.btn('#fef2f2', '#dc2626', '1.5px solid #fca5a5'), flex: 1 }}>Устгах</button>
                </div>
              </div>
            )}

            {/* Owner — sold */}
            {isOwner && productDetails.sold && (
              <div style={{ ...s.card, padding: 20 }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', margin: '0 0 4px' }}>Бараа зарагдлаа!</p>
                  <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--bn-accent)', margin: '0 0 4px' }}>₮{formatNumber(productDetails.currentBid.toString())}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{new Date(productDetails.soldAt).toLocaleString()} -д зарагдсан</p>
                </div>
                {buyerInfo && (
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Худалдан авагчийн мэдээлэл</p>
                    {[['Нэр', buyerInfo.name], ['И-мэйл', buyerInfo.email], ['Утас', buyerInfo.phone]].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{val || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleOwnerManageShortcut} style={{ ...s.btn('#f1f5f9', '#475569', '1.5px solid #e2e8f0'), width: '100%' }}>Миний зарууд</button>
              </div>
            )}

            {/* Winner panel */}
            {productDetails.sold && isWinner && (
              <div style={{ ...s.card, padding: 20, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                {(() => {
                  const seller = productDetails.user || {};
                  const sellerName = seller.name || seller.username || seller.surname || null;
                  const soldDateRaw = productDetails.soldAt || productDetails.bidDeadline || productDetails.updatedAt;
                  const soldDate = soldDateRaw ? new Date(soldDateRaw) : null;
                  const soldLabel = soldDate && !isNaN(soldDate)
                    ? soldDate.toLocaleString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : null;
                  return (
                    <>
                      <div style={{ textAlign: 'center', marginBottom: 14 }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#15803d', margin: '0 0 4px' }}>Та хожлоо!</p>
                        <p style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', margin: '0 0 4px' }}>₮{formatNumber(productDetails.currentBid.toString())}</p>
                        {soldLabel && <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{soldLabel}</p>}
                      </div>
                      <div style={{ background: '#fff', borderRadius: 10, padding: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Борлуулагчийн мэдээлэл</p>
                        {[['Нэр', sellerName], ['И-мэйл', seller.email], ['Утас', seller.phone]].map(([label, val]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: val ? '#0f172a' : '#cbd5e1' }}>{val || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
                <div style={{ marginTop: 10, background: '#dcfce7', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#15803d', fontWeight: 500 }}>
                  ✓ Хүргэлт / авалтыг зохицуулахын тулд борлуулагчтай холбогдоно уу.
                </div>
              </div>
            )}

            {/* Sold — not winner, not owner */}
            {productDetails.sold && !isWinner && !isOwner && (
              <div style={{ ...s.card, padding: 16 }}>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Зарагдсан</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>₮{formatNumber(productDetails.currentBid.toString())}</span>
                </div>
              </div>
            )}

            {/* Review prompt */}
            {showReviewPrompt && productDetails.sold && !isOwner && isWinner && (
              <div style={{ ...s.card, padding: 20, border: '2px solid var(--bn-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 3px' }}>⭐ Үнэлгээ үлдээх</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Туршлагаа бусад худалдан авагчидтай хуваалцаарай</p>
                  </div>
                  <button onClick={() => setShowReviewPrompt(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: star <= reviewRating ? '#f59e0b' : '#d1d5db', padding: '0 2px' }}>★</button>
                  ))}
                </div>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Туршлагаа хуваалцаарай…" rows={3} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={submitReview} style={{ ...s.btn('var(--bn-primary)', '#fff'), flex: 1 }}>Илгээх</button>
                  <button onClick={() => setShowReviewPrompt(false)} style={{ ...s.btn('#f1f5f9', '#64748b', '1.5px solid #e2e8f0'), flex: 1 }}>Дараа</button>
                </div>
              </div>
            )}

            {/* Seller card */}
            <div style={{ ...s.card, padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Борлуулагч</p>
              <button onClick={() => navigate(`/profile/${productDetails.user?._id}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bn-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                  {productDetails.user?.photo?.filePath
                    ? <img src={productDetails.user.photo.filePath} alt="Seller" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (productDetails.user?.name?.charAt(0)?.toUpperCase() || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productDetails.user?.name || 'Борлуулагч'}</p>
                  {sellerStats.averageRating
                    ? <p style={{ fontSize: 12, color: '#f59e0b', margin: 0 }}>{'★'.repeat(Math.round(sellerStats.averageRating))}{'☆'.repeat(5 - Math.round(sellerStats.averageRating))}<span style={{ color: '#64748b', marginLeft: 4 }}>{sellerStats.averageRating.toFixed(1)} ({sellerStats.count})</span></p>
                    : <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Үнэлгээ байхгүй</p>}
                </div>
                <span style={{ color: '#94a3b8', fontSize: 18 }}>›</span>
              </button>
            </div>

          </div>{/* end right panel */}
        </div>{/* end two-column */}

        {/* ── BOTTOM SECTIONS ── */}

        {/* Description */}
        <div style={{ ...s.card, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Тайлбар</p>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <div dangerouslySetInnerHTML={{ __html: productDetails.description || '<p style="color:#94a3b8">Тайлбар байхгүй</p>' }} />
          </div>
        </div>

        {/* Item Details grid */}
        <div style={{ ...s.card, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Барааны мэдээлэл</p>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {[
                ['Ангилал', productDetails.category?.name || productDetails.category?.title],
                ['Нийтэлсэн', new Date(productDetails.createdAt).toLocaleDateString()],
                productDetails.condition && ['Төлөв', t(productDetails.condition)],
                productDetails.brand && ['Брэнд', productDetails.brand],
                productDetails.color && ['Өнгө', productDetails.color],
                productDetails.size && ['Хэмжээ', productDetails.size],
                productDetails.year && ['Он', productDetails.year],
                productDetails.make && ['Марк', productDetails.make],
                productDetails.model && ['Загвар', productDetails.model],
                productDetails.mileage && ['Гүйлт', `${productDetails.mileage.toLocaleString()} км`],
                productDetails.vin && ['VIN', productDetails.vin],
                ['Эхлэх үнэ', `₮${formatNumber(productDetails.price.toString())}`],
                ['Нийт санал', String(pastBids.length)],
                productDetails.reservePrice && ['Хамгийн бага үнэ', `₮${formatNumber(productDetails.reservePrice.toString())}`],
                productDetails.minIncrement && ['Хамгийн бага нэмэлт', `₮${formatNumber(productDetails.minIncrement.toString())}`],
                ...(productDetails.itemSpecifics ? Object.entries(productDetails.itemSpecifics).map(([k, v]) => [k, String(v)]) : []),
              ].filter(Boolean).map(([label, value]) => value && (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 3px', fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bid History + Price Chart (auction only) */}
        {!isFixedPrice && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Bid History */}
            <div style={{ ...s.card, overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Санлын түүх</p>
                <span style={s.tag('#f1f5f9', '#64748b')}>{pastBids.length} санал</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {pastBids.length > 0 ? (
                  <>
                    {groupedHistory.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {groupedHistory.slice(0, 4).map((g, i) => (
                          <span key={i} style={s.tag('#f1f5f9', '#475569')}>{g.userName} · {g.count}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                            {['Оролцогч', 'Дүн', 'Огноо'].map((h) => (
                              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleBids.map((bid, idx) => bid ? (
                            <tr key={bid._id || bid.createdAt} style={{ borderBottom: '1px solid #f1f5f9', background: idx === 0 ? '#f0fdf4' : 'transparent' }}>
                              <td style={{ padding: '9px 8px', fontWeight: idx === 0 ? 700 : 400, color: '#0f172a' }}>{idx === 0 && <span style={{ marginRight: 4 }}>🏆</span>}{bid.user?.name || 'Нэргүй'}</td>
                              <td style={{ padding: '9px 8px', fontWeight: 700, color: 'var(--bn-accent)' }}>₮{formatNumber(bid.price?.toString() || '0')}</td>
                              <td style={{ padding: '9px 8px', color: '#94a3b8', fontSize: 11 }}>{bid.createdAt ? new Date(bid.createdAt).toLocaleString('mn-MN') : '—'}</td>
                            </tr>
                          ) : null)}
                        </tbody>
                      </table>
                    </div>
                    {hasMoreHistory && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button onClick={() => setHistoryExpanded(p => !p)} style={{ ...s.btn('#f1f5f9', '#475569', '1.5px solid #e2e8f0'), padding: '7px 16px', fontSize: 12 }}>
                          {historyExpanded ? 'Хураах' : `Бүгдийг харах (${pastBids.length})`}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🕐</div>
                    <p style={{ margin: 0, fontSize: 13 }}>Одоогоор санал байхгүй. Эхнийх нь байгаарай!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Price Chart */}
            <div style={{ ...s.card, overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Үнийн түүх</p>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <PriceHistoryChart bids={pastBids} startingPrice={productDetails.price} startDate={productDetails.createdAt || productDetails.auctionStart} endDate={productDetails.bidDeadline} />
              </div>
            </div>
          </div>
        )}

        {/* Owner bidders list */}
        {isOwner && !productDetails.sold && productDetails.bidStats?.bidders?.length > 0 && (
          <div style={{ ...s.card, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Оролцогчид</p>
              <span style={s.tag('#eff6ff', '#3b82f6')}>Нийт {productDetails.bidStats.bidders.length}</span>
            </div>
            <div style={{ padding: '16px 20px', maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {productDetails.bidStats.bidders.map((bid, idx) => (
                <div key={bid._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: idx === 0 ? '#f0fdf4' : '#f8fafc', border: idx === 0 ? '1px solid #86efac' : '1px solid #f1f5f9' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx === 0 ? '#16a34a' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: idx === 0 ? '#fff' : '#64748b', flexShrink: 0 }}>
                    {idx === 0 ? '🏆' : `#${idx + 1}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 1px' }}>{bid.user?.name || 'Хэрэглэгч'}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{bid.user?.email}</p>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--bn-accent)' }}>₮{formatNumber(bid.price?.toString() || '0')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div style={{ ...s.card, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Үнэлгээнүүд</p>
            {reviewStats.count > 0 && <span style={s.tag('#f1f5f9', '#64748b')}>{reviewStats.count} үнэлгээ</span>}
          </div>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: reviewStats.count > 0 ? '150px 1fr' : '1fr', gap: 24 }}>
              {reviewStats.count > 0 && (
                <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9', paddingRight: 24 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{reviewStats.averageRating?.toFixed(1)}</div>
                  <div style={{ fontSize: 20, color: '#f59e0b', margin: '6px 0' }}>
                    {[...Array(5)].map((_, i) => <span key={i}>{i < Math.round(reviewStats.averageRating) ? '★' : '☆'}</span>)}
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{reviewStats.count} үнэлгээ</p>
                </div>
              )}
              <div>
                {productReviews.length > 0 ? (
                  <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {productReviews.map((rev) => (
                      <div key={rev._id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{rev.fromUser?.name || 'Худалдан авагч'}</span>
                          <span style={{ color: '#f59e0b', fontSize: 14 }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 5px' }}>{new Date(rev.createdAt).toLocaleDateString()}</p>
                        <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: '#94a3b8' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                    <p style={{ margin: 0, fontSize: 13 }}>Одоогоор үнэлгээ байхгүй. Эхнийх нь байгаарай!</p>
                  </div>
                )}
                {!isOwner && isWinner && productDetails.sold && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>Үнэлгээ үлдээх</p>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: star <= reviewRating ? '#f59e0b' : '#d1d5db', padding: '0 2px' }}>★</button>
                      ))}
                    </div>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Туршлагаа хуваалцаарай..." rows={2} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                    <button onClick={submitReview} style={s.btn('var(--bn-primary)', '#fff')}>Үнэлгээ илгээх</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seller Description */}
        {productDetails.sellerDescription && (
          <div style={{ ...s.card, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{t('itemDescriptionFromSeller')}</p>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bn-primary)', color: '#fff', fontSize: 18, fontWeight: 700 }}>
                  {productDetails.user?.photo?.filePath
                    ? <img src={productDetails.user.photo.filePath} alt="Seller" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : productDetails.user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{productDetails.user?.name}</p>
                  {sellerStats.averageRating && <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>⭐ {sellerStats.averageRating.toFixed(1)} · {sellerStats.count} {t('itemsSold')}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigate(`/profile/${productDetails.user?._id}`)} style={{ ...s.btn('#f1f5f9', '#475569', '1.5px solid #e2e8f0'), padding: '7px 14px', fontSize: 12 }}>{t('viewStore')}</button>
                  <button onClick={() => { window.location.href = `mailto:${productDetails.user?.email}`; }} style={{ ...s.btn('#f1f5f9', '#475569', '1.5px solid #e2e8f0'), padding: '7px 14px', fontSize: 12 }}>{t('contactUs')}</button>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: productDetails.sellerDescription }} style={{ lineHeight: 1.7 }} />
            </div>
          </div>
        )}

        {/* Similar Listings */}
        {recommendedProducts.length > 0 && (
          <div style={{ ...s.card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Төстэй зарууд</p>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                {recommendedProducts.map((rec) => (
                  <Link key={rec._id} to={`/products/${rec._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#f8fafc', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'box-shadow 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>
                      {rec.images?.length > 0
                        ? <img src={rec.images.find(i => i.isPrimary)?.url || rec.images[0]?.url} alt={rec.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        : <div style={{ height: 140, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 28 }}>📦</div>}
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.title}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--bn-accent)', margin: '0 0 2px' }}>₮{formatNumber((rec.currentBid || rec.price).toString())}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{rec.sold ? 'Зарагдсан' : `${rec.bids || 0} санал`}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>{/* end maxWidth wrapper */}

      {/* Win Modal */}
      {showWinModal && winData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowWinModal(false)}>
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', borderRadius: 24, boxShadow: '0 24px 48px rgba(0,0,0,0.4)', maxWidth: 480, width: '100%', margin: '0 16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '40px 32px' }}>
              <div style={{ fontSize: 64, marginBottom: 16, animation: 'bounce 1s infinite' }}>🏆</div>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 8px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>БАЯР ХҮРГЭЕ!</h1>
              <h2 style={{ fontSize: 16, fontWeight: 400, opacity: 0.85, margin: '0 0 24px' }}>ТА ДУУДЛАГАД ХОЖЛОО!</h2>
              {winData.image && <img src={winData.image} alt={winData.title} style={{ maxHeight: 180, borderRadius: 12, objectFit: 'contain', marginBottom: 20, border: '2px solid rgba(255,255,255,0.3)' }} />}
              <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{winData.title}</p>
              <p style={{ fontSize: 28, fontWeight: 900, margin: '0 0 20px' }}>₮{formatNumber((winData.price || 0).toString())}</p>
              <button onClick={() => setShowWinModal(false)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', borderRadius: 12, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Хаах</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Details;
