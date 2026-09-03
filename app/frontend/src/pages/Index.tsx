import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, ArrowRight, Shield, Globe, Zap, MessageSquare } from 'lucide-react';
import { PlanBadge } from '@/components/Badges';
import { BRAND, COUNTRIES, CATEGORIES, SEED_PROFESSIONALS, SEED_JOBS } from '@/lib/constants';
import { toast } from 'sonner';

const client = createClient();

const HERO_IMAGE = 'https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-07/r7upacycaiya/hero-drone-agriculture.png';

function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [value, visible]);

  return (
    <div className="text-center p-4">
      <div className="text-3xl md:text-4xl font-bold text-emerald-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function Index() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    client.auth.me()
      .then((res) => { if (res?.data) setUser(res.data); })
      .catch(() => {});

    // Load real jobs, fallback to seeds
    client.entities.jobs.queryAll({ limit: 6, sort: '-created_at' })
      .then((res) => {
        const realJobs = res?.data?.items || [];
        if (realJobs.length >= 6) {
          setJobs(realJobs.slice(0, 6));
        } else {
          // Fill with seeds
          const needed = 6 - realJobs.length;
          setJobs([...realJobs, ...SEED_JOBS.slice(0, needed)]);
        }
      })
      .catch(() => setJobs(SEED_JOBS.slice(0, 6)));

    // Load real professionals, fallback to seeds
    client.entities.profiles.queryAll({ query: { role: 'professional' }, limit: 6, sort: '-rating' })
      .then((res) => {
        const realPros = res?.data?.items || [];
        if (realPros.length >= 6) {
          setProfessionals(realPros.slice(0, 6));
        } else {
          const needed = 6 - realPros.length;
          // Show enterprise/top pros first from seeds
          const sortedSeeds = [...SEED_PROFESSIONALS].sort((a, b) => {
            const order: Record<string, number> = { enterprise: 0, pro: 1, free: 2 };
            return (order[a.plan] || 2) - (order[b.plan] || 2);
          });
          setProfessionals([...realPros, ...sortedSeeds.slice(0, needed)]);
        }
      })
      .catch(() => setProfessionals(SEED_PROFESSIONALS.slice(0, 6)));
  }, []);

  const handleContact = (pro: any) => {
    if (!user) {
      client.auth.toLogin();
      return;
    }
    toast.success(`Solicitud de contacto enviada a ${pro.display_name}. Te responderá pronto.`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Dron agrícola sobrevolando campos"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
        </div>
        <div className="relative container py-20 md:py-28">
          <div className="max-w-2xl space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-200 font-medium">
                Marketplace Global de Servicios Agrícolas
              </span>
            </div>
            <h1 className="text-white leading-[1.1]">
              Conecta con los mejores{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                profesionales del campo
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-xl leading-relaxed">
              Publica tu trabajo, recibe ofertas competitivas y contrata al profesional ideal. Operamos en {COUNTRIES.length} países.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate('/jobs/new')}
                className="text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                Publicar Trabajo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/pros')}
                className="text-base border-white/20 text-white hover:bg-white/10 backdrop-blur-sm cursor-pointer"
              >
                Explorar Profesionales
              </Button>
            </div>
            {/* Country flags */}
            <div className="flex items-center gap-3 pt-4">
              <span className="text-xs text-slate-400">Operamos en:</span>
              <div className="flex items-center gap-1.5">
                {COUNTRIES.map((c) => (
                  <img key={c.code} src={c.flag} alt={c.name} className="h-5 w-auto rounded-sm opacity-80 hover:opacity-100 transition-opacity" title={c.name} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <AnimatedStat value={5000} label="Profesionales activos" suffix="+" />
            <AnimatedStat value={2800} label="Trabajos completados" />
            <AnimatedStat value={10} label="Países operativos" />
            <AnimatedStat value={98} label="Satisfacción" suffix="%" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3 text-emerald-700 border-emerald-200 bg-emerald-50">
              Simple y Efectivo
            </Badge>
            <h2>¿Cómo funciona {BRAND.name}?</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Tres simples pasos para conectar con el profesional perfecto
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: Globe, title: 'Publica tu trabajo', desc: 'Describe lo que necesitas, establece tu presupuesto y selecciona la categoría de servicio.' },
              { step: '2', icon: Shield, title: 'Recibe ofertas verificadas', desc: 'Profesionales con KYC verificado envían sus propuestas competitivas con precio y plazo.' },
              { step: '3', icon: Zap, title: 'Contrata y paga seguro', desc: 'Elige al mejor, comunícate directamente y paga de forma segura a través de la plataforma.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative p-8 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all group">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.desc}</p>
                  <span className="absolute top-6 right-6 text-4xl font-bold text-slate-100 group-hover:text-emerald-50 transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {item.step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="outline" className="mb-3 text-emerald-700 border-emerald-200 bg-emerald-50">
                Servicios
              </Badge>
              <h2>Categorías de servicios</h2>
              <p className="text-muted-foreground mt-2">Encuentra profesionales especializados en cada área</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/jobs')} className="hidden md:flex cursor-pointer text-emerald-700">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/jobs?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-md transition-all cursor-pointer"
              >
                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-sm font-medium text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="outline" className="mb-3 text-emerald-700 border-emerald-200 bg-emerald-50">
                Oportunidades
              </Badge>
              <h2>Últimos trabajos publicados</h2>
              <p className="text-muted-foreground mt-2">Oportunidades recientes para profesionales del campo</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/jobs')} className="hidden md:flex cursor-pointer text-emerald-700">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => {
              const country = COUNTRIES.find(c => c.name === job.country);
              const isSeed = job.seed;
              return (
                <Link key={job.id} to={isSeed ? '/jobs' : `/jobs/${job.id}`} className="cursor-pointer">
                  <Card className="hover:shadow-lg hover:border-emerald-200 transition-all h-full bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        {country && <img src={country.flag} alt={country.name} className="h-4 w-auto rounded-sm" />}
                        <Badge variant="outline" className="text-xs">
                          {job.category}
                        </Badge>
                        <Badge className={`text-xs ml-auto ${job.status === 'open' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}`}>
                          {job.status === 'open' ? 'Abierto' : 'En Progreso'}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-base mb-2 line-clamp-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{job.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        <span className="font-bold text-emerald-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          ${job.budget_min?.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="outline" className="mb-3 text-emerald-700 border-emerald-200 bg-emerald-50">
                Expertos
              </Badge>
              <h2>Profesionales destacados</h2>
              <p className="text-muted-foreground mt-2">Los expertos mejor valorados de la plataforma</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/pros')} className="hidden md:flex cursor-pointer text-emerald-700">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {professionals.map((pro) => {
              const country = COUNTRIES.find(c => c.name === pro.country);
              const isTopPro = pro.plan === 'enterprise';
              return (
                <Card
                  key={pro.id}
                  className={`hover:shadow-lg transition-all ${
                    isTopPro ? 'border-amber-300 ring-1 ring-amber-200/50' : 'hover:border-emerald-200'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pro.display_name || 'U')}&backgroundColor=${isTopPro ? 'D97706' : '059669'}&textColor=ffffff`}
                        alt={pro.display_name}
                        className={`h-12 w-12 rounded-full ${isTopPro ? 'ring-2 ring-amber-400' : ''}`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>{pro.display_name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-medium">{pro.rating}</span>
                          <span className="text-xs text-muted-foreground">· {pro.jobs_completed} trabajos</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      {country && <img src={country.flag} alt={country.name} className="h-3.5 w-auto rounded-sm" />}
                      <span>{pro.country}</span>
                      <span className="text-slate-300">·</span>
                      <span>{pro.specialty}</span>
                    </div>
                    {pro.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pro.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <PlanBadge plan={pro.plan} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                      onClick={(e) => { e.preventDefault(); handleContact(pro); }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Contactar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="container text-center relative">
          <h2 className="text-white">¿Listo para transformar tu campo?</h2>
          <p className="mt-4 text-emerald-100 max-w-lg mx-auto text-lg">
            Únete a miles de agricultores y profesionales que ya están revolucionando el agro en {COUNTRIES.length} países.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button
              size="lg"
              onClick={() => navigate('/jobs/new')}
              className="text-base bg-white text-emerald-800 hover:bg-slate-100 shadow-lg cursor-pointer"
            >
              Publicar un Trabajo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/pros')}
              className="text-base border-white/30 text-white hover:bg-white/10 cursor-pointer"
            >
              Soy Profesional
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <CookieConsent />
    </div>
  );
}