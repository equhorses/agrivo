import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function AuthError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-10 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-heading text-2xl mb-2">Error de autenticación</h2>
            <p className="text-muted-foreground mb-6">
              Hubo un problema al iniciar sesión. Por favor, intenta de nuevo.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/')} className="cursor-pointer">
                Volver al Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}