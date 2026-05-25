import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../../config/api';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../../../components/design-system';

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Load Google Client ID and initialize
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
      };
      script.onerror = () => {
        console.error('Failed to load Google script');
      };
      document.body.appendChild(script);
    };

    const loadGoogleClientId = async () => {
      try {
        const response = await axios.get(buildApiUrl('/api/users/google/client-id'));
        setGoogleClientId(response.data.clientId);
        loadGoogleScript();
      } catch (error) {
        console.error('Failed to load Google Client ID:', error);
      }
    };

    loadGoogleClientId();

    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (googleClientId && window.google) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse
      });

      const container = document.getElementById('googleSignInButton');
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(
          container,
          {
            theme: isDarkMode ? 'filled_black' : 'outline',
            size: 'large',
            width: '400'
          }
        );
      }
    }
  }, [googleClientId, isDarkMode]);

  const handleGoogleResponse = async (response) => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const authResponse = await axios.post(buildApiUrl('/api/users/google'), {
        credential: response.credential
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (authResponse.status === 200) {
        localStorage.setItem('user', JSON.stringify(authResponse.data));
        window.dispatchEvent(new Event("userLogin"));
        navigate("/", { replace: true });
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Google нэвтрэлт амжилтгүй боллоо'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Имэйл эсвэл утасны дугаар оруулна уу';
    }
    else {
      const isPhoneNumber = /^[0-9]{8}$/.test(formData.email.trim());
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());

      if (!isPhoneNumber && !isEmail) {
        newErrors.email = 'Зөв имэйл эсвэл 8 оронтой утасны дугаар оруулна уу';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Нууц үгээ оруулна уу';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post(buildApiUrl('/api/users/login'), formData, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      if (response.status === 200) {
        localStorage.setItem('user', JSON.stringify(response.data));
        window.dispatchEvent(new Event("userLogin"));
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error('Алдаа:', error);

      if (error.response) {
        switch (error.response.status) {
          case 400:
            setErrors({
              ...errors,
              submit: error.response.data.message
            });
            break;
          case 401:
            setErrors({
              ...errors,
              submit: 'Нууц үг эсвэл имэйл/утас буруу байна'
            });
            break;
          default:
            setErrors({
              ...errors,
              submit: 'Алдаа.'
            });
        }
      } else {
        setErrors({
          ...errors,
          submit: error.message
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--bn-header-height))] flex items-center justify-center bg-bn-bg py-12 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-bn-surface rounded-bn-2xl shadow-xl overflow-hidden">
        {/* Brand Side */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-bn-primary to-primary-600 p-12 text-white">
          <span className="text-3xl font-bold tracking-tight mb-8">Auction<span className="text-white/70">Hub</span></span>
          <h2 className="text-3xl font-bold mb-3 text-center">Тавтай морилно уу!</h2>
          <p className="text-white/80 text-center max-w-xs">
            Монголын тэргүүлэх дуудлага худалдааны платформ дээр нэвтэрч, санал тавьж, зарлагаа удирдаарай.
          </p>
        </div>

        {/* Form Side */}
        <div className="p-8 md:p-12">
          <div className="text-center mb-6 lg:hidden">
            <span className="text-2xl font-bold text-bn-primary tracking-tight">Auction<span className="text-bn-danger">Hub</span></span>
          </div>
          <h2 className="text-2xl font-bold text-bn-text text-center mb-6">Нэвтрэх</h2>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-bn-danger rounded-bn-md px-4 py-3 mb-4 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Google Sign-In */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <div id="googleSignInButton" className="inline-block"></div>
              {isGoogleLoading && (
                <div className="mt-2 text-sm text-bn-text-secondary">
                  <span className="bn-spinner w-4 h-4 inline-block mr-2"></span>
                  Google-ээр нэвтэрч байна...
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <hr className="flex-1 border-bn-border" />
              <span className="text-bn-text-secondary text-sm">Эсвэл</span>
              <hr className="flex-1 border-bn-border" />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-bn-text mb-1.5">
                Email / Утасны дугаар
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2.5 bg-bn-surface border rounded-bn-md text-bn-text placeholder:text-bn-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-bn-primary/30 focus:border-bn-primary transition-all ${
                  errors.email ? 'border-bn-danger' : 'border-bn-border'
                }`}
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.com эсвэл 99123456"
                required
              />
              {errors.email && (
                <p className="text-bn-danger text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-bn-text mb-1.5">
                Нууц үг
              </label>
              <input
                type="password"
                className={`w-full px-4 py-2.5 bg-bn-surface border rounded-bn-md text-bn-text focus:outline-none focus:ring-2 focus:ring-bn-primary/30 focus:border-bn-primary transition-all ${
                  errors.password ? 'border-bn-danger' : 'border-bn-border'
                }`}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && (
                <p className="text-bn-danger text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-between items-center mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-bn-border text-bn-primary focus:ring-bn-primary"
                  id="rememberMe"
                />
                <span className="text-sm text-bn-text-secondary">Намайг сана</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-bn-primary hover:text-bn-primary-dark no-underline font-medium">
                Нууц үг мартсан?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="bn-spinner w-4 h-4 mr-2"></span>
                  Нэвтрэх...
                </>
              ) : 'Нэвтрэх'}
            </Button>

            <p className="text-center text-sm text-bn-text-secondary mt-6">
              Бүртгэлгүй юу?{' '}
              <Link to="/register" className="text-bn-primary hover:text-bn-primary-dark no-underline font-medium">
                Бүртгүүлэх
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
