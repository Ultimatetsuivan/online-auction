import "../../index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoSearchOutline, IoPersonCircleOutline, IoNotificationsOutline, IoLanguageOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';
import { socket } from '../../socket';

export const Header = () => {
  const { isDarkMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
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
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setSearchHistory(history.slice(0, 5)); // Show last 5 searches
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

    // Listen for new notifications via socket
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

      // Navigate to product page if actionUrl exists
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
        console.log('Categories fetched:', data.length, data);
        setCategories(data);
      } catch (error) {
        console.error("Category fetch error:", error);
      }
    };
    fetchCategories();
  }, []);

  // Filter categories based on search query
  useEffect(() => {
    console.log('Search query changed:', searchQuery, 'Categories count:', categories.length);
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

    setCategoryMatches(deduped.slice(0, 5)); // Limit to 5 matches
    console.log('Category matches found:', deduped.length, deduped);
  }, [searchQuery, categories]);

  // Reset expanded category when search changes
  useEffect(() => {
    setExpandedCategoryId(null);
  }, [searchQuery]);

  // Category helper functions
  const getChildren = (parentId) => {
    if (!parentId) return [];
    return categories.filter((cat) => {
      const getParentId = (category) => {
        if (!category.parent) return null;
        if (typeof category.parent === "object" && category.parent !== null) {
          return category.parent._id?.toString() || category.parent.toString();
        }
        return category.parent.toString();
      };
      const pId = getParentId(cat);
      return pId === parentId.toString();
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
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
  
  const goToSell = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/profile?tab=addProduct');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

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
      // Save to search history
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

  const clearHistory = () => {
    localStorage.removeItem("searchHistory");
    setSearchHistory([]);
  };

  return (
    <header className={`header sticky-top py-2 shadow-sm ${isDarkMode ? 'theme-dark' : 'bg-white text-dark'}`}>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center gap-3">
          {/* Logo + Search */}
          <div className="d-flex align-items-center gap-3" style={{ flex: '0 0 auto', maxWidth: '600px', width: '100%' }}>
            <Link to="/" className="text-decoration-none" style={{ whiteSpace: 'nowrap' }}>
              <h1 className="m-0 fw-bold" style={{ color: '#FF6A00', fontSize: '1.5rem' }}>
                <span>AUCTION</span>HUB
              </h1>
            </Link>

            {/* Search Bar with Dropdown */}
            <div className="d-none d-md-flex flex-grow-1 position-relative">
              <form onSubmit={handleSearch} className="w-100">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchDropdownOpen(true)}
                    style={{ borderColor: '#E2E8F0' }}
                  />
                  <button
                    className="btn text-white"
                    type="submit"
                    style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
                  >
                    <IoSearchOutline size={20} />
                  </button>
                </div>
              </form>

              {/* Search Dropdown */}
              {searchDropdownOpen && (
                <div
                  className={`position-absolute w-100 shadow-lg rounded-bottom border mt-1 ${isDarkMode ? 'theme-dark' : 'bg-white'}`}
                  style={{ top: '100%', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}
                  onMouseLeave={() => setSearchDropdownOpen(false)}
                >
                  {/* Category Matches */}
                  {categoryMatches.length > 0 && (
                    <div className="border-bottom">
                      <div className="p-2 bg-light text-muted small fw-bold">
                        <i className="bi bi-folder me-2"></i>
                        {language === 'MN' ? 'Ангилал' : 'Categories'}
                      </div>
                      <ul className="list-unstyled mb-0">
                        {categoryMatches.map((category) => {
                          const children = getChildren(category._id);
                          const isExpanded = expandedCategoryId === category._id?.toString();

                          return (
                            <li key={category._id}>
                              <div className="d-flex align-items-center">
                                <Link
                                  to={`/allproduct?category=${category._id}`}
                                  className={`d-block p-2 text-decoration-none hover-bg flex-grow-1 ${isDarkMode ? 'text-light' : 'text-dark'}`}
                                  onClick={() => setSearchDropdownOpen(false)}
                                >
                                  <i className="bi bi-folder me-2"></i>
                                  {language === 'EN' ? category.title : (category.titleMn || category.title)}
                                </Link>
                                {children.length > 0 && (
                                  <button
                                    className="btn btn-sm btn-link text-muted p-1"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setExpandedCategoryId(isExpanded ? null : category._id?.toString());
                                    }}
                                  >
                                    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                                  </button>
                                )}
                              </div>

                              {/* Child Categories */}
                              {isExpanded && children.length > 0 && (
                                <ul className="list-unstyled ms-4 bg-light">
                                  {children.map((child) => (
                                    <li key={child._id}>
                                      <Link
                                        to={`/allproduct?category=${child._id}`}
                                        className={`d-block p-2 text-decoration-none hover-bg ${isDarkMode ? 'text-light' : 'text-dark'}`}
                                        onClick={() => setSearchDropdownOpen(false)}
                                      >
                                        <i className="bi bi-folder-fill me-2 text-muted"></i>
                                        {language === 'EN' ? child.title : (child.titleMn || child.title)}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Browse Options */}
                  <div className="p-2">
                    <div
                      className="p-2 hover-bg rounded d-flex align-items-center justify-content-between mb-1"
                      style={{ cursor: 'pointer' }}
                      onClick={handleCategoryClick}
                    >
                      <span><i className="bi bi-grid-3x3-gap me-2"></i>{t('browseCategories')}</span>
                      <i className="bi bi-chevron-right"></i>
                    </div>
                    <div
                      className="p-2 hover-bg rounded d-flex align-items-center justify-content-between"
                      style={{ cursor: 'pointer' }}
                      onClick={handleBrandClick}
                    >
                      <span><i className="bi bi-award me-2"></i>{t('browseBrands')}</span>
                      <i className="bi bi-chevron-right"></i>
                    </div>
                  </div>

                  {/* Recently Searched */}
                  {searchHistory.length > 0 && (
                    <>
                      <div className="border-top px-2 pt-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted"><i className="bi bi-clock-history me-1"></i>{t('recentlySearched')}</small>
                          <button
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={clearHistory}
                            style={{ color: '#FF6A00', fontSize: '0.75rem' }}
                          >
                            {t('clear')}
                          </button>
                        </div>
                        {searchHistory.map((query, index) => (
                          <div
                            key={index}
                            className="p-2 hover-bg rounded d-flex align-items-center gap-2"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleHistoryClick(query)}
                          >
                            <IoSearchOutline size={14} style={{ color: '#999' }} />
                            <span className="small">{query}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Login/Signup/Notification/Language */}
          <nav className="d-none d-md-flex align-items-center gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <div className="dropdown position-relative">
                  <button
                    className="btn btn-link p-0 position-relative"
                    style={{ color: isDarkMode ? '#E2E8F0' : '#334155' }}
                    onClick={toggleNotifications}
                  >
                    <IoNotificationsOutline size={24} />
                    {unreadCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '0.6rem' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotificationOpen && (
                    <div
                      className="dropdown-menu show position-absolute end-0 mt-2 p-0"
                      style={{
                        display: 'block',
                        minWidth: '350px',
                        maxWidth: '400px',
                        maxHeight: '500px',
                        overflowY: 'auto'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                        <h6 className="m-0 fw-bold">{t('notifications')}</h6>
                        {unreadCount > 0 && (
                          <button
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            style={{ color: '#FF6A00', fontSize: '0.85rem' }}
                            onClick={handleMarkAllRead}
                          >
                            {t('markAllRead')}
                          </button>
                        )}
                      </div>
                      <div className="list-group list-group-flush">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-muted">
                            <i className="bi bi-bell-slash fs-1 d-block mb-2"></i>
                            <p className="mb-0">{language === 'MN' ? 'Мэдэгдэл байхгүй' : 'No notifications'}</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              className={`list-group-item list-group-item-action p-3 ${!notif.read ? 'bg-light' : ''}`}
                              style={{ cursor: 'pointer', borderLeft: !notif.read ? '3px solid #FF6A00' : 'none' }}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className="d-flex align-items-start gap-2">
                                <span style={{ fontSize: '1.5rem' }}>{getNotificationIcon(notif.type)}</span>
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
                                      {notif.title}
                                    </h6>
                                    {!notif.read && (
                                      <span className="badge bg-primary" style={{ fontSize: '0.6rem' }}>{t('new')}</span>
                                    )}
                                  </div>
                                  <p className="mb-1 text-muted" style={{ fontSize: '0.85rem' }}>
                                    {notif.message}
                                  </p>
                                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {formatNotificationTime(notif.createdAt)}
                                  </small>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-top text-center">
                        <button
                          className="btn btn-link text-decoration-none w-100"
                          style={{ color: '#FF6A00', fontSize: '0.9rem' }}
                        >
                          {t('viewAllNotifications')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sell Button */}
                <button
                  className="btn btn-sm text-white"
                  onClick={goToSell}
                  style={{ backgroundColor: '#FF3B30', borderColor: '#FF3B30' }}
                >
                  {language === 'MN' ? 'Зар оруулах' : 'Sell'}
                </button>

                {/* Theme Toggle */}
                <ThemeToggle showLabel={false} />

                {/* Language */}
                <button
                  className="btn btn-outline-secondary btn-sm px-3"
                  onClick={toggleLanguage}
                  style={{ borderColor: '#E2E8F0', color: isDarkMode ? '#E2E8F0' : '#334155' }}
                >
                  <IoLanguageOutline className="me-1" />
                  {language}
                </button>

                {/* Profile Dropdown */}
                <div className="dropdown position-relative">
                  <button
                    className="btn btn-link text-decoration-none p-0 d-flex align-items-center gap-1"
                    onClick={toggleDropdown}
                    aria-expanded={isDropdownOpen}
                    style={{ color: isDarkMode ? '#E2E8F0' : '#334155' }}
                  >
                    <IoPersonCircleOutline size={28} />
                    <span className="small">{user.name || "Profile"}</span>
                  </button>
                  {isDropdownOpen && (
                    <ul
                      className="dropdown-menu show position-absolute end-0 mt-2"
                      style={{ display: 'block' }}
                    >
                      <li>
                        <Link
                          to={user.role === "admin" ? "#" : "/profile"}
                          className="dropdown-item"
                          onClick={handleProfileClick}
                        >
                          {user.role === "admin" ? t('adminPanel') : t('profile')}
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="dropdown-item text-danger"
                        >
                          {t('logout')}
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Theme Toggle */}
                <ThemeToggle showLabel={false} />

                {/* Language */}
                <button
                  className="btn btn-outline-secondary btn-sm px-3"
                  onClick={toggleLanguage}
                  style={{ borderColor: '#E2E8F0', color: isDarkMode ? '#E2E8F0' : '#334155' }}
                >
                  <IoLanguageOutline className="me-1" />
                  {language}
                </button>

                {/* Sell CTA for guests -> login */}
                <button
                  className="btn btn-sm text-white"
                  onClick={() => navigate('/login')}
                  style={{ backgroundColor: '#FF3B30', borderColor: '#FF3B30' }}
                >
                  {language === 'MN' ? 'Зар оруулах' : 'Sell'}
                </button>

                {/* Login */}
                <Link to="/login" className="btn btn-outline-secondary btn-sm px-4" style={{ borderColor: '#E2E8F0', color: isDarkMode ? '#E2E8F0' : '#334155' }}>
                  {t('login')}
                </Link>

                {/* Signup */}
                <Link to="/register" className="btn btn-sm text-white px-4" style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}>
                  {t('signup')}
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="btn d-md-none border-0 p-0"
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
            style={{ color: '#FF6A00', fontSize: '1.5rem' }}
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu - Dropdown */}
        {isMenuOpen && (
          <div className={`mt-3 d-md-none p-3 rounded shadow ${isDarkMode ? 'theme-dark' : 'bg-white'}`} style={{ border: '1px solid #E2E8F0' }}>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link 
                  to="/" 
                  className="text-decoration-none d-block p-2 rounded hover-bg"
                  style={{ color: '#334155' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('home')}
                </Link>
              </li>
              <li className="mb-2">
                <Link 
                  to="/allproduct" 
                  className="text-decoration-none d-block p-2 rounded hover-bg"
                  style={{ color: '#334155' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('auctions')}
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-decoration-none d-block p-2 rounded hover-bg"
                  style={{ color: '#334155' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('about')}
                </Link>
              </li>

              {user ? (
                <>
                  <li className="mb-2">
                    <button
                      onClick={() => { setIsMenuOpen(false); navigate('/profile?tab=addProduct'); }}
                      className="btn w-100 text-white mb-2"
                      style={{ backgroundColor: '#FF3B30', borderColor: '#FF3B30' }}
                    >
                      {language === 'MN' ? 'Зар оруулах' : 'Sell'}
                    </button>
                  </li>
                  <li className="mb-2">
                    <Link
                      to="/mylist"
                      className="text-decoration-none d-block p-2 rounded hover-bg"
                      style={{ color: '#334155' }}
                      onClick={(e) => {
                        setIsMenuOpen(false);
                        e.stopPropagation();
                      }}
                    >
                      {t('myList')}
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link
                      to={user.role === "admin" ? "#" : "/profile"}
                      className="text-decoration-none d-block p-2 rounded hover-bg"
                      style={{ color: '#334155' }}
                      onClick={handleProfileClick}
                    >
                      {user.role === "admin" ? t('adminPanel') : t('profile')}
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout} 
                      className="btn btn-outline-danger w-100"
                    >
                      {t('logout')}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="mb-2">
                    <Link 
                      to="/login" 
                      className="btn btn-outline-secondary w-100 mb-2"
                      style={{ borderColor: '#E2E8F0', color: '#334155' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('login')}
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/register" 
                      className="btn w-100 text-white"
                      style={{ backgroundColor: '#FF6A00', borderColor: '#FF6A00' }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('signup')}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};