import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Rocket, Loader2 } from 'lucide-react';
import { VerifiedBadge, TopProBadge } from '@/components/Badges';
import { toast } from 'sonner';
import { PLANS } from '@/lib/constants';

const client = createClient();

const PLAN_ICONS: Record<string, any> = {
  free: Zap,
  pro: Crown,
  enterprise: Rocket,
};

interface SubscriptionState {
  subscription_status: string | null;
  plan: string | null;
  cancel_at_period_end: boolean | null;
  subscription_end_date: string | null;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSubscription = async () => {
    try {
      const { data } = await client.payment.getMySubscription();
      setSubscription(data);
    } catch {
      // Not logged in or request failed — treat as free/no subscription.
    }
  };

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (res?.data) {
          setUser(res.data);
          loadSubscription();
        }
      })
      .catch(() => {});
  }, []);

  const currentPlan = subscription?.plan || 'free';
  const isActive = subscription?.subscription_status === 'active';

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      client.auth.toLogin();
      return;
    }
    if (planId === 'free') {
      toast.info('Ya tienes el plan básico activo');
      return;
    }
    if (planId === currentPlan && isActive) {
      toast.info('Ya estás suscrito a este plan');
      return;
    }

    setLoadingPlan(planId);
    try {
      if (isActive) {
        // Ya tiene una suscripción de pago activa: cambiamos el plan
        // existente (Stripe prorratea automáticamente), sin crear un
        // checkout ni una suscripción duplicada.
        const { data } = await client.payment.changePlan(planId as 'pro' | 'enterprise');
        setSubscription(data as SubscriptionState);
        toast.success('Plan actualizado. El ajuste de precio se prorratea automáticamente.');
      } else {
        const { data } = await client.payment.createSubscriptionCheckout(planId as 'pro' | 'enterprise');
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Error al procesar el pago. Intenta de nuevo.';
      toast.error(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const { data } = await client.payment.cancelSubscription();
      setSubscription(data as SubscriptionState);
      toast.success('Suscripción cancelada. Mantendrás el acceso hasta el final del período ya pagado.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'No se pudo cancelar la suscripción.';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      const { data } = await client.payment.resumeSubscription();
      setSubscription(data as SubscriptionState);
      toast.success('Suscripción reactivada.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'No se pudo reactivar la suscripción.';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gradient-to-br from-slate-50 to-emerald-50/30 border-b py-16">
          <div className="container text-center">
            <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-200 bg-emerald-50">
              Planes y Precios
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl">
              Elige el plan perfecto para tu negocio
            </h1>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto text-lg">
              Desde agricultores independientes hasta profesionales top
            </p>
          </div>
        </section>

        {/* Badge Preview */}
        <section className="py-8 bg-white border-b">
          <div className="container">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Plan Profesional:</span>
                <VerifiedBadge />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Plan Empresa:</span>
                <TopProBadge />
              </div>
            </div>
          </div>
        </section>

        {/* Subscription status */}
        {user && subscription && (subscription.plan && subscription.plan !== 'free') && (
          <section className="py-6 bg-white border-b">
            <div className="container max-w-3xl">
              <div className="p-5 rounded-xl border bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tu suscripción</p>
                  <p className="font-semibold">
                    Plan {subscription.plan === 'enterprise' ? 'Empresa' : 'Profesional'} —{' '}
                    {isActive ? (subscription.cancel_at_period_end ? 'se cancela al final del período' : 'activa') : 'inactiva'}
                    {subscription.subscription_end_date && (
                      <span className="text-muted-foreground font-normal">
                        {' '}({new Date(subscription.subscription_end_date).toLocaleDateString('es-ES')})
                      </span>
                    )}
                  </p>
                </div>
                {isActive && (
                  subscription.cancel_at_period_end ? (
                    <Button variant="outline" size="sm" disabled={actionLoading} onClick={handleResume} className="cursor-pointer">
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Reactivar suscripción
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled={actionLoading} onClick={handleCancel} className="cursor-pointer">
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Cancelar suscripción
                    </Button>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* Pricing Cards */}
        <section className="py-16 bg-slate-50">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id] || Zap;
                const isCurrent = plan.id === currentPlan && (plan.id === 'free' ? true : isActive);
                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all hover:shadow-xl ${
                      plan.popular ? 'border-emerald-500 shadow-lg ring-1 ring-emerald-500/20 scale-[1.02]' : 'border-slate-200'
                    } ${isCurrent ? 'ring-2 ring-emerald-400' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    )}
                    <CardHeader className="text-center pb-4 pt-8">
                      {plan.popular && (
                        <Badge className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          Más Popular
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge className="absolute top-4 left-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Tu Plan
                        </Badge>
                      )}
                      <div className={`h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                        plan.popular
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200'
                          : plan.id === 'enterprise'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      <div className="mt-5">
                        <span className="text-4xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {plan.price === 0 ? 'Gratis' : `€${plan.price}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground text-sm">{plan.period}</span>
                        )}
                      </div>
                      {/* Show badge preview */}
                      <div className="mt-3">
                        {plan.id === 'pro' && <VerifiedBadge />}
                        {plan.id === 'enterprise' && <TopProBadge />}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pb-8">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              plan.id === 'enterprise'
                                ? 'bg-amber-100 text-amber-700'
                                : plan.popular
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              <Check className="h-3 w-3" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loadingPlan === plan.id || isCurrent}
                        className={`w-full cursor-pointer ${
                          plan.popular
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md'
                            : plan.id === 'enterprise'
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                              : ''
                        }`}
                        variant={plan.popular || plan.id === 'enterprise' ? 'default' : 'outline'}
                      >
                        {isCurrent
                          ? 'Plan Actual'
                          : loadingPlan === plan.id
                            ? 'Procesando...'
                            : isActive && plan.price > 0
                              ? 'Cambiar a este plan'
                              : plan.cta}
                      </Button>
                      {plan.price > 0 && isActive && currentPlan !== plan.id && (
                        <p className="text-xs text-center text-muted-foreground">
                          * Se aplica prorrateo por los días restantes del ciclo actual
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Proration Info */}
        <section className="py-8 bg-white border-t">
          <div className="container max-w-3xl">
            <div className="p-5 rounded-xl border bg-emerald-50/50 border-emerald-200">
              <h4 className="font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>💡 Sobre cambios de plan</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Si cambias de plan, solo pagarás la diferencia proporcional a los días restantes de tu ciclo actual (prorrateo). 
                Por ejemplo, si llevas 15 días con el plan Profesional (€19/mes) y subes a Empresa (€29/mes), 
                solo pagarás €5 por los 15 días restantes.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-slate-50 border-t">
          <div className="container max-w-3xl">
            <h2 className="text-center mb-10">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {[
                { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí, puedes actualizar o degradar tu plan cuando quieras. Al subir de plan, se aplica prorrateo automático: solo pagas la diferencia por los días restantes del ciclo.' },
                { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express) a través de Stripe.' },
                { q: '¿Qué incluye la insignia Verificado?', a: 'La insignia Verificado (plan Profesional) confirma que has completado el proceso KYC y tus credenciales han sido validadas. Aparece junto a tu nombre en todo el marketplace.' },
                { q: '¿Qué ventajas tiene ser Top Pro?', a: 'Los Top Pro (plan Empresa) aparecen destacados en la portada, tienen una insignia dorada exclusiva, mayor visibilidad en búsquedas y acceso a analíticas avanzadas.' },
                { q: '¿Puedo cancelar mi suscripción?', a: 'Puedes cancelar en cualquier momento sin penalización. Tu plan seguirá activo hasta el final del período pagado.' },
              ].map((faq, i) => (
                <div key={i} className="p-5 rounded-xl border bg-white">
                  <h4 className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>{faq.q}</h4>
                  <p className="text-muted-foreground mt-2 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}