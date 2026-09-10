import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';

const client = createClient();

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    // El backend nos manda el token de sesión como query param tras el
    // login con Google (routers/auth.py:google_callback) — hay que
    // guardarlo antes de comprobar nada, o /auth/me siempre dará 401.
    const token = searchParams.get('token');
    if (token) {
      client.auth.setToken(token);
    }

    // Retry auth check a few times since session may take a moment to propagate
    let retries = 0;
    const maxRetries = 5;

    const checkAuth = () => {
      client.auth.me()
        .then((res) => {
          if (res?.data) {
            navigate('/dashboard', { replace: true });
          } else if (retries < maxRetries) {
            retries++;
            setTimeout(checkAuth, 800);
          } else {
            navigate('/', { replace: true });
          }
        })
        .catch(() => {
          if (retries < maxRetries) {
            retries++;
            setTimeout(checkAuth, 800);
          } else {
            navigate('/', { replace: true });
          }
        });
    };

    // Small initial delay to allow session to be established
    setTimeout(checkAuth, 500);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Verificando sesión...</p>
      </div>
    </div>
  );
}