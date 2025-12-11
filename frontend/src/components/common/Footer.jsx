import "../../index.css";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

export const Footer = () => {
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();

  const footerBg = isDarkMode ? "bg-dark" : "bg-secondary";
  const textColor = isDarkMode ? "text-light" : "text-white";

  return (
    <footer className={`footer ${footerBg} ${textColor} py-4 mt-5`}>
      <div className="container">
        <div className="row">
          {/* Quick Links */}
          <div className="col-md-3 col-6 mb-3 mb-md-0">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-lightning-charge me-2"></i>
              {t("quickLinks") || "Quick Links"}
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-house-door me-2"></i>
                  {t("home") || "Нүүр"}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/allproduct" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-grid me-2"></i>
                  {t("allProducts") || "Бүх бараа"}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/categories" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-folder me-2"></i>
                  {t("categories") || "Ангилал"}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/brands" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-award me-2"></i>
                  {t("brands") || "Брэнд"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="col-md-3 col-6 mb-3 mb-md-0">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-person-circle me-2"></i>
              {t("account") || "Account"}
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/profile" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-person me-2"></i>
                  {t("profile") || "Профайл"}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/mylist" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-eye me-2"></i>
                  {t("myList") || "Миний жагсаалт"}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/login" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  {t("login") || "Нэвтрэх"}
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/register" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-person-plus me-2"></i>
                  {t("signup") || "Бүртгүүлэх"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div className="col-md-3 col-6 mb-3 mb-md-0">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-info-circle me-2"></i>
              {t("information") || "Information"}
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/about" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-file-text me-2"></i>
                  {t("about") || "Бидний тухай"}
                </Link>
              </li>
              <li className="mb-2">
                <a href="#" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-question-circle me-2"></i>
                  {t("help") || "Тусламж"}
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-envelope me-2"></i>
                  {t("contact") || "Холбоо барих"}
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className={`text-decoration-none ${textColor}`} style={{ opacity: 0.8 }}>
                  <i className="bi bi-file-earmark-text me-2"></i>
                  {t("terms") || "Хэрэглэх нөхцөл"}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-md-3 col-6">
            <h6 className="fw-bold mb-3">{t("contactUs") || "Contact Us"}</h6>
            <ul className="list-unstyled">
              <li className="mb-2" style={{ opacity: 0.8 }}>
                <i className="bi bi-envelope me-2"></i>
                info@auctionhub.mn
              </li>
              <li className="mb-2" style={{ opacity: 0.8 }}>
                <i className="bi bi-telephone me-2"></i>
                +976 11 234 567
              </li>
              <li className="mb-2" style={{ opacity: 0.8 }}>
                <i className="bi bi-geo-alt me-2"></i>
                {language === 'MN' ? 'Улаанбаатар хот' : 'Ulaanbaatar'}
              </li>
            </ul>
          </div>
        </div>

        <hr className={`my-4 ${isDarkMode ? 'border-secondary' : 'border-light'}`} style={{ opacity: 0.3 }} />

        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-0" style={{ opacity: 0.8 }}>
              © {new Date().getFullYear()} AUCTIONHUB. {t("allRightsReserved") || "Бүх эрх хуулиар хамгаалагдсан."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
