import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <div className="container max-w-4xl">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium mb-1">🍪 Usamos cookies</p>
            <p className="text-xs text-muted-foreground">
              Utilizamos cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestra{' '}
              <Link to="/legal/cookies" className="text-primary underline cursor-pointer">política de cookies</Link>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={decline} className="text-xs cursor-pointer">
              Rechazar
            </Button>
            <Button size="sm" onClick={accept} className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 cursor-pointer">
              Aceptar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}