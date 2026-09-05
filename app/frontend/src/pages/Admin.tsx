import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/atomsClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Shield, FileText, User } from 'lucide-react';
import { toast } from 'sonner';

const client = createClient();

interface KycItem {
  id: number;
  user_id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  country: string;
  specialty: string;
  years_experience: number;
  certifications: string;
  status: string;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pendingKyc, setPendingKyc] = useState<KycItem[]>([]);
  const [allKyc, setAllKyc] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

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
      .catch(() => client.auth.toLogin());
  }, []);

  const loadData = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        client.apiCall.invoke('/api/v1/admin/kyc/pending', {}, 'GET'),
        client.apiCall.invoke('/api/v1/admin/kyc/all', {}, 'GET'),
      ]);
      if (pendingRes?.data?.items) setPendingKyc(pendingRes.data.items);
      if (allRes?.data?.items) setAllKyc(allRes.data.items);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
    setLoading(false);
  };

  const handleAction = async (kycId: number, action: 'approve' | 'reject') => {
    setProcessing(kycId);
    try {
      const res = await client.apiCall.invoke('/api/v1/admin/kyc/action', {
        kyc_id: kycId,
        action,
      }, 'POST');
      if (res?.data?.success) {
        toast.success(action === 'approve' ? '✅ Verificación aprobada' : '❌ Verificación rechazada');
        loadData();
      } else {
        toast.error('Error al procesar la acción');
      }
    } catch {
      toast.error('Error al procesar la acción');
    }
    setProcessing(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-slate-50">
        <div className="container max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Poppins, sans-serif' }}>Panel de Administración</h1>
              <p className="text-muted-foreground text-sm">Gestiona verificaciones KYC y usuarios</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingKyc.length}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allKyc.filter(k => k.status === 'approved').length}</p>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allKyc.filter(k => k.status === 'rejected').length}</p>
                  <p className="text-sm text-muted-foreground">Rechazados</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="cursor-pointer">
                Pendientes ({pendingKyc.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="cursor-pointer">
                Todas ({allKyc.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-32 bg-white rounded-xl" />
                  ))}
                </div>
              ) : pendingKyc.length > 0 ? (
                <div className="space-y-4">
                  {pendingKyc.map((kyc) => (
                    <Card key={kyc.id} className="bg-white">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-emerald-700" />
                              </div>
                              <div>
                                <h3 className="font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>{kyc.full_name}</h3>
                                <p className="text-xs text-muted-foreground">ID: {kyc.user_id?.slice(0, 8)}...</p>
                              </div>
                              {statusBadge(kyc.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Documento:</span>
                                <p className="font-medium">{kyc.document_type}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Número:</span>
                                <p className="font-medium">{kyc.document_number}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">País:</span>
                                <p className="font-medium">{kyc.country || '-'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Especialidad:</span>
                                <p className="font-medium">{kyc.specialty || '-'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Experiencia:</span>
                                <p className="font-medium">{kyc.years_experience ? `${kyc.years_experience} años` : '-'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Certificaciones:</span>
                                <p className="font-medium">{kyc.certifications || '-'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Fecha:</span>
                                <p className="font-medium">{kyc.created_at ? new Date(kyc.created_at).toLocaleDateString('es') : '-'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              onClick={() => handleAction(kyc.id, 'approve')}
                              disabled={processing === kyc.id}
                              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              onClick={() => handleAction(kyc.id, 'reject')}
                              disabled={processing === kyc.id}
                              variant="destructive"
                              className="cursor-pointer"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white">
                  <CardContent className="p-10 text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
                    <h3 style={{ fontFamily: 'Poppins, sans-serif' }}>No hay verificaciones pendientes</h3>
                    <p className="text-muted-foreground mt-2">Todas las solicitudes han sido procesadas</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="all">
              {allKyc.length > 0 ? (
                <div className="space-y-3">
                  {allKyc.map((kyc) => (
                    <Card key={kyc.id} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <span className="font-medium text-sm">{kyc.full_name}</span>
                              <p className="text-xs text-muted-foreground">{kyc.document_type} · {kyc.country || 'Sin país'} · {kyc.specialty || 'Sin especialidad'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {kyc.created_at ? new Date(kyc.created_at).toLocaleDateString('es') : ''}
                            </span>
                            {statusBadge(kyc.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white">
                  <CardContent className="p-10 text-center">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay verificaciones registradas</p>
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