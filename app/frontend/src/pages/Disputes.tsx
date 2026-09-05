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
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const client = createClient();

export default function Disputes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    job_title: '',
    reason: '',
    description: '',
    amount_disputed: '',
  });

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (!res?.data) {
          client.auth.toLogin();
        } else {
          setUser(res.data);
          loadDisputes();
        }
      })
      .catch(() => client.auth.toLogin());
  }, []);

  const loadDisputes = async () => {
    try {
      const res = await client.entities.disputes?.queryMine?.({ sort: '-created_at', limit: 20 });
      if (res?.data?.items) {
        setDisputes(res.data.items);
      }
    } catch {
      // Disputes entity might not exist
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.job_title || !form.reason || !form.description) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      await client.entities.disputes?.create?.({
        data: {
          job_title: form.job_title,
          reason: form.reason,
          description: form.description,
          amount_disputed: form.amount_disputed ? Number(form.amount_disputed) : 0,
          status: 'open',
        },
      });
      toast.success('Disputa creada. Nuestro equipo la revisará en 24-48h.');
      setShowForm(false);
      setForm({ job_title: '', reason: '', description: '', amount_disputed: '' });
      loadDisputes();
    } catch {
      toast.error('Error al crear la disputa');
    }
    setSubmitting(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'En revisión';
      case 'resolved': return 'Resuelta';
      case 'rejected': return 'Rechazada';
      default: return 'Pendiente';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-slate-50">
        <div className="container max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl">Centro de Disputas</h1>
              <p className="text-muted-foreground mt-1">Resuelve conflictos de forma justa y transparente</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-emerald-600 to-teal-600 cursor-pointer">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Nueva Disputa
            </Button>
          </div>

          {/* New Dispute Form */}
          {showForm && (
            <Card className="bg-white mb-6">
              <CardHeader>
                <CardTitle className="text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>Abrir nueva disputa</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Trabajo relacionado *</Label>
                    <Input
                      placeholder="Nombre del trabajo en disputa"
                      value={form.job_title}
                      onChange={(e) => setForm(prev => ({ ...prev, job_title: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Motivo de la disputa *</Label>
                    <Select value={form.reason} onValueChange={(v) => setForm(prev => ({ ...prev, reason: v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quality">Calidad del trabajo insatisfactoria</SelectItem>
                        <SelectItem value="incomplete">Trabajo no completado</SelectItem>
                        <SelectItem value="no_show">El profesional no se presentó</SelectItem>
                        <SelectItem value="overcharge">Cobro excesivo</SelectItem>
                        <SelectItem value="damage">Daños causados</SelectItem>
                        <SelectItem value="communication">Falta de comunicación</SelectItem>
                        <SelectItem value="other">Otro motivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Monto en disputa (USD)</Label>
                    <Input
                      type="number"
                      placeholder="Ej: 2000"
                      value={form.amount_disputed}
                      onChange={(e) => setForm(prev => ({ ...prev, amount_disputed: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Descripción detallada *</Label>
                    <Textarea
                      placeholder="Explica la situación con el mayor detalle posible..."
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                      rows={5}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 cursor-pointer">
                      {submitting ? 'Enviando...' : 'Enviar Disputa'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="cursor-pointer">
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Disputes List */}
          {disputes.length > 0 ? (
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <Card key={dispute.id} className="bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {statusIcon(dispute.status)}
                          <h4 className="font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>{dispute.job_title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{dispute.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-xs">{dispute.reason}</Badge>
                          {dispute.amount_disputed > 0 && (
                            <span className="text-xs text-muted-foreground">${dispute.amount_disputed} USD</span>
                          )}
                        </div>
                      </div>
                      <Badge className={`shrink-0 text-xs ${
                        dispute.status === 'open' ? 'bg-amber-100 text-amber-800' :
                        dispute.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {statusLabel(dispute.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !showForm ? (
            <Card className="bg-white">
              <CardContent className="p-10 text-center">
                <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 style={{ fontFamily: 'Poppins, sans-serif' }}>No tienes disputas</h3>
                <p className="text-muted-foreground mt-2">
                  Si tienes un problema con un trabajo, puedes abrir una disputa aquí
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Info */}
          <div className="mt-6 p-5 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <h4 className="font-semibold text-sm mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>ℹ️ Proceso de resolución</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Envías tu disputa con toda la documentación</li>
              <li>2. Nuestro equipo contacta a ambas partes en 24-48h</li>
              <li>3. Se evalúan las pruebas y se propone una solución</li>
              <li>4. Si ambas partes aceptan, se ejecuta la resolución</li>
              <li>5. En caso de desacuerdo, un mediador toma la decisión final</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}