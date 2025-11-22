import { useState, useEffect } from 'react';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../components/common/Toast';
import { buildApiUrl } from '../../../config/api';
import { useTheme } from '../../../context/ThemeContext';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
        console.log('Google script loaded');
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
        console.log('Google Client ID loaded:', response.data.clientId);
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
        submit: error.response?.data?.message || 'Google нэвтрэлт амжилтгүй боллоо'
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
    const { name, email, phone, password, confirmPassword } = formData;

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
        setErrors({ submit: error.response?.data?.message || 'Код илгээхэд алдаа гарлаа' });
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
        email: registeredEmail, // Use the normalized email
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
      const errorMessage = error.response?.data?.message || 'Баталгаажуулах код буруу байна';
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
      const errorMessage = error.response?.data?.message || 'Код дахин илгээхэд алдаа гарлаа';
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    }
  };

  if (registrationStep === 2) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Имэйл баталгаажуулалт</h2>

                {errors.submit && (
                  <div className="alert alert-danger">{errors.submit}</div>
                )}

                <p className="text-center">
                  Бид <strong>{registeredEmail}</strong> хаяг руу 6 оронтой баталгаажуулах код илгээлээ.
                </p>

                <form onSubmit={handleVerificationSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Баталгаажуулах код</label>
                    <input
                      type="text"
                      className="form-control"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      maxLength="6"
                      autoFocus
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">
                        {(eula?.titleMn || eula?.title || 'EULA')} {eula?.version ? `(v${eula.version})` : ''}
                      </span>
                      <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setShowEulaContent((prev) => !prev)}
                        disabled={!eula}
                      >
                        {showEulaContent ? 'D`���+D��.' : 'D���?D��.'}
                      </button>
                    </div>
                    {showEulaContent && eula && (
                      <div
                        className="border rounded bg-light p-3 small mt-2"
                        style={{ maxHeight: '200px', overflowY: 'auto' }}
                        dangerouslySetInnerHTML={{
                          __html: eula.contentMn || eula.content || ''
                        }}
                      />
                    )}
                    {!eula && (
                      <div className="text-muted small mt-2">EULA ачааллаж байна...</div>
                    )}
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="acceptEula"
                      checked={hasAcceptedEula}
                      onChange={(event) => {
                        setHasAcceptedEula(event.target.checked);
                        setErrors(prev => ({ ...prev, acceptEula: null }));
                      }}
                    />
                    <label className="form-check-label" htmlFor="acceptEula">
                      Үйлчилгээний нөхцөл болон EULA-г зөвшөөрч байна.
                    </label>
                    {errors.acceptEula && (
                      <div className="text-danger small mt-1">{errors.acceptEula}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting || verificationCode.length < 6}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Баталгаажуулж байна...
                      </>
                    ) : 'Баталгаажуулах'}
                  </button>
                </form>

                <div className="mt-3 text-center">
                  <button
                    onClick={resendVerificationCode}
                    className="btn btn-link p-0"
                  >
                    Код дахин илгээх
                  </button>
                  <div className="mt-2">
                    <button
                      onClick={() => setRegistrationStep(1)}
                      className="btn btn-link p-0 text-muted"
                    >
                      Буцах
                    </button>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-light rounded">
                  <small className="text-muted">
                    <strong>Анхаар:</strong> Имэйл ирсэнгүй юу? Spam хавтас шалгана уу. Код 10 минутын дараа хүчингүй болно.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Бүртгэл үүсгэх</h2>

              {errors.submit && (
                <div className="alert alert-danger">{errors.submit}</div>
              )}

              {/* Google Sign-In Section */}
              <div className="mb-4">
                <div className="text-center mb-3">
                  <div id="googleSignInButton" className="d-inline-block"></div>
                  {isGoogleLoading && (
                    <div className="mt-2">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Google-ээр нэвтэрч байна...
                    </div>
                  )}
                </div>
                <div className="d-flex align-items-center mb-3">
                  <hr className="flex-grow-1" />
                  <span className="mx-3">Эсвэл</span>
                  <hr className="flex-grow-1" />
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Нэр</label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Имэйл</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">Утасны дугаар</label>
                  <input
                    type="text"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="99123456"
                    maxLength="8"
                    required
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  <div className="form-text">8 оронтой утасны дугаар (жишээ: 99123456)</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Нууц үг</label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Нууц үг (дахин)</label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">{errors.confirmPassword}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Баталгаажуулах код илгээж байна...
                    </>
                  ) : 'Бүртгэл үүсгэх'}
                </button>
              </form>

              <div className="mt-3 text-center">
                <p>Бүртгэлтэй юу? <a href="/login">Нэвтрэх</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
