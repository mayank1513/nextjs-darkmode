import { COOKIE_KEY, DARK, LIGHT, SYSTEM, modes } from "../../constants";
import { ColorSchemePreference, Store, useStore } from "../../utils";
import { useEffect } from "react";

const useEffectMinify = useEffect;
const localStorageMinify = localStorage;
export interface CoreProps {
  /** force apply CSS transition property to all the elements during theme switching. E.g., `all .3s` */
  t?: string;
}

/** Modify transition globally to avoid patched transitions */
const modifyTransition = (documentMinify: Document, themeTransition = "none") => {
  const css = documentMinify.createElement("style");
  /** split by ';' to prevent CSS injection */
  css.textContent = `*{transition:${themeTransition.split(";")[0]} !important;}`;
  const head = documentMinify.head;
  head.appendChild(css);

  return () => {
    // Force restyle
    getComputedStyle(documentMinify.body);
    // Wait for next tick before removing
    setTimeout(() => head.removeChild(css), 1);
  };
};

/**
 *  The Core component wich applies classes and transitions.
 * Cookies are set only if corresponding ServerTarget is detected.
 *
 * @example
 * ```tsx
 * <Core [t="background-color .3s"]/>
 * ```
 *
 * @source - Source code
 */
export const Core = ({ t }: CoreProps) => {
  const [{ m: mode, s: systemMode }, setThemeState] = useStore();
  const resolvedMode = mode === SYSTEM ? systemMode : mode; // resolvedMode is the actual mode that will be used

  useEffectMinify(() => {
    const media = matchMedia(`(prefers-color-scheme: ${DARK})`);
    /** Updating media: prefers-color-scheme*/
    const updateSystemColorScheme = () =>
      setThemeState(state => ({ ...state, s: media.matches ? DARK : LIGHT }) as Store);
    updateSystemColorScheme();
    media.addEventListener("change", updateSystemColorScheme);

    setThemeState(state => ({
      ...state,
      m: (localStorageMinify?.getItem(COOKIE_KEY) ?? SYSTEM) as ColorSchemePreference,
    }));
    /** Sync the tabs */
    const storageListener = (e: StorageEvent): void => {
      if (e.key === COOKIE_KEY)
        setThemeState(state => ({ ...state, m: e.newValue as ColorSchemePreference }));
    };
    addEventListener("storage", storageListener);
  }, []);

  useEffectMinify(() => {
    const documentMinify = document;
    const restoreTransitions = modifyTransition(documentMinify, t);
    const serverTargetEl = documentMinify.querySelector("[data-ndm]");
    // We need to always update documentElement to support Tailwind configuration
    // skipcq: JS-D008, JS-0042 -> map keyword is shorter
    [documentMinify.documentElement, serverTargetEl].map(el => {
      // skipcq: JS-0042
      if (!el) return;
      const clsList = el.classList;
      modes.forEach(mode => clsList.remove(mode));
      clsList.add(resolvedMode);
      [
        ["sm", systemMode],
        ["rm", resolvedMode],
        ["m", mode],
      ].forEach(([dataLabel, value]) => el.setAttribute(`data-${dataLabel}`, value));
    });
    restoreTransitions();
    // System mode is decided by current system state and need not be stored in localStorage
    localStorageMinify?.setItem(COOKIE_KEY, mode);
    if (serverTargetEl)
      documentMinify.cookie = `${COOKIE_KEY}=${resolvedMode};max-age=31536000;SameSite=Strict;`;
  }, [resolvedMode, systemMode, mode, t]);

  return null;
};
