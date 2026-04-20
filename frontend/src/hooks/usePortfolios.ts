import { useState, useEffect } from "react";
import { portfoliosApi } from "../lib/api";

export interface PortfolioSummary {
  id: string;
  name: string;
  created_at: string;
  has_result: boolean;
}

export function usePortfolios() {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const resp = await portfoliosApi.list();
      setPortfolios(resp.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return { portfolios, loading, refresh };
}
