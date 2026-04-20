import { useState, useEffect } from "react";
import { portfoliosApi } from "../lib/api";

export function usePortfolioResult(id: string) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    portfoliosApi.result(id)
      .then((r) => setResult(r.data))
      .catch(() => setError("No backtest result found"))
      .finally(() => setLoading(false));
  }, [id]);

  return { result, loading, error };
}
