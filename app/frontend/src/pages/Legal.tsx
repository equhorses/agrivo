import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BRAND } from '@/lib/constants';

const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terminos: {
    title: 'Términos de Servicio',
    content: `
## 1. Aceptación de los Términos

Al acceder y utilizar ${BRAND.name}, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.

## 2. Descripción del Servicio

${BRAND.name} es una plataforma que conecta agricultores con profesionales del sector agrícola para la contratación de servicios especializados.

## 3. Registro de Cuenta

Para utilizar ciertas funciones de la plataforma, debes crear una cuenta proporcionando información precisa y actualizada. Eres responsable de mantener la confidencialidad de tu cuenta.

## 4. Uso Aceptable

Te comprometes a utilizar la plataforma de manera legal y ética. Está prohibido publicar contenido falso, fraudulento o que viole los derechos de terceros.

## 5. Pagos y Facturación

Los pagos se procesan a través de proveedores de pago seguros. ${BRAND.name} no almacena información de tarjetas de crédito directamente.

## 6. Limitación de Responsabilidad

${BRAND.name} actúa como intermediario entre agricultores y profesionales. No somos responsables de la calidad del trabajo realizado ni de disputas entre usuarios.

## 7. Modificaciones

Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma.
    `,
  },
  privacidad: {
    title: 'Política de Privacidad',
    content: `
## 1. Información que Recopilamos

Recopilamos información personal que nos proporcionas al registrarte, como nombre, email, país y datos profesionales.

## 2. Uso de la Información

Utilizamos tu información para:
- Proporcionar y mantener el servicio
- Conectarte con profesionales o agricultores
- Enviar notificaciones relevantes
- Mejorar la plataforma

## 3. Compartir Información

No vendemos tu información personal. Solo la compartimos con:
- Otros usuarios de la plataforma según sea necesario para el servicio
- Proveedores de servicios que nos ayudan a operar la plataforma
- Cuando sea requerido por ley

## 4. Seguridad

Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal.

## 5. Tus Derechos

Tienes derecho a acceder, corregir o eliminar tu información personal. Contacta con nosotros para ejercer estos derechos.

## 6. Retención de Datos

Mantenemos tu información mientras tu cuenta esté activa o según sea necesario para proporcionarte servicios.
    `,
  },
  cookies: {
    title: 'Política de Cookies',
    content: `
## 1. ¿Qué son las Cookies?

Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestra plataforma.

## 2. Cookies que Utilizamos

- **Cookies esenciales**: Necesarias para el funcionamiento básico de la plataforma (sesión, autenticación).
- **Cookies de rendimiento**: Nos ayudan a entender cómo interactúas con la plataforma para mejorarla.
- **Cookies de funcionalidad**: Recuerdan tus preferencias (idioma, país, filtros).

## 3. Control de Cookies

Puedes controlar las cookies a través de la configuración de tu navegador. Ten en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad de la plataforma.

## 4. Cookies de Terceros

Utilizamos servicios de terceros (analytics, pagos) que pueden establecer sus propias cookies.

## 5. Actualizaciones

Esta política puede actualizarse periódicamente. Te notificaremos sobre cambios significativos.
    `,
  },
  contacto: {
    title: 'Contacto',
    content: `
## Información de Contacto

Para cualquier consulta, sugerencia o reclamación, puedes contactarnos a través de:

**Email**: soporte@agrivo.com

**Horario de atención**: Lunes a Viernes, 9:00 - 18:00 (CET)

**Redes sociales**: Síguenos en nuestras redes para estar al día de las novedades.

## Soporte Técnico

Si tienes problemas técnicos con la plataforma, describe tu problema con el mayor detalle posible incluyendo:
- Tu navegador y sistema operativo
- Pasos para reproducir el problema
- Capturas de pantalla si es posible

## Sugerencias

Valoramos tu feedback. Si tienes ideas para mejorar ${BRAND.name}, no dudes en compartirlas con nosotros.
    `,
  },
};

export default function Legal() {
  const { page } = useParams();
  const content = LEGAL_CONTENT[page || ''];

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h2>Página no encontrada</h2>
          <Link to="/" className="text-emerald-600 hover:underline mt-4 inline-block cursor-pointer">
            Volver al inicio
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="text-3xl md:text-4xl mb-8">{content.title}</h1>
          <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
            {content.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-xl font-semibold mt-8 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('- ')) {
                return <li key={i} className="text-muted-foreground ml-4">{line.replace('- ', '')}</li>;
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="font-semibold mt-2">{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.trim() === '') return null;
              return <p key={i} className="text-muted-foreground mb-2">{line}</p>;
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}