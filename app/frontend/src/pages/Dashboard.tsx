import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Briefcase, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';

const client = createClient();

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (!res?.data) {
          client.auth.toLogin();
        } else {
          setUser(res.data);
          loadData();
        }
      })
      .catch(() => {
        client.auth.toLogin();
      });
  }, []);

  const loadData = async () => {
    try {
      const [jobsRes, bidsRes] = await Promise.all([
        client.entities.jobs.queryMine({ sort: '-created_at', limit: 20 }),
        client.entities.bids.queryMine({ sort: '-created_at', limit: 20 }),
      ]);
      if (jobsRes?.data?.items) setMyJobs(jobsRes.data.items);
      if (bidsRes?.data?.items) setMyBids(bidsRes.data.items);
    } catch {
      // Failed to load data
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-slate-50">
        <div className="container">
          {/* Welcome */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl">¡Hola, {user.nickname || user.email?.split('@')[0]}!</h1>
              <p className="text-muted-foreground mt-1">Gestiona tus trabajos y ofertas desde aquí</p>
            </div>
            <Button onClick={() => navigate('/jobs/new')} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Publicar Trabajo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{myJobs.length}</p>
                  <p className="text-xs text-muted-foreground">Mis Trabajos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{myBids.length}</p>
                  <p className="text-xs text-muted-foreground">Mis Ofertas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-teal-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {myJobs.filter(j => j.status === 'open').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Activos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>0</p>
                  <p className="text-xs text-muted-foreground">Mensajes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="jobs" className="space-y-4">
            <TabsList className="bg-white">
              <TabsTrigger value="jobs" className="cursor-pointer">Mis Trabajos</TabsTrigger>
              <TabsTrigger value="bids" className="cursor-pointer">Mis Ofertas</TabsTrigger>
            </TabsList>

            <TabsContent value="jobs">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse bg-white">
                      <CardContent className="p-5">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : myJobs.length > 0 ? (
                <div className="space-y-3">
                  {myJobs.map((job) => (
                    <Card
                      key={job.id}
                      className="hover:border-emerald-200 transition-all cursor-pointer bg-white"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>{job.title}</h4>
                              <Badge className={`text-xs ${job.status === 'open' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}`}>
                                {job.status === 'open' ? 'Abierto' : 'En Progreso'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {job.category} · {job.location} · ${job.budget_min?.toLocaleString()} - ${job.budget_max?.toLocaleString()} USD
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground shrink-0">
                            {job.created_at ? new Date(job.created_at).toLocaleDateString('es') : ''}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white">
                  <CardContent className="p-10 text-center">
                    <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 style={{ fontFamily: 'Poppins, sans-serif' }}>No tienes trabajos publicados</h3>
                    <p className="text-muted-foreground mt-2">Publica tu primer trabajo y recibe ofertas de profesionales</p>
                    <Button onClick={() => navigate('/jobs/new')} className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 cursor-pointer">
                      Publicar Trabajo
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bids">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse bg-white">
                      <CardContent className="p-5">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : myBids.length > 0 ? (
                <div className="space-y-3">
                  {myBids.map((bid) => (
                    <Card key={bid.id} className="hover:border-emerald-200 transition-all cursor-pointer bg-white">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Oferta #{bid.id}</h4>
                              <Badge variant="outline" className="text-xs">
                                {bid.status === 'pending' ? 'Pendiente' : bid.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Monto: ${bid.amount?.toLocaleString()} USD
                              {bid.message && ` · "${bid.message.substring(0, 50)}..."`}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground shrink-0">
                            {bid.created_at ? new Date(bid.created_at).toLocaleDateString('es') : ''}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white">
                  <CardContent className="p-10 text-center">
                    <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 style={{ fontFamily: 'Poppins, sans-serif' }}>No tienes ofertas enviadas</h3>
                    <p className="text-muted-foreground mt-2">Explora trabajos disponibles y envía tu primera oferta</p>
                    <Button onClick={() => navigate('/jobs')} className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 cursor-pointer">
                      Explorar Trabajos
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}