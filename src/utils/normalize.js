// Helpers to normalize id access across objects coming from backend
export const getId = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'string' || typeof obj === 'number') return String(obj);
  return obj._id ?? obj.id ?? obj.userId ?? obj.uid ?? null;
};

export const normalizeObj = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const id = getId(obj);
  return { ...obj, id, _id: obj._id ?? id };
};

export default { getId, normalizeObj };
