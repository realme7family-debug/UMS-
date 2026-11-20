import { useEffect, useState } from "react";
import api from "../api/client";

// branches hardly change, so keep one copy for the whole session
let cache = null;

export const clearBranchCache = () => {
  cache = null;
};

export default function useBranches() {
  const [branches, setBranches] = useState(cache || []);

  useEffect(() => {
    if (cache) return;
    api
      .get("/branches")
      .then(({ data }) => {
        cache = data.data;
        setBranches(cache);
      })
      .catch(() => {});
  }, []);

  const options = branches.map((b) => ({ value: b._id, label: `${b.code} — ${b.name}` }));
  return { branches, options };
}

export const semesterOptions = (max = 8) =>
  Array.from({ length: max }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));
