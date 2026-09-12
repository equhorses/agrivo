import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES, CATEGORIES } from '@/lib/constants';
import { getBackendErrorMessage } from '@/lib/errors';

const client = createClient();

export default function CreateJob() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    country: '',
    location: '',
    hectares: '',
    budget_min: '',
    budget_max: '',
    contract_type: 'reverse_auction',
    bidding_ends_at: '',
  });
  const [noDeadline, setNoDeadline] = useState(true);

  useEffect(() => {
    client.auth.me()
      .then(async (res) => {
        if (!res?.data) {
          client.auth.toLogin();
          return;
        }
        setUser(res.data);
        // PRUEBA: para publicar hace falta tener el perfil completado
        // primero (a modo de VentaCofrade). De momento reutilizamos el
        // formulario de KYC/perfil profesional que ya existe como paso de
        // "completar información" — habrá que valorar si conviene un
        // formulario más ligero y genérico para quien solo publica trabajos
        // y no ofrece servicios.
        try {
          const profRes = await client.entities.profiles.queryMine({ limit: 1 });
          setHasProfile((profRes?.data?.items?.length || 0) > 0);
        } catch {
          setHasProfile(false);
        } finally {
          setCheckingProfile(false);
        }
      })
      .catch(() => {
        client.auth.toLogin();
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.country || !form.budget_max) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    if (!noDeadline && !form.bidding_ends_at) {
      toast.error('Indica una fecha límite o marca "Sin fecha límite"');
      return;
    }
    setSubmitting(true);
    try {
      await client.entities.jobs.create({
        data: {
          title: form.title,
          description: form.description,
          category: form.category,
          country: form.country,
          location: form.location,
          hectares: form.hectares ? Number(form.hectares) : null,
          budget_min: form.budget_min ? Number(form.budget_min) : null,
          budget_max: Number(form.budget_max),
          contract_type: form.contract_type,
          status: 'open',
          bidding_ends_at: noDeadline || !form.bidding_ends_at
            ? null
            : new Date(form.bidding_ends_at).toISOString(),
        },
      });
      toast.success('¡Trabajo publicado exitosamente!');
      navigate('/jobs');
    } catch (err: any) {
      toast.error(getBackendErrorMessage(err, 'Error al publicar el trabajo'));
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 bg-slate-50" />
        <Footer />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 bg-slate-50">
          <div className="container max-w-2xl">
            <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-6 cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a trabajos
            </Button>
            <Card className="bg-white">
              <CardContent className="p-10 text-center">
                <h3 className="text-xl mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Completa tu perfil antes de publicar
                </h3>
                <p className="text-muted-foreground mb-6">
                  Para publicar un trabajo necesitamos algunos datos tuyos primero — así los profesionales
                  saben con quién van a trabajar, y nosotros podemos verificar tu cuenta.
                </p>
                <Button
                  onClick={() => navigate('/kyc')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
                >
                  Completar mi perfil
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-slate-50">
        <div className="container max-w-2xl">
          <Button variant="ghost" onClick={() => navigate('/jobs')} className="mb-6 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a trabajos
          </Button>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>Publicar nuevo trabajo</CardTitle>
              <p className="text-muted-foreground">
                Describe tu necesidad y recibe ofertas de profesionales verificados
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="title">Título del trabajo *</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Fumigación aérea para 500 hectáreas de soja"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe los detalles del trabajo, requisitos específicos, plazos..."
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="mt-1"
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Categoría *</Label>
                    <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo de contratación</Label>
                    <Select value={form.contract_type} onValueChange={(v) => updateField('contract_type', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reverse_auction">Subasta Inversa</SelectItem>
                        <SelectItem value="fixed_price">Precio Fijo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>País *</Label>
                    <Select value={form.country} onValueChange={(v) => updateField('country', v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      placeholder="Ej: Córdoba, Argentina"
                      value={form.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Fecha límite para recibir ofertas</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="no-deadline"
                      checked={noDeadline}
                      onCheckedChange={(checked) => setNoDeadline(checked === true)}
                    />
                    <Label htmlFor="no-deadline" className="font-normal cursor-pointer">
                      Sin fecha límite (queda abierto hasta que lo cierres tú)
                    </Label>
                  </div>
                  {!noDeadline && (
                    <Input
                      id="bidding_ends_at"
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      value={form.bidding_ends_at}
                      onChange={(e) => updateField('bidding_ends_at', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hectares">Hectáreas</Label>
                    <Input
                      id="hectares"
                      type="number"
                      placeholder="500"
                      value={form.hectares}
                      onChange={(e) => updateField('hectares', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget_min">Presupuesto mín. (USD, opcional)</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      placeholder="2000"
                      value={form.budget_min}
                      onChange={(e) => updateField('budget_min', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget_max">Presupuesto máx. (USD) *</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      placeholder="5000"
                      value={form.budget_max}
                      onChange={(e) => updateField('budget_max', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
                >
                  {submitting ? 'Publicando...' : 'Publicar Trabajo'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}