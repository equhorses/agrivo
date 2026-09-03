import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Briefcase, Search, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanBadge } from '@/components/Badges';
import { COUNTRIES, CATEGORIES, SEED_PROFESSIONALS } from '@/lib/constants';
import { toast } from 'sonner';

const client = createClient();

export default function Professionals() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    client.auth.me()
      .then((res) => { if (res?.data) setUser(res.data); })
      .catch(() => {});
    loadProfessionals();
  }, [countryFilter, specialtyFilter]);

  const loadProfessionals = async () => {
    setLoading(true);
    try {
      const query: Record<string, any> = { role: 'professional' };
      if (countryFilter && countryFilter !== 'all') query.country = countryFilter;
      if (specialtyFilter && specialtyFilter !== 'all') query.specialty = specialtyFilter;

      const res = await client.entities.profiles.queryAll({ query, sort: '-rating', limit: 50 });
      const realPros = res?.data?.items || [];

      // Merge with seed professionals, filtering by current filters
      let seeds = SEED_PROFESSIONALS.filter((p) => {
        if (countryFilter && countryFilter !== 'all' && p.country !== countryFilter) return false;
        if (specialtyFilter && specialtyFilter !== 'all' && p.specialty !== specialtyFilter) return false;
        return true;
      });

      // Remove seeds that match real users by name
      const realNames = new Set(realPros.map((p: any) => p.display_name?.toLowerCase()));
      seeds = seeds.filter((s) => !realNames.has(s.display_name.toLowerCase()));

      // Sort: enterprise first, then pro, then free
      const planOrder: Record<string, number> = { enterprise: 0, pro: 1, free: 2 };
      const merged = [...realPros, ...seeds].sort((a, b) => {
        const pa = planOrder[a.plan || 'free'] ?? 2;
        const pb = planOrder[b.plan || 'free'] ?? 2;
        if (pa !== pb) return pa - pb;
        return (b.rating || 0) - (a.rating || 0);
      });

      setProfessionals(merged);
    } catch {
      setProfessionals(SEED_PROFESSIONALS);
    } finally {
      setLoading(false);
    }
  };

  const filteredPros = professionals.filter((pro) =>
    searchTerm === '' || pro.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gradient-to-br from-slate-50 to-emerald-50/30 border-b py-12">
          <div className="container">
            <h1 className="text-3xl md:text-4xl">Directorio de Profesionales</h1>
            <p className="text-muted-foreground mt-2">
              Encuentra expertos verificados en todas las áreas del agro
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white border-b py-5 sticky top-16 z-40 shadow-sm">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar profesionales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los países</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las especialidades</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Professionals Grid */}
        <section className="py-8 bg-slate-50">
          <div className="container">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse bg-white">
                    <CardContent className="p-6">
                      <div className="flex gap-3">
                        <div className="h-12 w-12 bg-slate-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPros.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">{filteredPros.length} profesionales encontrados</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPros.map((pro) => {
                    const country = COUNTRIES.find(c => c.name === pro.country);
                    const isTopPro = pro.plan === 'enterprise';
                    return (
                      <Card
                        key={pro.id}
                        className={`hover:shadow-lg transition-all bg-white ${
                          isTopPro ? 'border-amber-300 ring-1 ring-amber-200/50' : 'hover:border-emerald-200'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <img
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pro.display_name || 'U')}&backgroundColor=${isTopPro ? 'D97706' : '059669'}&textColor=ffffff`}
                              alt={pro.display_name}
                              className={`h-12 w-12 rounded-full shrink-0 ${isTopPro ? 'ring-2 ring-amber-400' : ''}`}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {pro.display_name}
                              </h4>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-sm font-medium">{pro.rating}</span>
                                <span className="text-xs text-muted-foreground">· {pro.jobs_completed} trabajos</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {country && <img src={country.flag} alt={country.name} className="h-3.5 w-auto rounded-sm" />}
                              <span>{pro.country}</span>
                              <span className="text-slate-300">·</span>
                              <Briefcase className="h-3 w-3" />
                              <span>{pro.specialty}</span>
                            </div>
                          </div>

                          {pro.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pro.description}</p>
                          )}

                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <PlanBadge plan={pro.plan} />
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-4 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                            onClick={() => handleContact(pro)}
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            Contactar
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif' }}>No se encontraron profesionales</h3>
                <p className="text-muted-foreground mt-2">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}