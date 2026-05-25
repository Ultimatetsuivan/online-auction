import { IoSearchOutline, IoPersonCircleOutline, IoNotificationsOutline, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';
import { socket } from '../../socket';
import { Dropdown, DropdownItem, DropdownDivider } from '../design-system';
import { Avatar } from '../design-system';

export const Header = () => {
  const { isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoryMatches, setCategoryMatches] = useState([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateUser = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    updateUser();

    window.addEventListener("userLogin", updateUser);
    window.addEventListener("storage", updateUser);

    return () => {
      window.removeEventListener("userLogin", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setSearchHistory(history.slice(0, 5));
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !user.token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const response = await axios.get(buildApiUrl('/api/notifications'), {
          headers: {
            Authorization: `Bearer ${user.token}`
          },
          params: {
            limit: 10
          }
        });

        if (response.data.success) {
          setNotifications(response.data.notifications || []);
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
      setUnreadCount(prev => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user || !user.token) return;

    try {
      await axios.post(buildApiUrl('/api/notifications/mark-all-read'), {}, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!user || !user.token) return;

    try {
      if (!notification.read) {
        await axios.put(buildApiUrl(`/api/notifications/${notification._id}/read`), {}, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      } else if (notification.product) {
        navigate(`/products/${notification.product._id || notification.product}`);
      }

      setIsNotificationOpen(false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatNotificationTime = (createdAt) => {
    const now = new Date();
    const notifTime = new Date(createdAt);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'MN' ? 'Яг одоо' : 'Just now';
    if (diffMins < 60) return language === 'MN' ? `${diffMins} минутын өмнө` : `${diffMins} min ago`;
    if (diffHours < 24) return language === 'MN' ? `${diffHours} цагийн өмнө` : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return language === 'MN' ? `${diffDays} өдрийн өмнө` : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(buildApiUrl("/api/category/"));
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setCategories(data);
      } catch (error) {
        console.error("Category fetch error:", error);
      }
    };
    fetchCategories();
  }, []);

  // Filter categories based on search query
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setCategoryMatches([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const isParentCategory = (category) => {
      if (!category.parent) return true;
      if (typeof category.parent === "object" && (category.parent === null || !category.parent._id)) {
        return true;
      }
      return false;
    };

    const getParentId = (category) => {
      if (!category.parent) return null;
      if (typeof category.parent === "object" && category.parent !== null) {
        return category.parent._id?.toString() || category.parent.toString();
      }
      return category.parent.toString();
    };

    const parents = categories.filter((category) => {
      const title = (category.titleMn || category.title || "").toLowerCase();
      return isParentCategory(category) && title.includes(query);
    });

    const combined = categories.reduce((acc, category) => {
      if (isParentCategory(category)) return acc;
      const title = (category.titleMn || category.title || "").toLowerCase();
      if (title.includes(query)) {
        const parentId = getParentId(category);
        if (parentId) {
          const parent = categories.find(
            (cat) => cat._id?.toString() === parentId.toString()
          );
          if (parent) acc.push(parent);
        }
      }
      return acc;
    }, [...parents]);

    const seen = new Set();
    const deduped = combined.filter((cat) => {
      const id = cat._id?.toString();
      if (!id) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    setCategoryMatches(deduped.slice(0, 5));
  }, [searchQuery, categories]);

  useEffect(() => {
    setExpandedCategoryId(null);
  }, [searchQuery]);

  const getChildren = (parentId) => {
    if (!parentId) return [];
    return categories.filter((cat) => {
      const pId = getParentId(cat);
      return pId === parentId.toString();
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("likedProducts");
    setUser(null);
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    window.dispatchEvent(new Event('userLogin'));
    navigate("/login");
  };

  const handleProfileClick = (e) => {
    if (!user) return;

    if (user.role === "admin") {
      e.preventDefault();
      navigate("/admin");
    }
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const goToProfileTab = (tab) => {
    if (!user) return;
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    navigate(tab ? `/profile/tab/${tab}` : "/profile");
  };

  const goToSell = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/profile/tab/addProduct');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleNotifications = () => setIsNotificationOpen(!isNotificationOpen);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_bid': return '🎯';
      case 'outbid': return '⚠️';
      case 'won_auction': return '🎉';
      case 'sold': return '💰';
      case 'price_drop': return '💸';
      case 'expiring_soon': return '⏰';
      case 'like_update': return '❤️';
      default: return '📢';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, 10);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      setSearchHistory(newHistory.slice(0, 5));

      navigate(`/allproduct?search=${encodeURIComponent(searchQuery)}`);
      setSearchDropdownOpen(false);
    }
  };

  const handleCategoryClick = () => {
    navigate('/categories');
    setSearchDropdownOpen(false);
  };

  const handleBrandClick = () => {
    navigate('/brands');
    setSearchDropdownOpen(false);
  };

  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    navigate(`/allproduct?search=${encodeURIComponent(query)}`);
    setSearchDropdownOpen(false);
  };

  const handleLogoClick = () => {
    setSearchDropdownOpen(false);
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setIsNotificationOpen(false);
    navigate('/', { replace: false });
  };

  const clearHistory = () => {
    localStorage.removeItem("searchHistory");
    setSearchHistory([]);
  };

  return (
    <header className="sticky top-0 z-50 bg-bn-surface/95 backdrop-blur-md border-b border-bn-border" style={{ height: 'var(--bn-header-height)' }}>
      <div className="max-w-bn mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 no-underline" onClick={handleLogoClick}>
          <span className="text-xl font-bold text-bn-primary tracking-tight">Auction<span className="text-bn-danger">Hub</span></span>
        </Link>

        {/* Search - Centered, desktop only */}
        <div className="hidden md:flex flex-1 max-w-xl mx-auto relative">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative flex items-center">
              <IoSearchOutline className="absolute left-3.5 text-bn-text-tertiary" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchDropdownOpen(true)}
                placeholder={language === 'MN' ? 'Хайх...' : 'Search for anything...'}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-bn-bg-secondary text-sm text-bn-text placeholder:text-bn-text-tertiary border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </form>

          {/* Search Dropdown */}
          {searchDropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-2 bg-bn-surface rounded-bn-lg border border-bn-border shadow-soft-lg z-50 max-h-96 overflow-y-auto"
              onMouseLeave={() => setSearchDropdownOpen(false)}
            >
              {/* Category Matches */}
              {categoryMatches.length > 0 && (
                <div className="border-b border-bn-divider">
                  <div className="px-4 py-2 text-xs font-semibold text-bn-text-tertiary uppercase tracking-wider">
                    {language === 'MN' ? 'Ангилал' : 'Categories'}
                  </div>
                  {categoryMatches.map((category) => {
                    const children = getChildren(category._id);
                    const isExpanded = expandedCategoryId === category._id?.toString();
                    return (
                      <div key={category._id}>
                        <div className="flex items-center">
                          <Link
                            to={`/categories?categoryid=${category._id}`}
                            className="flex-1 px-4 py-2.5 text-sm text-bn-text hover:bg-bn-surface-hover transition-colors no-underline flex items-center gap-2"
                            onClick={() => setSearchDropdownOpen(false)}
                          >
                            <i className="bi bi-folder text-bn-text-tertiary" />
                            {language === 'EN' ? category.title : (category.titleMn || category.title)}
                          </Link>
                          {children.length > 0 && (
                            <button
                              className="px-3 py-2.5 text-bn-text-tertiary hover:text-bn-text transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                setExpandedCategoryId(isExpanded ? null : category._id?.toString());
                              }}
                            >
                              <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-xs`} />
                            </button>
                          )}
                        </div>
                        {isExpanded && children.length > 0 && (
                          <div className="bg-bn-bg-secondary">
                            {children.map((child) => (
                              <Link
                                key={child._id}
                                to={`/categories?categoryid=${child._id}`}
                                className="block px-4 pl-10 py-2 text-sm text-bn-text-secondary hover:bg-bn-surface-hover transition-colors no-underline"
                                onClick={() => setSearchDropdownOpen(false)}
                              >
                                {language === 'EN' ? child.title : (child.titleMn || child.title)}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Browse Options */}
              <div className="p-2">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-bn-md text-sm text-bn-text hover:bg-bn-surface-hover transition-colors"
                  onClick={handleCategoryClick}
                >
                  <span className="flex items-center gap-2">
                    <i className="bi bi-grid-3x3-gap text-bn-text-tertiary" />
                    {t('browseCategories')}
                  </span>
                  <i className="bi bi-chevron-right text-bn-text-tertiary text-xs" />
                </button>
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-bn-md text-sm text-bn-text hover:bg-bn-surface-hover transition-colors"
                  onClick={handleBrandClick}
                >
                  <span className="flex items-center gap-2">
                    <i className="bi bi-award text-bn-text-tertiary" />
                    {t('browseBrands')}
                  </span>
                  <i className="bi bi-chevron-right text-bn-text-tertiary text-xs" />
                </button>
              </div>

              {/* Recently Searched */}
              {searchHistory.length > 0 && (
                <div className="border-t border-bn-divider p-2">
                  <div className="flex justify-between items-center px-3 py-1.5">
                    <span className="text-xs text-bn-text-tertiary">{t('recentlySearched')}</span>
                    <button
                      className="text-xs text-bn-primary hover:text-bn-primary-dark transition-colors"
                      onClick={clearHistory}
                    >
                      {t('clear')}
                    </button>
                  </div>
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-bn-md text-sm text-bn-text-secondary hover:bg-bn-surface-hover transition-colors"
                      onClick={() => handleHistoryClick(query)}
                    >
                      <IoSearchOutline size={14} className="text-bn-text-tertiary" />
                      {query}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications */}
              <Dropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                width="w-80"
                trigger={
                  <button
                    className="relative p-2 rounded-full text-bn-text-secondary hover:bg-bn-surface-hover transition-colors"
                    onClick={toggleNotifications}
                  >
                    <IoNotificationsOutline size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-bn-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                }
              >
                <div className="flex justify-between items-center px-4 py-3 border-b border-bn-divider">
                  <h3 className="text-sm font-semibold text-bn-text">{t('notifications')}</h3>
                  {unreadCount > 0 && (
                    <button
                      className="text-xs text-bn-primary hover:text-bn-primary-dark transition-colors"
                      onClick={handleMarkAllRead}
                    >
                      {t('markAllRead')}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <i className="bi bi-bell-slash text-3xl text-bn-text-tertiary block mb-2" />
                      <p className="text-sm text-bn-text-secondary">{language === 'MN' ? 'Мэдэгдэл байхгүй' : 'No notifications'}</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif._id}
                        className={`w-full text-left px-4 py-3 hover:bg-bn-surface-hover transition-colors border-l-2 ${!notif.read ? 'border-l-bn-primary bg-primary-50/30' : 'border-l-transparent'}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-bn-text truncate">{notif.title}</p>
                              {!notif.read && <span className="w-2 h-2 rounded-full bg-bn-primary flex-shrink-0 mt-1.5" />}
                            </div>
                            <p className="text-xs text-bn-text-secondary mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-bn-text-tertiary mt-1">{formatNotificationTime(notif.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-bn-divider p-2">
                  <button className="w-full text-center text-sm text-bn-primary hover:text-bn-primary-dark py-2 transition-colors">
                    {t('viewAllNotifications')}
                  </button>
                </div>
              </Dropdown>

              {/* Sell Button */}
              <button
                className="px-4 py-2 rounded-bn-md text-sm font-semibold bg-bn-primary text-white hover:brightness-110 transition-all"
                onClick={goToSell}
              >
                {language === 'MN' ? 'Зарах' : 'Sell'}
              </button>

              {/* Profile Dropdown — hover to open, click goes to Account */}
              <div
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
              <Dropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                width="w-60"
                trigger={
                  <button
                    className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-bn-surface-hover transition-colors"
                    onClick={() => goToProfileTab('profile')}
                  >
                    <Avatar name={user.name} size="sm" />
                    <span className="text-sm font-medium text-bn-text max-w-[100px] truncate">{user.name || "Профайл"}</span>
                  </button>
                }
              >
                {user.role === "admin" ? (
                  <div className="py-1">
                    <DropdownItem onClick={handleProfileClick}>{t('adminPanel')}</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onClick={handleLogout} danger>{t('logout')}</DropdownItem>
                  </div>
                ) : (
                  <div className="py-1">
                    {/* User header */}
                    <div className="px-4 py-3 border-b border-bn-divider">
                      <div className="text-sm font-semibold text-bn-text truncate">{user.name}</div>
                      <div className="text-xs text-bn-text-tertiary truncate">{user.email}</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-primary-50 text-primary-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <span>💰</span> {user.balance?.toFixed(0) || '0'}₮
                      </div>
                    </div>
                    {/* Nav items */}
                    <div className="py-1">
                      <DropdownItem onClick={() => goToProfileTab('myProducts')}>
                        <span className="flex items-center gap-2.5">🗂️ {language === 'MN' ? 'Зарлагууд' : 'My Listings'}</span>
                      </DropdownItem>
                      <DropdownItem onClick={() => goToProfileTab('bids')}>
                        <span className="flex items-center gap-2.5">⚡ {language === 'MN' ? 'Дуусгавар & Хяналт' : 'Bids & Watchlist'}</span>
                      </DropdownItem>
                      <DropdownItem onClick={() => goToProfileTab('sellingDashboard')}>
                        <span className="flex items-center gap-2.5">📊 {language === 'MN' ? 'Хянах самбар' : 'Dashboard'}</span>
                      </DropdownItem>
                      <DropdownItem onClick={() => goToProfileTab('wallet')}>
                        <span className="flex items-center gap-2.5">💳 {language === 'MN' ? 'Хэтэвч' : 'Wallet & History'}</span>
                      </DropdownItem>
                      <DropdownItem onClick={() => goToProfileTab('profile')}>
                        <span className="flex items-center gap-2.5">👤 {language === 'MN' ? 'Акаунт' : 'Account'}</span>
                      </DropdownItem>
                    </div>
                    <DropdownDivider />
                    <DropdownItem onClick={goToSell}>
                      <span className="flex items-center gap-2.5 text-bn-primary font-semibold">🏷️ {language === 'MN' ? 'Зар оруулах' : 'Sell an item'}</span>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onClick={handleLogout} danger>{t('logout')}</DropdownItem>
                  </div>
                )}
              </Dropdown>
              </div>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-bn-md text-sm font-semibold bg-bn-primary text-white hover:brightness-110 transition-all"
                onClick={() => navigate('/login')}
              >
                {language === 'MN' ? 'Зарах' : 'Sell'}
              </button>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-bn-text-secondary hover:text-bn-text transition-colors no-underline"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-bn-md text-sm font-semibold bg-bn-primary text-white hover:brightness-110 transition-all no-underline"
              >
                {t('signup')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-bn-md text-bn-text-secondary hover:bg-bn-surface-hover transition-colors ml-auto"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? <IoCloseOutline size={24} /> : <IoMenuOutline size={24} />}
        </button>
      </div>

      {/* Mobile Menu - Slide down */}
      {isMenuOpen && (
        <div className="md:hidden bg-bn-surface border-t border-bn-divider shadow-soft-lg animate-fade-in">
          <div className="max-w-bn mx-auto px-4 py-4 space-y-2">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative flex items-center">
                <IoSearchOutline className="absolute left-3.5 text-bn-text-tertiary" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'MN' ? 'Хайх...' : 'Search...'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-bn-full bg-bn-bg-secondary text-sm text-bn-text placeholder:text-bn-text-tertiary border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </form>

            <Link to="/" className="block px-3 py-2.5 rounded-bn-md text-sm font-medium text-bn-text hover:bg-bn-surface-hover transition-colors no-underline" onClick={() => setIsMenuOpen(false)}>
              {t('home')}
            </Link>
            <Link to="/allproduct" className="block px-3 py-2.5 rounded-bn-md text-sm font-medium text-bn-text hover:bg-bn-surface-hover transition-colors no-underline" onClick={() => setIsMenuOpen(false)}>
              {t('auctions')}
            </Link>
            <Link to="/about" className="block px-3 py-2.5 rounded-bn-md text-sm font-medium text-bn-text hover:bg-bn-surface-hover transition-colors no-underline" onClick={() => setIsMenuOpen(false)}>
              {t('about')}
            </Link>

            <div className="h-px bg-bn-divider my-2" />

            {user ? (
              <>
                <button
                  onClick={() => { setIsMenuOpen(false); navigate('/profile/tab/addProduct'); }}
                  className="w-full py-2.5 rounded-bn-md text-sm font-semibold bg-bn-danger text-white hover:brightness-110 transition-all"
                >
                  {language === 'MN' ? 'Зар оруулах' : 'Sell'}
                </button>
                <Link to="/profile/tab/mylist" className="block px-3 py-2.5 rounded-bn-md text-sm text-bn-text hover:bg-bn-surface-hover transition-colors no-underline" onClick={() => setIsMenuOpen(false)}>
                  {t('myWatchlist') || 'My Watchlist'}
                </Link>
                <Link
                  to={user.role === "admin" ? "#" : "/profile"}
                  className="block px-3 py-2.5 rounded-bn-md text-sm text-bn-text hover:bg-bn-surface-hover transition-colors no-underline"
                  onClick={handleProfileClick}
                >
                  {user.role === "admin" ? t('adminPanel') : t('profile')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-bn-md text-sm font-medium text-bn-danger border border-bn-danger hover:bg-red-50 transition-colors"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block w-full py-2.5 rounded-bn-md text-sm font-medium text-center border border-bn-border text-bn-text hover:bg-bn-surface-hover transition-colors no-underline" onClick={() => setIsMenuOpen(false)}>
                  {t('login')}
                </Link>
                <Link to="/register" className="block w-full py-2.5 rounded-bn-md text-sm font-semibold text-center bg-bn-primary text-white hover:brightness-110 transition-all no-underline" onClick={() => setIsMenuOpen(false)}>
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
