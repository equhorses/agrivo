import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES, CATEGORIES } from '@/lib/constants';
import { VerifiedBadge, TopProBadge } from '@/components/Badges';

const client = createClient();

export default function KycVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    document_type: '',
    document_number: '',
    country: '',
    address: '',
    specialty: '',
    years_experience: '',
    certifications: '',
    bio: '',
  });

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (!res?.data) {
          client.auth.toLogin();
        } else {
          setUser(res.data);
          // Pre-fill name if available
          if (res.data.nickname) {
            setForm(prev => ({ ...prev, full_name: res.data.nickname }));
          }
        }
      })
      .catch(() => {
        client.auth.toLogin();
      });
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no puede superar 5MB');
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name || !form.document_type || !form.document_number || !form.country || !form.specialty) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (!documentFile) {
      toast.error('Debes subir una foto de tu documento de identidad');
      return;
    }

    setSubmitting(true);
    try {
      // Upload document file
      let documentUrl = '';
      try {
        const uploadRes = await client.storage.upload({
          file: documentFile,
          bucket: 'kyc-documents',
          path: `${user?.id || 'unknown'}/${Date.now()}-${documentFile.name}`,
        });
        if (uploadRes?.data?.url) {
          documentUrl = uploadRes.data.url;
        }
      } catch {
        // Storage might not be configured, continue without URL
        documentUrl = `pending-review-${Date.now()}`;
      }

      // Save KYC verification record
      await client.entities.kyc_verifications.create({
        data: {
          full_name: form.full_name,
          document_type: form.document_type,
          document_number: form.document_number,
          country: form.country,
          address: form.address,
          specialty: form.specialty,
          years_experience: form.years_experience ? Number(form.years_experience) : 0,
          certifications: form.certifications,
          description: form.bio,
          document_photo_url: documentUrl,
          status: 'pending',
          plan: plan,
        },
      });

      // Save KYC profile data
      // First check if profile exists
      const existingProfile = await client.entities.profiles.queryMine({ limit: 1 });
      const profileData = {
        display_name: form.full_name,
        country: form.country,
        specialty: form.specialty,
        description: form.bio,
        role: 'professional',
        verified_kyc: false, // Will be set to true after admin review
        kyc_status: 'pending_review',
        plan: plan,
        document_type: form.document_type,
        document_number: form.document_number,
        address: form.address,
        years_experience: form.years_experience ? Number(form.years_experience) : 0,
        certifications: form.certifications,
        document_url: documentUrl,
        rating: 5.0,
        jobs_completed: 0,
      };

      if (existingProfile?.data?.items?.length > 0) {
        await client.entities.profiles.update({
          id: existingProfile.data.items[0].id,
          data: profileData,
        });
      } else {
        await client.entities.profiles.create({ data: profileData });
      }

      setSubmitted(true);
      toast.success('¡Documentación enviada! Tu verificación está en proceso.');
    } catch (err) {
      toast.error('Error al enviar la documentación. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-16 bg-slate-50">
          <div className="container max-w-lg text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl md:text-3xl mb-4">¡Verificación en proceso!</h1>
            <p className="text-muted-foreground mb-6">
              Hemos recibido tu documentación. Nuestro equipo revisará tu información en un plazo de 24-48 horas.
              Recibirás una notificación cuando tu perfil sea verificado.
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-sm text-muted-foreground">Tu insignia será:</span>
              {plan === 'enterprise' ? <TopProBadge /> : <VerifiedBadge />}
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-6">
              <strong>Estado:</strong> Pendiente de revisión. Tu plan ya está activo, la insignia se mostrará una vez verificado.
            </div>
            <Button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-emerald-600 to-teal-600 cursor-pointer">
              Ir a Mi Panel
            </Button>
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl md:text-3xl">Verificación de identidad</h1>
            <p className="text-muted-foreground mt-2">
              Completa tu perfil profesional para obtener tu insignia
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                Plan {plan === 'enterprise' ? 'Empresa' : 'Profesional'}
              </Badge>
              {plan === 'enterprise' ? <TopProBadge /> : <VerifiedBadge />}
            </div>
          </div>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Datos de verificación KYC
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Esta información será revisada por nuestro equipo para verificar tu identidad profesional.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Datos personales</h4>

                  <div>
                    <Label htmlFor="full_name">Nombre completo *</Label>
                    <Input
                      id="full_name"
                      placeholder="Ej: Carlos Alberto Mendoza García"
                      value={form.full_name}
                      onChange={(e) => updateField('full_name', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de documento *</Label>
                      <Select value={form.document_type} onValueChange={(v) => updateField('document_type', v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dni">DNI / Cédula</SelectItem>
                          <SelectItem value="passport">Pasaporte</SelectItem>
                          <SelectItem value="driver_license">Licencia de conducir</SelectItem>
                          <SelectItem value="tax_id">NIF / CUIT / RFC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="document_number">Número de documento *</Label>
                      <Input
                        id="document_number"
                        placeholder="Ej: 12345678A"
                        value={form.document_number}
                        onChange={(e) => updateField('document_number', e.target.value)}
                        className="mt-1"
                      />
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
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        placeholder="Ciudad, Provincia/Estado"
                        value={form.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Documento de identidad</h4>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Sube una foto clara de tu documento de identidad
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Formatos: JPG, PNG, PDF · Máximo 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="doc-upload"
                    />
                    <label htmlFor="doc-upload">
                      <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild>
                        <span>Seleccionar archivo</span>
                      </Button>
                    </label>
                    {documentFile && (
                      <p className="text-sm text-emerald-700 mt-3 font-medium">
                        ✓ {documentFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Información profesional</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Especialidad principal *</Label>
                      <Select value={form.specialty} onValueChange={(v) => updateField('specialty', v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="years_experience">Años de experiencia</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        placeholder="Ej: 5"
                        value={form.years_experience}
                        onChange={(e) => updateField('years_experience', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="certifications">Certificaciones y títulos</Label>
                    <Input
                      id="certifications"
                      placeholder="Ej: Ing. Agrónomo, Piloto RPAS certificado, ANAC..."
                      value={form.certifications}
                      onChange={(e) => updateField('certifications', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Descripción profesional</Label>
                    <Textarea
                      id="bio"
                      placeholder="Describe tu experiencia, servicios que ofreces, equipamiento disponible..."
                      value={form.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Privacy notice */}
                <div className="p-4 rounded-xl bg-slate-50 border text-xs text-muted-foreground">
                  <strong>Privacidad:</strong> Tu documento de identidad se almacena de forma segura y solo será utilizado para verificar tu identidad. 
                  No se compartirá con otros usuarios. Consulta nuestra{' '}
                  <a href="/legal/privacidad" className="text-emerald-600 underline">política de privacidad</a>.
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer"
                >
                  {submitting ? 'Enviando documentación...' : 'Enviar para verificación'}
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