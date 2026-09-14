import { useEffect, useState } from 'react';
import { createClient } from '@/lib/atomsClient';

const client = createClient();

/**
 * Todos los importes se guardan en USD en la base de datos (y los pagos de
 * Stripe siguen siendo en USD). Esto es solo para MOSTRAR el número en la
 * moneda que el usuario eligió en su perfil — con un tipo de cambio fijo,
 * aproximado. Si se quiere un tipo de cambio real y actualizado, habría que
 * traerlo de una API externa; de momento es una conversión orientativa.
 */
export const USD_TO_EUR_RATE = 0.92;

export function formatAmount(amountUsd: number | null | undefined, currency: 'USD' | 'EUR' = 'USD'): string {
  if (amountUsd === null || amountUsd === undefined || isNaN(amountUsd)) return '';
  if (currency === 'EUR') {
    return `€${Math.round(amountUsd * USD_TO_EUR_RATE).toLocaleString('es-ES')}`;
  }
  return `$${Math.round(amountUsd).toLocaleString('en-US')}`;
}

/** Lee la moneda preferida del usuario actual (perfil), USD por defecto —
 * para no repetir esta llamada en cada página que muestra precios. */
export function useMyCurrency(): 'USD' | 'EUR' {
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  useEffect(() => {
    client.entities.profiles.queryMine({ limit: 1 })
      .then((res) => {
        const c = res?.data?.items?.[0]?.currency;
        if (c === 'EUR') setCurrency('EUR');
      })
      .catch(() => {});
  }, []);
  return currency;
}
