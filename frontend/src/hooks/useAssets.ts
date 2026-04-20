import { useState, useEffect } from "react";
import { assetsApi } from "../lib/api";

export interface Asset {
  code: string;
  name: string;
  asset_class: string;
  start_date: string;
  end_date: string;
  frequency: string;
}

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const resp = await assetsApi.list();
      setAssets(resp.data);
    } finally {
      setLoading(false);
    }
  };

  const upload = async (file: File, name: string, asset_class: string) => {
    await assetsApi.upload(file, name, asset_class);
    await refresh();
  };

  const remove = async (code: string) => {
    await assetsApi.delete(code);
    await refresh();
  };

  useEffect(() => { refresh(); }, []);
  return { assets, loading, upload, remove, refresh };
}
