/**
 * FastAPI devuelve los errores en dos formas distintas:
 * - HTTPException normal: { detail: "mensaje en texto" }
 * - Error de validación de Pydantic (422): { detail: [{ loc: [...], msg: "...", type: "..." }, ...] }
 * Este helper normaliza ambas para poder mostrarlas directamente en un toast,
 * en vez del mensaje genérico de siempre.
 */
export function getBackendErrorMessage(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((e: any) => {
        const field = Array.isArray(e?.loc) ? e.loc[e.loc.length - 1] : null;
        return field ? `${field}: ${e.msg}` : e.msg;
      })
      .filter(Boolean)
      .join(' · ');
  }

  return fallback;
}
