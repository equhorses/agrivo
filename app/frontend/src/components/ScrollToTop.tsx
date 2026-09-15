import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router, al navegar entre páginas dentro de la misma app (sin
 * recargar), no toca el scroll — así que si estabas abajo del todo en un
 * listado, la página nueva se abre igual de abajo, con el pie de página a
 * la vista en vez del contenido. Esto fuerza volver arriba en cada cambio
 * de ruta, como se espera de cualquier navegación normal.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
