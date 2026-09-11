import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdSlot from '@/components/AdSlot';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Plus } from 'lucide-react';
import { COUNTRIES, CATEGORIES, SEED_JOBS } from '@/lib/constants';

const client = createClient();

export default function Jobs() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadJobs();
  }, [categoryFilter, countryFilter, typeFilter]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const query: Record<string, any> = {};
      if (categoryFilter && categoryFilter !== 'all') query.category = categoryFilter;
      if (countryFilter && countryFilter !== 'all') query.country = countryFilter;
      if (typeFilter && typeFilter !== 'all') query.contract_type = typeFilter;

      const res = await client.entities.jobs.queryAll({ query, sort: '-created_at', limit: 50 });
      const realJobs = res?.data?.items || [];

      const MIN_JOBS_SHOWN = 6;
      const needed = Math.max(0, MIN_JOBS_SHOWN - realJobs.length);

      let seeds = SEED_JOBS.filter((j) => {
        if (categoryFilter && categoryFilter !== 'all' && j.category !== categoryFilter) return false;
        if (countryFilter && countryFilter !== 'all' && j.country !== countryFilter) return false;
        if (typeFilter && typeFilter !== 'all' && j.contract_type !== typeFilter) return false;
        return true;
      });

      const realTitles = new Set(realJobs.map((j: any) => j.title?.toLowerCase()));
      seeds = seeds.filter((s) => !realTitles.has(s.title.toLowerCase())).slice(0, needed);

      setJobs([...realJobs, ...seeds]);
    } catch {
      setJobs(SEED_JOBS);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) =>
    searchTerm === '' || job.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container pt-8">
          <AdSlot slot="jobs_top" />
        </div>
        {/* Page Header */}
        <section className="bg-gradient-to-br from-slate-50 to-emerald-50/30 border-b py-12">
          <div className="container">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl">Trabajos Disponibles</h1>
                <p className="text-muted-foreground mt-2">
                  Encuentra oportunidades agrícolas en {COUNTRIES.length} países
                </p>
              </div>
              <Button onClick={() => navigate('/jobs/new')} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Publicar Trabajo
              </Button>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white border-b py-5 sticky top-16 z-40 shadow-sm">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar trabajos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="reverse_auction">Subasta Inversa</SelectItem>
                  <SelectItem value="fixed_price">Precio Fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="py-8 bg-slate-50">
          <div className="container">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse bg-white">
                    <CardContent className="p-6">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">{filteredJobs.length} trabajos encontrados</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredJobs.map((job) => {
                    const country = COUNTRIES.find(c => c.name === job.country);
                    const isSeed = job.seed;
                    return (
                      <Link key={job.id} to={`/jobs/${job.id}`} className="cursor-pointer">
                        <Card className="hover:shadow-lg hover:border-emerald-200 transition-all h-full bg-white">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {country && <img src={country.flag} alt={country.name} className="h-4 w-auto rounded-sm" />}
                              {isSeed && <Badge variant="secondary" className="text-xs">Ejemplo</Badge>}
                              <Badge variant="outline" className="text-xs">{job.category}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {job.contract_type === 'reverse_auction' ? 'Subasta' : 'Fijo'}
                              </Badge>
                              <Badge className={`text-xs ml-auto ${job.status === 'open' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-amber-100 text-amber-800 hover:bg-amber-100'}`}>
                                {job.status === 'open' ? 'Abierto' : 'En Progreso'}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-base mb-2 line-clamp-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {job.title}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                            <div className="flex items-center justify-between pt-3 border-t">
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {job.location}
                              </span>
                              <div className="text-right">
                                <span className="font-bold text-emerald-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  ${job.budget_min?.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground"> - ${job.budget_max?.toLocaleString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif' }}>No se encontraron trabajos</h3>
                <p className="text-muted-foreground mt-2">Intenta ajustar los filtros o publica un nuevo trabajo</p>
                <Button onClick={() => navigate('/jobs/new')} className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 cursor-pointer">
                  Publicar Trabajo
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}