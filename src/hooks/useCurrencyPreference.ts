import { useState, useEffect } from "react";
import { detectUserCurrency, type SupportedCurrency } from "@/lib/currency";

/**
 * Reads the user's preferred currency from localStorage and keeps it in sync
 * when the CurrencySelector dispatches a "currencyChange" event.
 */
export function useCurrencyPreference(): SupportedCurrency {
  const [currency, setCurrency] = useState<SupportedCurrency>(() => detectUserCurrency());

  useEffect(() => {
    function onCurrencyChange(e: Event) {
      const detail = (e as CustomEvent<{ currency: SupportedCurrency }>).detail;
      if (detail?.currency) setCurrency(detail.currency);
    }
    window.addEventListener("currencyChange", onCurrencyChange);
    return () => window.removeEventListener("currencyChange", onCurrencyChange);
  }, []);

  return currency;
}
