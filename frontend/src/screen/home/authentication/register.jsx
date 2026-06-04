import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../components/common/Toast';
import { buildApiUrl } from '../../../config/api';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../../../components/design-system';
import { RegistrationNumberInput } from '../../../components/RegistrationNumberInput';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    registrationNumber: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const toast = useToast();

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [eula, setEula] = useState(null);
  const [showEulaContent, setShowEulaContent] = useState(false);
  const [hasAcceptedEula, setHasAcceptedEula] = useState(false);
  const { isDarkMode } = useTheme();

  // Load Google Client ID and initialize
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        setGoogleScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleScriptLoaded(true);
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
            text: 'signup_with',
            width: '400'
          }
        );
      }
    }
  }, [googleClientId, isDarkMode]);

  useEffect(() => {
    const fetchEula = async () => {
      try {
        const response = await axios.get(buildApiUrl('/api/legal/eula/current'));
        setEula(response.data?.eula || null);
      } catch (error) {
        console.error('Failed to load EULA:', error);
      }
    };

    fetchEula();
  }, []);

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
        submit: error.response?.data?.error || error.response?.data?.message || 'Google нэвтрэлт амжилтгүй боллоо'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, email, phone, registrationNumber, password, confirmPassword } = formData;

    if (!name.trim()) newErrors.name = 'Нэрээ оруулна уу';

    if (!email.trim()) {
      newErrors.email = 'Имэйлээ оруулна уу';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Зөв имэйл хаяг оруулна уу';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Утасны дугаараа оруулна уу';
    } else if (!/^[0-9]{8}$/.test(phone.trim())) {
      newErrors.phone = 'Зөв 8 оронтой утасны дугаар оруулна уу';
    }

    if (registrationNumber.trim() && !/^[А-ЯӨҮЁа-яөүё]{2}\d{8}$/.test(registrationNumber.trim())) {
      newErrors.registrationNumber = 'Регистрийн дугаар буруу байна. Жишээ: УГ99999999';
    }

    if (!password) {
      newErrors.password = 'Нууц үгээ оруулна уу';
    } else if (password.length < 6) {
      newErrors.password = 'Нууц үг багадаа 6 тэмдэгтээс бүрдсэн байх ёстой';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Нууц үг таарахгүй байна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    // Normalize email to lowercase and trim
    const normalizedEmail = formData.email.toLowerCase().trim();
    setRegisteredEmail(normalizedEmail);

    try {
      await axios.post(buildApiUrl('/api/users/send-code'), {
        email: normalizedEmail
      });

      toast.success('Баталгаажуулах код илгээгдлээ!');
      setRegistrationStep(2);
    } catch (error) {
      console.error('Send code error:', error);
      if (error.response?.status === 409) {
        setErrors({ email: 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна' });
      } else {
        setErrors({ submit: error.response?.data?.error || error.response?.data?.message || 'Код илгээхэд алдаа гарлаа' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!hasAcceptedEula) {
      setErrors(prev => ({ ...prev, acceptEula: 'Үйлчилгээний нөхцөлийг зөвшөөрнө үү.' }));
      return;
    }
    setIsSubmitting(true);
    setErrors({});

    try {
      // Verify the code
      await axios.post(buildApiUrl('/api/users/verify-email'), {
        email: registeredEmail,
        code: verificationCode.trim()
      });

      // Register the user with normalized email
      const { confirmPassword, ...userData } = formData;
      const normalizedUserData = {
        ...userData,
        email: registeredEmail,
        registrationNumber: userData.registrationNumber.trim() || undefined,
        acceptEula: true
      };

      await axios.post(buildApiUrl('/api/users/register'), normalizedUserData);

      // Login automatically
      const loginResponse = await axios.post(buildApiUrl('/api/users/login'), {
        email: registeredEmail,
        password: userData.password
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (loginResponse.status === 200) {
        localStorage.setItem('user', JSON.stringify(loginResponse.data));
        window.dispatchEvent(new Event("userLogin"));
        toast.success('Амжилттай бүртгэгдлээ!');
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Баталгаажуулах код буруу байна';
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      // Use send-code endpoint to resend
      await axios.post(buildApiUrl('/api/users/send-code'), {
        email: registeredEmail
      });
      toast.success('Баталгаажуулах шинэ код имэйлээр илгээгдлээ!');
    } catch (error) {
      console.error('Resend code error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Код дахин илгээхэд алдаа гарлаа';
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    }
  };

  const inputClasses = (fieldName) =>
    `w-full px-4 py-2.5 bg-bn-surface border rounded-bn-md text-bn-text placeholder:text-bn-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-bn-primary/30 focus:border-bn-primary transition-all ${
      errors[fieldName] ? 'border-bn-danger' : 'border-bn-border'
    }`;

  if (registrationStep === 2) {
    return (
      <div className="min-h-[calc(100vh-var(--bn-header-height))] flex items-center justify-center bg-bn-bg py-12 px-4">
        <div className="w-full max-w-md bg-bn-surface rounded-bn-2xl shadow-xl p-8 md:p-10">
          <h2 className="text-2xl font-bold text-bn-text text-center mb-6">Имэйл баталгаажуулалт</h2>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-bn-danger rounded-bn-md px-4 py-3 mb-4 text-sm">
              {errors.submit}
            </div>
          )}

          <p className="text-center text-bn-text-secondary mb-6">
            Бид <strong className="text-bn-text">{registeredEmail}</strong> хаяг руу 6 оронтой баталгаажуулах код илгээлээ.
          </p>

          <form onSubmit={handleVerificationSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-bn-text mb-1.5">Баталгаажуулах код</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-bn-surface border border-bn-border rounded-bn-md text-bn-text text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-bn-primary/30 focus:border-bn-primary transition-all"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                maxLength="6"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm text-bn-text">
                  {(eula?.titleMn || eula?.title || 'EULA')} {eula?.version ? `(v${eula.version})` : ''}
                </span>
                <button
                  type="button"
                  className="text-bn-primary text-sm font-medium hover:text-bn-primary-dark bg-transparent border-0"
                  onClick={() => setShowEulaContent((prev) => !prev)}
                  disabled={!eula}
                >
                  {showEulaContent ? 'Хаах' : 'Харах'}
                </button>
              </div>
              {showEulaContent && eula && (
                <div
                  className="border border-bn-border rounded-bn-md bg-bn-bg-secondary p-3 text-sm max-h-48 overflow-y-auto mt-2"
                  dangerouslySetInnerHTML={{
                    __html: eula.contentMn || eula.content || ''
                  }}
                />
              )}
              {!eula && (
                <div className="text-bn-text-secondary text-sm mt-2">EULA ачааллаж байна...</div>
              )}
            </div>

            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                className="w-4 h-4 mt-0.5 rounded border-bn-border text-bn-primary focus:ring-bn-primary"
                type="checkbox"
                id="acceptEula"
                checked={hasAcceptedEula}
                onChange={(event) => {
                  setHasAcceptedEula(event.target.checked);
                  setErrors(prev => ({ ...prev, acceptEula: null }));
                }}
              />
              <span className="text-sm text-bn-text">
                Үйлчилгээний нөхцөл болон EULA-г зөвшөөрч байна.
              </span>
            </label>
            {errors.acceptEula && (
              <p className="text-bn-danger text-xs -mt-2 mb-3">{errors.acceptEula}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || verificationCode.length < 6}
            >
              {isSubmitting ? (
                <>
                  <span className="bn-spinner w-4 h-4 mr-2"></span>
                  Баталгаажуулж байна...
                </>
              ) : 'Баталгаажуулах'}
            </Button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <button
              onClick={resendVerificationCode}
              className="text-bn-primary text-sm font-medium hover:text-bn-primary-dark bg-transparent border-0"
            >
              Код дахин илгээх
            </button>
            <div>
              <button
                onClick={() => setRegistrationStep(1)}
                className="text-bn-text-secondary text-sm hover:text-bn-text bg-transparent border-0"
              >
                Буцах
              </button>
            </div>
          </div>
          <div className="mt-4 p-3 bg-bn-bg-secondary rounded-bn-md">
            <p className="text-bn-text-secondary text-xs">
              <span className="font-semibold">Анхаар:</span> Имэйл ирсэнгүй юу? Spam хавтас шалгана уу. Код 10 минутын дараа хүчингүй болно.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-var(--bn-header-height))] flex items-center justify-center bg-bn-bg py-12 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-bn-surface rounded-bn-2xl shadow-xl overflow-hidden">
        {/* Brand Side */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-bn-primary to-primary-600 p-12 text-white">
          <span className="text-3xl font-bold tracking-tight mb-8">Auction<span className="text-white/70">Hub</span></span>
          <h2 className="text-3xl font-bold mb-3 text-center">Бүртгэл үүсгэх</h2>
          <p className="text-white/80 text-center max-w-xs">
            Монголын тэргүүлэх дуудлага худалдааны платформ дээр санал тавьж, өөрийн бараагаа зарж эхлээрэй.
          </p>
        </div>

        {/* Form Side */}
        <div className="p-8 md:p-10">
          <div className="text-center mb-6 lg:hidden">
            <span className="text-2xl font-bold text-bn-primary tracking-tight">Auction<span className="text-bn-danger">Hub</span></span>
          </div>
          <h2 className="text-2xl font-bold text-bn-text text-center mb-6">Бүртгэл үүсгэх</h2>

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

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-bn-text mb-1.5">Нэр</label>
              <input
                type="text"
                className={inputClasses('name')}
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && <p className="text-bn-danger text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-bn-text mb-1.5">Имэйл</label>
              <input
                type="email"
                className={inputClasses('email')}
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="text-bn-danger text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-bn-text mb-1.5">Утасны дугаар</label>
              <input
                type="text"
                className={inputClasses('phone')}
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="99123456"
                maxLength="8"
                required
              />
              {errors.phone && <p className="text-bn-danger text-xs mt-1">{errors.phone}</p>}
              <p className="text-bn-text-secondary text-xs mt-1">8 оронтой утасны дугаар (жишээ: 99123456)</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-bn-text mb-1.5">
                Регистрийн дугаар <span className="text-bn-text-secondary font-normal">(заавал биш)</span>
              </label>
              <RegistrationNumberInput
                value={formData.registrationNumber}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, registrationNumber: val }));
                  if (errors.registrationNumber) setErrors(prev => ({ ...prev, registrationNumber: null }));
                }}
                error={!!errors.registrationNumber}
              />
              {errors.registrationNumber && <p className="text-bn-danger text-xs mt-1">{errors.registrationNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-bn-text mb-1.5">Нууц үг</label>
                <input
                  type="password"
                  className={inputClasses('password')}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
                {errors.password && <p className="text-bn-danger text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-bn-text mb-1.5">Нууц үг (дахин)</label>
                <input
                  type="password"
                  className={inputClasses('confirmPassword')}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && <p className="text-bn-danger text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="bn-spinner w-4 h-4 mr-2"></span>
                  Баталгаажуулах код илгээж байна...
                </>
              ) : 'Бүртгэл үүсгэх'}
            </Button>
          </form>

          <p className="text-center text-sm text-bn-text-secondary mt-6">
            Бүртгэлтэй юу?{' '}
            <a href="/login" className="text-bn-primary hover:text-bn-primary-dark no-underline font-medium">
              Нэвтрэх
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
