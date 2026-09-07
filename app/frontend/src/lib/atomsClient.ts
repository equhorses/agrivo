/**
 * Reemplazo local de `@metagptx/web-sdk`.
 *
 * Cuando el proyecto vivía en Atoms, cada página llamaba a un SDK genérico
 * (`createClient()` -> `client.auth.*`, `client.entities.X.*`, etc.) que
 * hablaba con la infraestructura propia de Atoms. Ahora hablamos
 * directamente con nuestro propio backend FastAPI (ver app/backend/routers/),
 * pero mantenemos la MISMA forma de llamada para no tener que reescribir
 * cada página — solo cambia de dónde se importa `createClient`.
 *
 * Convención: cada método devuelve `{ data: <cuerpo real de la respuesta> }`,
 * igual que hacía el SDK original (que a su vez imita la forma de axios).
 */
import axios from 'axios';
import { getAPIBaseURL } from './config';

const TOKEN_KEY = 'agrivo_auth_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function http() {
  const instance = axios.create({ baseURL: getAPIBaseURL() });
  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });
  return instance;
}

type QueryOpts = {
  query?: Record<string, unknown>;
  sort?: string;
  skip?: number;
  limit?: number;
  fields?: string;
};

function buildParams(opts: QueryOpts = {}) {
  const params: Record<string, string | number> = {};
  if (opts.query) params.query = JSON.stringify(opts.query);
  if (opts.sort) params.sort = opts.sort;
  if (opts.skip !== undefined) params.skip = opts.skip;
  if (opts.limit !== undefined) params.limit = opts.limit;
  if (opts.fields) params.fields = opts.fields;
  return params;
}

/** Fábrica de un "entity" genérico: bids, jobs, messages, profiles, etc. */
function makeEntity(name: string) {
  const base = `/api/v1/entities/${name}`;
  return {
    // Solo mis propios registros (el backend filtra por el usuario autenticado)
    async queryMine(opts: QueryOpts = {}) {
      const res = await http().get(base, { params: buildParams(opts) });
      return { data: res.data };
    },
    // Todos los registros visibles (según permisos del backend)
    async queryAll(opts: QueryOpts = {}) {
      const res = await http().get(`${base}/all`, { params: buildParams(opts) });
      return { data: res.data };
    },
    async create(payload: Record<string, unknown>) {
      const res = await http().post(base, payload);
      return { data: res.data };
    },
    async update(id: string | number, payload: Record<string, unknown>) {
      const res = await http().put(`${base}/${id}`, payload);
      return { data: res.data };
    },
    async remove(id: string | number) {
      const res = await http().delete(`${base}/${id}`);
      return { data: res.data };
    },
  };
}

const ENTITY_NAMES = [
  'bids',
  'jobs',
  'kyc_verifications',
  'messages',
  'profiles',
  'subscriptions',
] as const;

export function createClient() {
  const entities = Object.fromEntries(
    ENTITY_NAMES.map((name) => [name, makeEntity(name)])
  ) as Record<(typeof ENTITY_NAMES)[number], ReturnType<typeof makeEntity>>;

  return {
    auth: {
      async me() {
        const res = await http().get('/api/v1/auth/me');
        return { data: res.data };
      },
      async logout() {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      },
      toLogin() {
        window.location.href = '/login';
      },
    },

    entities,

    // Pasarela genérica: llama a cualquier ruta de nuestro propio backend.
    // La usa Admin.tsx para /api/v1/admin/kyc/*.
    apiCall: {
      async invoke(path: string, body: Record<string, unknown> = {}, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST') {
        const res = await http().request({
          url: path,
          method,
          ...(method === 'GET' ? { params: body } : { data: body }),
        });
        return { data: res.data };
      },
    },

    // Stripe real (routers/payments.py). Suscripciones Pro/Empresa: checkout
    // recurrente + activación única, cancelar/reanudar/cambiar plan, y
    // estado leído siempre del backend (nunca lo declara el propio frontend).
    payment: {
      async createSubscriptionCheckout(plan: 'pro' | 'enterprise'): Promise<{ data: { url: string } }> {
        const res = await http().post('/api/v1/payments/checkout', { plan });
        return { data: res.data };
      },
      async getMySubscription(): Promise<{
        data: {
          subscription_status: string | null;
          plan: string | null;
          cancel_at_period_end: boolean | null;
          subscription_end_date: string | null;
        };
      }> {
        const res = await http().get('/api/v1/payments/subscription/me');
        return { data: res.data };
      },
      async cancelSubscription(): Promise<{ data: unknown }> {
        const res = await http().post('/api/v1/payments/subscription/cancel');
        return { data: res.data };
      },
      async resumeSubscription(): Promise<{ data: unknown }> {
        const res = await http().post('/api/v1/payments/subscription/resume');
        return { data: res.data };
      },
      async changePlan(plan: 'pro' | 'enterprise'): Promise<{ data: unknown }> {
        const res = await http().post('/api/v1/payments/subscription/change-plan', { plan });
        return { data: res.data };
      },
    },

    // Anuncios self-service (routers/house_ads.py): huecos publicitarios que
    // empresas externas pueden reservar y pagar, sujeto a aprobación manual.
    houseAds: {
      async getForSlot(slot: string): Promise<{
        data: { slot: string; title: string; image_url: string; link_url: string } | null;
      }> {
        const res = await http().get(`/api/v1/house-ads/${slot}`);
        return { data: res.data };
      },
      async listSlots(): Promise<{
        data: Array<{
          slot: string;
          price_cents: number;
          self_service_enabled: boolean;
          occupied_until: string | null;
          queue_length: number;
        }>;
      }> {
        const res = await http().get('/api/v1/house-ads/slots');
        return { data: res.data };
      },
      async bookSlot(payload: {
        slot: string;
        advertiser_name: string;
        title: string;
        image_url: string;
        link_url: string;
      }): Promise<{ data: { url: string } }> {
        const res = await http().post('/api/v1/house-ads/book', payload);
        return { data: res.data };
      },
      async myBookings(): Promise<{ data: unknown[] }> {
        const res = await http().get('/api/v1/house-ads/my-bookings');
        return { data: res.data };
      },
    },

    // Sube un archivo real usando el flujo de URL prefirmada que ya expone
    // /api/v1/storage/upload-url (ver routers/storage.py).
    storage: {
      async upload({ file, bucket, path }: { file: File; bucket: string; path: string }) {
        const urlRes = await http().post('/api/v1/storage/upload-url', {
          bucket_name: bucket,
          object_key: path,
        });
        const { upload_url, download_url } = urlRes.data;
        await axios.put(upload_url, file, {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
        return { data: { url: download_url } };
      },
    },
  };
}
