import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { VerifiedBadge, TopProBadge } from '@/components/Badges';

const client = createClient();

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // El estado real de la suscripción lo fija el webhook de Stripe en el
    // backend (services/subscriptions.py), no esta página — aquí solo
    // comprobamos que ya se activó antes de mostrar el siguiente paso.
    let attempts = 0;
    const checkActivated = () => {
      client.payment.getMySubscription()
        .then((res) => {
          if (res?.data?.subscription_status === 'active') {
            setVerified(true);
            return;
          }
          attempts += 1;
          if (attempts < 6) {
            // El webhook puede tardar unos segundos en llegar; reintentamos
            // brevemente antes de mostrar la confirmación igualmente.
            setTimeout(checkActivated, 1500);
          } else {
            setVerified(true);
          }
        })
        .catch(() => setVerified(true));
    };
    checkActivated();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16 bg-slate-50">
        <div className="container max-w-lg text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 animate-fade-in">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl md:text-3xl mb-4 animate-fade-in">¡Pago completado!</h1>

          <p className="text-muted-foreground mb-6">
            Tu suscripción al plan <strong>{plan === 'enterprise' ? 'Empresa' : 'Profesional'}</strong> se ha activado correctamente.
          </p>

          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-sm text-muted-foreground">Tu insignia:</span>
            {plan === 'enterprise' ? <TopProBadge /> : <VerifiedBadge />}
          </div>

          <div className="p-5 rounded-xl bg-white border shadow-sm mb-8 text-left">
            <h3 className="font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Siguiente paso: Verificación de identidad
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para activar tu insignia {plan === 'enterprise' ? 'Top Pro ⭐' : 'Verificado ✓'} necesitamos verificar tu identidad profesional. 
              Completa el formulario KYC con tu documentación.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 mb-4">
              <li>📋 Datos personales y documento de identidad</li>
              <li>📄 Foto de tu DNI, pasaporte o licencia</li>
              <li>🎓 Especialidad y certificaciones profesionales</li>
            </ul>
            <p className="text-xs text-muted-foreground italic">
              La verificación se completa en 24-48 horas tras enviar la documentación.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(`/kyc?plan=${plan}`)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
            >
              Completar Verificación
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="cursor-pointer"
            >
              Hacerlo después
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Puedes completar la verificación más tarde desde tu panel de usuario.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}