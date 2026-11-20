import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api/client";

/**
 * Small helper for GET requests.
 *   const { data, loading, reload } = useFetch("/subjects", { branch });
 * Pass url = null to skip the request.
 */
export default function useFetch(url, params = {}, { initial = null, select = (d) => d.data } = {}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);

  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await api.get(url, { params: JSON.parse(key) });
      setData(select(res.data));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, error, reload: load };
}
