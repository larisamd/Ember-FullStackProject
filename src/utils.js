export const money = (n) => '$' + Number(n || 0).toFixed(2);

export const homeFor = (u) =>
  u.role === 'chef' ? '/kitchen' : u.role === 'admin' ? '/admin' : '/';

export const ago = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
};

export const todayISO = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};