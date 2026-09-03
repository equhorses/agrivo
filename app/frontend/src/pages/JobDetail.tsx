import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, Ruler, DollarSign, Send, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES } from '@/lib/constants';

const client = createClient();

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.auth.me()
      .then((res) => { if (res?.data) setUser(res.data); })
      .catch(() => {});

    if (id) {
      loadJob();
      loadBids();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      const res = await client.entities.jobs.queryAll({ query: { id: Number(id) }, limit: 1 });
      if (res?.data?.items?.[0]) {
        setJob(res.data.items[0]);
      }
    } catch {
      toast.error('Error al cargar el trabajo');
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async () => {
    try {
      const res = await client.entities.bids.queryAll({ query: { job_id: Number(id) }, sort: '-created_at' });
      if (res?.data?.items) {
        setBids(res.data.items);
      }
    } catch {
      // Failed to load bids
    }
  };

  const handleSubmitBid = async () => {
    if (!user) {
      client.auth.toLogin();
      return;
    }
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setSubmitting(true);
    try {
      await client.entities.bids.create({
        data: {
          job_id: Number(id),
          amount: Number(bidAmount),
          message: bidMessage,
          status: 'pending',
        },
      });
      toast.success('¡Oferta enviada exitosamente!');
      setBidAmount('');
      setBidMessage('');
      loadBids();
    } catch {
      toast.error('Error al enviar la oferta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-10 text-center">
          <h2>Trabajo no encontrado</h2>
          <Button onClick={() => navigate('/jobs')} className="mt-4 cursor-pointer">
            Volver a trabajos
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const country = COUNTRIES.find(c => c.name === job.country);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-slate-50">
        <div className="container">
          <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-6 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a trabajos
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Job Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {country && <img src={country.flag} alt={country.name} className="h-5 w-auto rounded-sm" />}
                    <Badge variant="outline">{job.category}</Badge>
                    <Badge variant="outline">
                      {job.contract_type === 'reverse_auction' ? 'Subasta Inversa' : 'Precio Fijo'}
                    </Badge>
                    <Badge className={`${job.status === 'open' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}`}>
                      {job.status === 'open' ? 'Abierto' : 'En Progreso'}
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl mb-6">{job.title}</h1>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ubicación</p>
                        <p className="text-sm font-medium">{job.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <Ruler className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Hectáreas</p>
                        <p className="text-sm font-medium">{job.hectares || 'N/A'} ha</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Presupuesto</p>
                        <p className="text-sm font-medium">${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Publicado</p>
                        <p className="text-sm font-medium">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString('es') : 'Reciente'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Descripción</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </CardContent>
              </Card>

              {/* Bids Section */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Ofertas recibidas
                    <Badge variant="secondary">{bids.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bids.length > 0 ? (
                    <div className="space-y-4">
                      {bids.map((bid) => (
                        <div key={bid.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-emerald-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm">Profesional</span>
                              <span className="font-bold text-emerald-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                ${bid.amount?.toLocaleString()} USD
                              </span>
                            </div>
                            {bid.message && (
                              <p className="text-sm text-muted-foreground mt-1">{bid.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {bid.created_at ? new Date(bid.created_at).toLocaleDateString('es') : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6">
                      Aún no hay ofertas. ¡Sé el primero en ofertar!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Submit Bid */}
            <div className="space-y-6">
              <Card className="sticky top-24 bg-white">
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'Poppins, sans-serif' }}>Enviar una oferta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.status === 'open' ? (
                    <>
                      <div>
                        <Label htmlFor="bid-amount">Tu oferta (USD)</Label>
                        <Input
                          id="bid-amount"
                          type="number"
                          placeholder="Ej: 3500"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Rango: ${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="bid-message">Mensaje (opcional)</Label>
                        <Textarea
                          id="bid-message"
                          placeholder="Describe tu experiencia y por qué eres el candidato ideal..."
                          value={bidMessage}
                          onChange={(e) => setBidMessage(e.target.value)}
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={handleSubmitBid}
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
                      >
                        {submitting ? 'Enviando...' : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Oferta
                          </>
                        )}
                      </Button>
                      {!user && (
                        <p className="text-xs text-center text-muted-foreground">
                          Debes iniciar sesión para enviar una oferta
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Este trabajo ya no acepta ofertas
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Resumen</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Categoría</span>
                      <span className="font-medium">{job.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="font-medium">
                        {job.contract_type === 'reverse_auction' ? 'Subasta Inversa' : 'Precio Fijo'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ofertas</span>
                      <span className="font-medium">{bids.length}</span>
                    </div>
                  </div>
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