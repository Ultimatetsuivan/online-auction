import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/design-system';
import { buildApiUrl } from '../../../config/api';

export const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTempPassword('');

    if (!identifier) {
      setError('Имэйл эсвэл утасны дугаараа оруулна уу');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(buildApiUrl('/api/users/forgot-password-temp'), {
        identifier: identifier.trim()
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setEmailSent(response.data.emailSent);

        // Show temp password if returned (development mode)
        if (response.data.tempPassword) {
          setTempPassword(response.data.tempPassword);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--bn-header-height))] flex items-center justify-center bg-bn-bg py-12 px-4">
      <div className="w-full max-w-md bg-bn-surface rounded-bn-2xl shadow-xl p-8 md:p-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-full mb-4">
            <i className="bi bi-lock text-bn-primary text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-bn-text">Нууц үг сэргээх</h2>
          <p className="text-bn-text-secondary text-sm mt-2">
            {tempPassword
              ? 'Түр нууц үгээ хуулж аваад нэвтэрч орно уу'
              : 'Имэйл эсвэл утасны дугаараа оруулна уу. Танд түр нууц үг илгээх болно.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-bn-danger rounded-bn-md px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-bn-success rounded-bn-md px-4 py-3 mb-4 text-sm">
            {success}
          </div>
        )}

        {!tempPassword ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="identifier" className="block text-sm font-semibold text-bn-text mb-1.5">
                Имэйл / Утас
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-bn-surface border border-bn-border rounded-bn-md text-bn-text placeholder:text-bn-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-bn-primary/30 focus:border-bn-primary transition-all text-lg"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="example@email.com эсвэл 99999999"
                required
              />
              <p className="text-bn-text-secondary text-xs mt-1.5">
                Бүртгэлтэй имэйл эсвэл утасны дугаараа оруулна уу
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="bn-spinner w-4 h-4 mr-2"></span>
                  Түр нууц үг үүсгэж байна...
                </>
              ) : (
                <>
                  <i className="bi bi-key mr-2"></i>
                  Түр нууц үг авах
                </>
              )}
            </Button>

            <div className="text-center mt-5">
              <span className="text-bn-text-secondary text-sm">Нууц үгээ санаж байна уу? </span>
              <Link to="/login" className="text-bn-primary font-semibold text-sm no-underline hover:text-bn-primary-dark">
                Нэвтрэх
              </Link>
            </div>
          </form>
        ) : (
          <div>
            {/* Temporary Password Display */}
            <div className="bg-green-50 border border-green-200 rounded-bn-xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <i className="bi bi-check-circle-fill text-bn-success text-xl"></i>
                <h5 className="font-bold text-bn-success">Түр нууц үг үүсгэгдлээ</h5>
              </div>

              <div className="bg-bn-surface border border-bn-border rounded-bn-lg p-4 mb-4">
                <span className="text-bn-text-secondary text-xs block mb-2">Түр нууц үг:</span>
                <div className="flex items-center justify-between">
                  <code className="text-2xl font-bold text-bn-primary tracking-widest font-mono">
                    {tempPassword}
                  </code>
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <i className={`bi bi-${copied ? 'check-lg' : 'clipboard'}`}></i>
                  </Button>
                </div>
              </div>

              {emailSent && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-bn-md px-4 py-2 mb-3 text-sm flex items-center gap-2">
                  <i className="bi bi-envelope-check"></i>
                  <span>Түр нууц үг таны имэйл хаяг руу мөн илгээгдлээ</span>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-bn-md px-4 py-2 mb-4 text-sm flex items-center gap-2">
                <i className="bi bi-clock"></i>
                <span><strong>Анхаар:</strong> Энэ нууц үг 24 цагийн турш хүчинтэй байна</span>
              </div>

              <div className="bg-bn-bg-secondary rounded-bn-lg p-4">
                <h6 className="text-bn-primary font-semibold mb-2 text-sm">
                  <i className="bi bi-list-ol mr-2"></i>Дараагийн алхамууд:
                </h6>
                <ol className="pl-4 text-sm text-bn-text-secondary space-y-1 list-decimal">
                  <li>Түр нууц үгээ хуулж авна уу</li>
                  <li>Нэвтрэх хуудас руу буцна уу</li>
                  <li>Түр нууц үгээр нэвтэрнэ үү</li>
                  <li>Шинэ нууц үг үүсгэнэ үү</li>
                </ol>
              </div>
            </div>

            <Link to="/login" className="no-underline block">
              <Button className="w-full" size="lg">
                <i className="bi bi-box-arrow-in-right mr-2"></i>
                Нэвтрэх хуудас руу очих
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
