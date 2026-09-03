import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Briefcase, Calendar, MessageSquare, ArrowLeft, Award } from 'lucide-react';
import { PlanBadge } from '@/components/Badges';
import { COUNTRIES, SEED_PROFESSIONALS } from '@/lib/constants';
import { toast } from 'sonner';

const client = createClient();

export default function ProProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    client.auth.me()
      .then((res) => { if (res?.data) setUser(res.data); })
      .catch(() => {});

    loadProfile();
    loadReviews();
  }, [id]);

  const loadProfile = async () => {
    // Check if it's a seed profile
    const seedPro = SEED_PROFESSIONALS.find(p => p.id === id);
    if (seedPro) {
      setPro(seedPro);
      setLoading(false);
      return;
    }

    try {
      const res = await client.entities.profiles.queryAll({ query: { id: Number(id) }, limit: 1 });
      if (res?.data?.items?.[0]) {
        setPro(res.data.items[0]);
      }
    } catch {
      // Not found
    }
    setLoading(false);
  };

  const loadReviews = async () => {
    try {
      const res = await client.entities.reviews?.queryAll?.({ query: { professional_id: id }, sort: '-created_at', limit: 20 });
      if (res?.data?.items) {
        setReviews(res.data.items);
      }
    } catch {
      // Reviews entity might not exist yet
    }
  };

  const handleContact = () => {
    if (!user) {
      client.auth.toLogin();
      return;
    }
    toast.success(`Solicitud de contacto enviada a ${pro?.display_name}. Te responderá pronto.`);
    navigate('/messages');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-slate-200 rounded-full" />
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-10 text-center">
          <h2>Profesional no encontrado</h2>
          <Button onClick={() => navigate('/pros')} className="mt-4 cursor-pointer">Volver</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const country = COUNTRIES.find(c => c.name === pro.country);
  const isTopPro = pro.plan === 'enterprise';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-slate-50">
        <div className="container max-w-4xl">
          <Button variant="ghost" onClick={() => navigate('/pros')} className="mb-6 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al directorio
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className={`lg:col-span-1 bg-white ${isTopPro ? 'border-amber-300 ring-1 ring-amber-200/50' : ''}`}>
              <CardContent className="p-6 text-center">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pro.display_name || 'U')}&backgroundColor=${isTopPro ? 'D97706' : '059669'}&textColor=ffffff&size=96`}
                  alt={pro.display_name}
                  className={`h-24 w-24 rounded-full mx-auto mb-4 ${isTopPro ? 'ring-3 ring-amber-400' : ''}`}
                />
                <h2 className="text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{pro.display_name}</h2>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-semibold">{pro.rating}</span>
                  <span className="text-sm text-muted-foreground">· {pro.jobs_completed} trabajos</span>
                </div>
                <div className="mt-3">
                  <PlanBadge plan={pro.plan} />
                </div>
                <div className="mt-4 space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {country && <img src={country.flag} alt={country.name} className="h-4 w-auto rounded-sm" />}
                    <span>{pro.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{pro.specialty}</span>
                  </div>
                  {pro.years_experience && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{pro.years_experience} años de experiencia</span>
                    </div>
                  )}
                  {pro.certifications && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>{pro.certifications}</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleContact}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contactar
                </Button>
              </CardContent>
            </Card>

            {/* Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Sobre mí</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {pro.description || 'Este profesional aún no ha completado su descripción.'}
                  </p>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Reseñas
                    </h3>
                    <Badge variant="outline">{reviews.length} reseñas</Badge>
                  </div>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-4 rounded-lg bg-slate-50 border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {review.created_at ? new Date(review.created_at).toLocaleDateString('es') : ''}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                          <p className="text-xs text-muted-foreground mt-1">— {review.reviewer_name || 'Cliente'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6">
                      Este profesional aún no tiene reseñas
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}