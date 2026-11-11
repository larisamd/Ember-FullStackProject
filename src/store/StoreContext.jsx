import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { apiRequest } from '../api';

const SESSION_KEY = 'ember_session_v1';
const emptyShared = {
  menu: [],
  orders: [],
  reservations: [],
  favorites: {},
  categories: [],
  slots: [],
  tables: [],
};

function readSession() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    return { token: stored.token || null, cart: Array.isArray(stored.cart) ? stored.cart : [] };
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return { token: null, cart: [] };
  }
}

function init() {
  const session = readSession();
  return {
    shared: emptyShared,
    session,
    user: null,
    loading: Boolean(session.token),
    error: null,
    toast: null,
    confetti: 0,
    cartOpen: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'BOOTSTRAP':
      return { ...state, shared: action.shared, user: action.user, loading: false, error: null };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.message };
    case 'LOGIN':
      return { ...state, user: action.user, session: { token: action.token, cart: [] }, error: null };
    case 'LOGOUT':
      return { ...state, user: null, session: { token: null, cart: [] }, cartOpen: false, error: null };
    case 'CART_ADD': {
      const existing = state.session.cart.find((item) => item.id === action.id);
      const cart = existing
        ? state.session.cart.map((item) => item.id === action.id ? { ...item, qty: item.qty + 1 } : item)
        : [...state.session.cart, { id: action.id, qty: 1 }];
      return { ...state, session: { ...state.session, cart } };
    }
    case 'CART_QTY': {
      const cart = state.session.cart
        .map((item) => item.id === action.id ? { ...item, qty: item.qty + action.delta } : item)
        .filter((item) => item.qty > 0);
      return { ...state, session: { ...state.session, cart } };
    }
    case 'CART_CLEAR':
      return { ...state, session: { ...state.session, cart: [] } };
    case 'CART_UI':
      return { ...state, cartOpen: action.open };
    case 'ORDER_CREATE':
      return {
        ...state,
        shared: {
          ...state.shared,
          orders: [action.order, ...state.shared.orders.filter((order) => order.id !== action.order.id)],
        },
        session: { ...state.session, cart: [] },
        confetti: state.confetti + 1,
        cartOpen: false,
      };
    case 'ORDER_UPDATE':
      return {
        ...state,
        shared: { ...state.shared, orders: state.shared.orders.map((order) => order.id === action.order.id ? action.order : order) },
      };
    case 'MENU_SAVE':
      return {
        ...state,
        shared: { ...state.shared, menu: state.shared.menu.map((item) => item.id === action.item.id ? action.item : item) },
      };
    case 'MENU_ADD':
      return {
        ...state,
        shared: {
          ...state.shared,
          menu: [...state.shared.menu.filter((item) => item.id !== action.item.id), action.item],
        },
      };
    case 'MENU_DELETE':
      return { ...state, shared: { ...state.shared, menu: state.shared.menu.filter((item) => item.id !== action.id) } };
    case 'RESERVATION_ADD':
      return {
        ...state,
        shared: {
          ...state.shared,
          reservations: [...state.shared.reservations.filter((entry) => entry.id !== action.reservation.id), action.reservation],
        },
      };
    case 'RESERVATION_DELETE':
      return {
        ...state,
        shared: { ...state.shared, reservations: state.shared.reservations.filter((reservation) => reservation.id !== action.id) },
      };
    case 'FAVORITES':
      return { ...state, shared: { ...state.shared, favorites: action.favorites } };
    case 'TOAST':
      return { ...state, toast: { id: Date.now(), msg: action.msg, kind: action.kind || 'ok' } };
    case 'TOAST_CLEAR':
      return { ...state, toast: null };
    default:
      return state;
  }
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, init);
  const token = state.session.token;

  const loadData = useCallback(async (authToken) => {
    const result = await apiRequest('/bootstrap', { token: authToken });
    const { user, ...shared } = result;
    dispatch({ type: 'BOOTSTRAP', user, shared });
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const refresh = async () => {
      try {
        const result = await apiRequest('/bootstrap', { token });
        if (!active) return;
        const { user, ...shared } = result;
        dispatch({ type: 'BOOTSTRAP', user, shared });
      } catch (error) {
        if (!active) return;
        if (/session has expired|sign in to continue|account is no longer available/i.test(error.message)) {
          sessionStorage.removeItem(SESSION_KEY);
          dispatch({ type: 'LOGOUT' });
          return;
        }
        dispatch({ type: 'LOAD_ERROR', message: error.message });
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token]);

  useEffect(() => {
    if (token) sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
    else sessionStorage.removeItem(SESSION_KEY);
  }, [state.session, token]);

  useEffect(() => {
    if (!state.toast) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'TOAST_CLEAR' }), 2600);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  const toast = useCallback((msg, kind) => dispatch({ type: 'TOAST', msg, kind }), []);

  const login = useCallback(async (email, password) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await loadData(result.token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: result.token, cart: [] }));
    dispatch({ type: 'LOGIN', token: result.token, user: result.user });
    toast(`Welcome, ${result.user.name} 👋`);
    return result.user;
  }, [loadData, toast]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', token });
    } catch (error) {
      toast(error.message, 'err');
      return;
    }
    sessionStorage.removeItem(SESSION_KEY);
    dispatch({ type: 'LOGOUT' });
  }, [token, toast]);

  const addToCart = useCallback((item) => {
    dispatch({ type: 'CART_ADD', id: item.id });
    toast(`${item.emoji} ${item.name} added`);
  }, [toast]);

  const runMutation = useCallback(async (path, options, onSuccess) => {
    try {
      const result = await apiRequest(path, { ...options, token });
      if (onSuccess) onSuccess(result);
      return result ?? true;
    } catch (error) {
      toast(error.message, 'err');
      return null;
    }
  }, [token, toast]);

  const applyPromo = useCallback(async (code) => {
    const result = await runMutation('/promos/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return result?.promo || null;
  }, [runMutation]);

  const createOrder = useCallback(async (order) => runMutation('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }, ({ order: created }) => dispatch({ type: 'ORDER_CREATE', order: created })), [runMutation]);

  const setOrderStatus = useCallback(async (id, status) => runMutation(`/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }, ({ order }) => dispatch({ type: 'ORDER_UPDATE', order })), [runMutation]);

  const createReservation = useCallback(async (reservation) => runMutation('/reservations', {
    method: 'POST',
    body: JSON.stringify(reservation),
  }, ({ reservation: created }) => dispatch({ type: 'RESERVATION_ADD', reservation: created })), [runMutation]);

  const deleteReservation = useCallback(async (id) => runMutation(`/reservations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, () => dispatch({ type: 'RESERVATION_DELETE', id })), [runMutation]);

  const toggleFavorite = useCallback(async (id, favorite) => runMutation(`/me/favorites/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ favorite }),
  }, ({ favorites }) => dispatch({ type: 'FAVORITES', favorites })), [runMutation]);

  const addMenuItem = useCallback(async (item) => runMutation('/menu', {
    method: 'POST',
    body: JSON.stringify(item),
  }, ({ item: created }) => dispatch({ type: 'MENU_ADD', item: created })), [runMutation]);

  const updateMenuPrice = useCallback(async (id, price) => runMutation(`/menu/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ price }),
  }, ({ item }) => dispatch({ type: 'MENU_SAVE', item })), [runMutation]);

  const setAvailability = useCallback(async (id, available) => runMutation(`/menu/${encodeURIComponent(id)}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ available }),
  }, ({ item }) => dispatch({ type: 'MENU_SAVE', item })), [runMutation]);

  const deleteMenuItem = useCallback(async (id) => runMutation(`/menu/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, () => dispatch({ type: 'MENU_DELETE', id })), [runMutation]);

  const retryLoad = useCallback(() => loadData(token).catch((error) => {
    dispatch({ type: 'LOAD_ERROR', message: error.message });
  }), [loadData, token]);

  const { menu, orders, reservations, favorites, categories, slots, tables } = state.shared;
  const cartItems = useMemo(
    () => state.session.cart
      .map((cartItem) => {
        const item = menu.find((entry) => entry.id === cartItem.id);
        return item ? { ...item, qty: cartItem.qty } : null;
      })
      .filter(Boolean),
    [state.session.cart, menu]
  );
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const value = {
    state,
    dispatch,
    user: state.user,
    menu,
    orders,
    reservations,
    favorites,
    categories,
    slots,
    tables,
    cartItems,
    subtotal,
    cartCount,
    toast,
    login,
    logout,
    addToCart,
    applyPromo,
    createOrder,
    setOrderStatus,
    createReservation,
    deleteReservation,
    toggleFavorite,
    addMenuItem,
    updateMenuPrice,
    setAvailability,
    deleteMenuItem,
    retryLoad,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
