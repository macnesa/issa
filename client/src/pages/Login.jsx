import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitParentLogin } from '../store/actions/actionCreator';
import LoginForm from '../features/authentication/components/LoginForm';
import LoginIdentityZone from '../features/authentication/components/LoginIdentityZone';
import '../features/authentication/authentication.css';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginCredentials, setLoginCredentials] = useState({ NIM: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(() => (
    new URLSearchParams(location.search).get('session') === 'expired'
      ? 'Sesi Anda telah berakhir. Silakan masuk kembali.'
      : ''
  ));

  useEffect(() => {
    if (new URLSearchParams(location.search).get('session') === 'expired') {
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

  return (
      <main className="issa-login relative grid min-h-[100svh] place-items-center overflow-hidden px-4 py-8 sm:px-6 max-[767px]:items-start max-[767px]:px-[0.9rem] max-[767px]:pb-4 max-[767px]:pt-3">
      <div className="issa-login__frame relative z-10 grid w-[min(100%,68rem)] overflow-hidden">
        <LoginIdentityZone />
        <LoginForm
          error={error}
          isSubmitting={isSubmitting}
          onChange={handleLoginInputChange}
          onSubmit={handleLoginSubmit}
        />
      </div>
    </main>
  );
}
