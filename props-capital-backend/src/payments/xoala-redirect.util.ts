export type XoalaRedirectParameter = {
  name: string;
  value: unknown;
};

const REDIRECT_PARAMETER_KEYS = [
  'parameters',
  'listofParameters',
  'listOfParameters',
  'params',
];

function normalizeRedirectParameters(
  raw: unknown,
): XoalaRedirectParameter[] | null {
  if (Array.isArray(raw)) {
    const normalized = raw
      .map((param) => {
        if (!param || typeof param !== 'object') return null;
        const name = param.name;
        if (name === undefined || name === null || String(name).trim() === '') {
          return null;
        }
        return {
          name: String(name),
          value: param.value,
        };
      })
      .filter((param): param is XoalaRedirectParameter => !!param);

    return normalized.length ? normalized : null;
  }

  if (raw && typeof raw === 'object') {
    const normalized = Object.entries(raw).map(([name, value]) => ({
      name,
      value,
    }));
    return normalized.length ? normalized : null;
  }

  return null;
}

export function getXoalaRedirectMethod(redirect: any): string {
  return String(redirect?.method || 'GET').toUpperCase();
}

export function getXoalaRedirectParams(
  redirect: any,
): XoalaRedirectParameter[] | null {
  if (!redirect || typeof redirect !== 'object') return null;

  for (const key of REDIRECT_PARAMETER_KEYS) {
    const normalized = normalizeRedirectParameters(redirect[key]);
    if (normalized) return normalized;
  }

  return null;
}
