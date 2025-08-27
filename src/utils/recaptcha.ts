// reCAPTCHA utility functions
export const loadRecaptcha = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${
      import.meta.env.VITE_SITE_KEY
    }`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
};

export const executeRecaptcha = (action: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error("reCAPTCHA not loaded"));
      return;
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(import.meta.env.VITE_SITE_KEY, { action })
        .then(resolve)
        .catch(reject);
    });
  });
};

// Type definitions for reCAPTCHA
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}
