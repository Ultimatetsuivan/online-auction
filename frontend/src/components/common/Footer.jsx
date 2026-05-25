import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

export const Footer = () => {
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();

  return (
    <footer className="bg-bn-bg-secondary border-t border-bn-border mt-auto">
      <div className="max-w-bn mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Quick Links */}
          <div>
            <h6 className="text-sm font-semibold text-bn-text mb-4">
              {t("quickLinks") || "Quick Links"}
            </h6>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("home") || "Нүүр"}
                </Link>
              </li>
              <li>
                <Link to="/allproduct" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("allProducts") || "Бүх бараа"}
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("categories") || "Ангилал"}
                </Link>
              </li>
              <li>
                <Link to="/brands" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("brands") || "Брэнд"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h6 className="text-sm font-semibold text-bn-text mb-4">
              {t("account") || "Account"}
            </h6>
            <ul className="space-y-2.5">
              <li>
                <Link to="/profile" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("profile") || "Профайл"}
                </Link>
              </li>
              <li>
                <Link to="/mylist" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("myList") || "Миний жагсаалт"}
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("login") || "Нэвтрэх"}
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("signup") || "Бүртгүүлэх"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h6 className="text-sm font-semibold text-bn-text mb-4">
              {t("information") || "Information"}
            </h6>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-sm text-bn-text-secondary hover:text-bn-primary transition-colors no-underline">
                  {t("about") || "Бидний тухай"}
                </Link>
              </li>
              <li>
                <span className="text-sm text-bn-text-secondary cursor-default">
                  {t("help") || "Тусламж"}
                </span>
              </li>
              <li>
                <span className="text-sm text-bn-text-secondary cursor-default">
                  {t("contact") || "Холбоо барих"}
                </span>
              </li>
              <li>
                <span className="text-sm text-bn-text-secondary cursor-default">
                  {t("terms") || "Хэрэглэх нөхцөл"}
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h6 className="text-sm font-semibold text-bn-text mb-4">
              {t("contactUs") || "Contact Us"}
            </h6>
            <ul className="space-y-2.5">
              <li className="text-sm text-bn-text-secondary flex items-center gap-2">
                <i className="bi bi-envelope text-bn-text-tertiary" />
                info@auctionhub.mn
              </li>
              <li className="text-sm text-bn-text-secondary flex items-center gap-2">
                <i className="bi bi-telephone text-bn-text-tertiary" />
                +976 11 234 567
              </li>
              <li className="text-sm text-bn-text-secondary flex items-center gap-2">
                <i className="bi bi-geo-alt text-bn-text-tertiary" />
                {language === 'MN' ? 'Улаанбаатар хот' : 'Ulaanbaatar'}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-bn-border mt-10 pt-8 text-center">
          <span className="text-lg font-bold text-bn-primary tracking-tight">Auction<span className="text-bn-danger">Hub</span></span>
          <p className="text-sm text-bn-text-tertiary mt-3">
            &copy; {new Date().getFullYear()} AuctionHub. {t("allRightsReserved") || "Бүх эрх хуулиар хамгаалагдсан."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
