import "../../index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoSearchOutline, IoPersonCircleOutline, IoNotificationsOutline, IoLanguageOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

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
  const navigate = useNavigate();

  // Sample notifications and coupons
  const notifications = [
    { id: 1, type: 'bid', title: 'Таны санал амжилттай', message: 'iPhone 13 Pro дээр таны санал хүлээн авагдлаа', time: '5 минутын өмнө', unread: true },
    { id: 2, type: 'win', title: 'Та дуудлага худалдаанд хожлоо!', message: 'Samsung Galaxy S23 - Төлбөрөө төлнө үү', time: '1 цагийн өмнө', unread: true },
    { id: 3, type: 'coupon', title: '10% хөнгөлөлт купон', message: 'Дараагийн худалдан авалтдаа ашигла: AUCTION10', time: '2 цагийн өмнө', unread: false },
    { id: 4, type: 'watch', title: 'Таны хянаж буй бараа', message: 'MacBook Pro дуудлага 1 цагт дуусна', time: '3 цагийн өмнө', unread: false },
    { id: 5, type: 'coupon', title: 'Шинэ хэрэглэгчийн урамшуулал', message: '15% хөнгөлөлт эхний худалдан авалтад: WELCOME15', time: '1 өдрийн өмнө', unread: false },
  ];
  
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
      case 'bid': return '🎯';
      case 'win': return '🎉';
      case 'coupon': return '🎁';
      case 'watch': return '⏰';
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
                    style={{ color: '#334155' }}
                    onClick={toggleNotifications}
                  >
                    <IoNotificationsOutline size={24} />
                    {notifications.filter(n => n.unread).length > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '0.6rem' }}
                      >
                        {notifications.filter(n => n.unread).length}
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
                        <button
                          className="btn btn-link btn-sm p-0 text-decoration-none"
                          style={{ color: '#FF6A00', fontSize: '0.85rem' }}
                        >
                          {t('markAllRead')}
                        </button>
                      </div>
                      <div className="list-group list-group-flush">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`list-group-item list-group-item-action p-3 ${notif.unread ? 'bg-light' : ''}`}
                            style={{ cursor: 'pointer', borderLeft: notif.unread ? '3px solid #FF6A00' : 'none' }}
                          >
                            <div className="d-flex align-items-start gap-2">
                              <span style={{ fontSize: '1.5rem' }}>{getNotificationIcon(notif.type)}</span>
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
                                    {notif.title}
                                  </h6>
                                  {notif.unread && (
                                    <span className="badge bg-primary" style={{ fontSize: '0.6rem' }}>{t('new')}</span>
                                  )}
                                </div>
                                <p className="mb-1 text-muted" style={{ fontSize: '0.85rem' }}>
                                  {notif.message}
                                </p>
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {notif.time}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
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

                {/* Theme Toggle */}
                <ThemeToggle showLabel={false} />

                {/* Language */}
                <button
                  className="btn btn-outline-secondary btn-sm px-3"
                  onClick={toggleLanguage}
                  style={{ borderColor: '#E2E8F0', color: '#334155' }}
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
                    style={{ color: '#334155' }}
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
                  style={{ borderColor: '#E2E8F0', color: '#334155' }}
                >
                  <IoLanguageOutline className="me-1" />
                  {language}
                </button>

                {/* Login */}
                <Link to="/login" className="btn btn-outline-secondary btn-sm px-4" style={{ borderColor: '#E2E8F0', color: '#334155' }}>
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