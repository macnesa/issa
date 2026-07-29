import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  submitParentDemoLogin,
  submitParentLogin,
} from '../store/actions/actionCreator';
import LoginForm from '../features/authentication/components/LoginForm';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginCredentials, setLoginCredentials] = useState({ NIM: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [error, setError] = useState(() => (
    new URLSearchParams(location.search).get('session') === 'demo-expired'
      ? 'Sesi demo telah berakhir. Buka kembali demo untuk melanjutkan.'
      : new URLSearchParams(location.search).get('session') === 'expired'
        ? 'Sesi Anda telah berakhir. Silakan masuk kembali.'
        : ''
  ));

  useEffect(() => {
    const sessionReason = new URLSearchParams(location.search).get('session');
    if (sessionReason === 'demo-expired') {
      setError('Sesi demo telah berakhir. Buka kembali demo untuk melanjutkan.');
    } else if (sessionReason === 'expired') {
      setError('Sesi Anda telah berakhir. Silakan masuk kembali.');
    }
  }, [location.search]);

  function handleLoginInputChange(event) {
    const { name, value } = event.target;
    setLoginCredentials({ ...loginCredentials, [name]: value });
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    dispatch(submitParentLogin(loginCredentials))
      .then(() => navigate('/'))
      .catch((loginError) => setError(loginError?.message || 'Tidak dapat masuk. Silakan coba lagi.'))
      .finally(() => setIsSubmitting(false));
  }

  function handleDemoLogin() {
    if (isDemoSubmitting) return;

    setIsDemoSubmitting(true);
    setError('');
    dispatch(submitParentDemoLogin())
      .then(() => navigate('/'))
      .catch((loginError) => setError(loginError?.message || 'Demo Parent belum dapat dibuka.'))
      .finally(() => setIsDemoSubmitting(false));
  }

  return (
    <LoginForm
      error={error}
      isSubmitting={isSubmitting}
      isDemoSubmitting={isDemoSubmitting}
      onChange={handleLoginInputChange}
      onDemoLogin={handleDemoLogin}
      onSubmit={handleLoginSubmit}
    />
  );
}
