import { useEffect, useState } from "react";
import { SUPPORTED_CURRENCIES, detectUserCurrency, type SupportedCurrency } from "@/lib/currency";

const STORAGE_KEY = "filascope_currency";

export function CurrencySelector() {
  const [selected, setSelected] = useState<SupportedCurrency>(() => detectUserCurrency());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as SupportedCurrency | null;
    if (stored) setSelected(stored);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value as SupportedCurrency;
    setSelected(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
      window.dispatchEvent(new CustomEvent("currencyChange", { detail: { currency: code } }));
    } catch {
      // ignore storage errors
    }
  }

  return (
    <select
      value={selected}
      onChange={handleChange}
      aria-label="Select currency"
      className="
        bg-transparent border border-border/50 hover:border-border
        text-gray-400 hover:text-white text-sm
        rounded-md px-2 py-1.5
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-950
        cursor-pointer transition-colors duration-200
      "
    >
      {SUPPORTED_CURRENCIES.map(({ code, flag }) => (
        <option key={code} value={code} className="bg-popover text-foreground">
          {flag} {code}
        </option>
      ))}
    </select>
  );
}
