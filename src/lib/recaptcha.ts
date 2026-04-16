declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '';

export function loadRecaptcha(): void {
  if (!RECAPTCHA_SITE_KEY) return;
  if (document.querySelector('script[data-recaptcha]')) return;
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  script.setAttribute('data-recaptcha', 'true');
  document.head.appendChild(script);
}

export async function executeRecaptcha(action: string): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) return 'no-key';
  return new Promise((resolve) => {
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
        resolve(token);
      } catch {
        resolve('error');
      }
    });
  });
}
