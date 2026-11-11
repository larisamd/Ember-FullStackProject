import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';
import { connectDatabase } from './database.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Copy .env.example to .env and configure it.');
if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');

app.use(express.json({ limit: '32kb' }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['customer', 'chef', 'admin'] },
  favorites: { type: [String], default: [] },
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

const menuSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0.01 },
  emoji: { type: String, required: true },
  desc: { type: String, required: true },
  tags: { type: [String], default: [] },
  spice: { type: Number, min: 0, max: 3, default: 0 },
  cal: { type: Number, min: 0, default: 0 },
  mood: { type: [String], default: [] },
  hue: { type: Number, min: 0, max: 359, default: 0 },
  available: { type: Boolean, default: true },
});

const orderSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  items: [{
    id: String, name: String, emoji: String, price: Number, qty: Number,
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, required: true },
  tip: { type: Number, required: true },
  total: { type: Number, required: true },
  type: { type: String, enum: ['dine-in', 'pickup'], required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['new', 'cooking', 'ready', 'served'], default: 'new' },
}, { timestamps: true });

const reservationSchema = new mongoose.Schema({
  customerId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  size: { type: Number, required: true, min: 1, max: 8 },
  table: { type: String, required: true },
  note: { type: String, default: '' },
}, { timestamps: true });
reservationSchema.index({ date: 1, time: 1, table: 1 }, { unique: true });

const referenceSchema = new mongoose.Schema({
  _id: String,
  value: mongoose.Schema.Types.Mixed,
});

const User = mongoose.model('User', userSchema);
const MenuItem = mongoose.model('MenuItem', menuSchema);
const Order = mongoose.model('Order', orderSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);
const ReferenceData = mongoose.model('ReferenceData', referenceSchema);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
});
const millis = (date) => date ? new Date(date).getTime() : undefined;
const toMenu = (doc) => ({ ...doc.toObject(), id: String(doc._id), _id: undefined, __v: undefined });
const toOrder = (doc) => ({
  id: doc.number,
  customerId: doc.customerId,
  customerName: doc.customerName,
  items: doc.items,
  subtotal: doc.subtotal,
  discount: doc.discount,
  tip: doc.tip,
  total: doc.total,
  type: doc.type,
  note: doc.note,
  status: doc.status,
  createdAt: millis(doc.createdAt),
  updatedAt: millis(doc.updatedAt),
});
const toReservation = (doc) => ({
  id: String(doc._id),
  userId: doc.customerId,
  name: doc.name,
  date: doc.date,
  time: doc.time,
  size: doc.size,
  table: doc.table,
  note: doc.note,
  createdAt: millis(doc.createdAt),
});
const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const authenticate = asyncRoute(async (req, _res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Sign in to continue.');
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Your account is no longer available.');
  if (payload.ver !== user.tokenVersion) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  req.user = user;
  next();
});

const allow = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission to do that.'));
  next();
};
const requireFields = (body, fields) => {
  if (!body || fields.some((field) => body[field] === undefined || body[field] === null)) {
    throw new HttpError(400, 'Some required fields are missing.');
  }
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const user = await User.findOne({ email: String(req.body.email).trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(String(req.body.password), user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  const token = jwt.sign({ ver: user.tokenVersion }, JWT_SECRET, { subject: String(user._id), expiresIn: '8h' });
  res.json({ token, user: publicUser(user) });
}));

app.post('/api/auth/logout', authenticate, asyncRoute(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  res.status(204).end();
}));

app.get('/api/bootstrap', authenticate, asyncRoute(async (req, res) => {
  const isStaff = req.user.role !== 'customer';
  const [menu, orders, reservations, references] = await Promise.all([
    MenuItem.find().sort({ category: 1, name: 1 }),
    Order.find(isStaff ? {} : { customerId: String(req.user._id) }).sort({ createdAt: -1 }),
    Reservation.find(isStaff ? {} : { customerId: String(req.user._id) }).sort({ date: 1, time: 1 }),
    ReferenceData.find({ _id: { $in: ['categories', 'slots', 'tables'] } }),
  ]);
  const data = Object.fromEntries(references.map((entry) => [entry._id, entry.value]));
  res.json({
    user: publicUser(req.user),
    menu: menu.map(toMenu),
    orders: orders.map(toOrder),
    reservations: reservations.map(toReservation),
    favorites: { [String(req.user._id)]: req.user.favorites },
    categories: data.categories || [],
    slots: data.slots || [],
    tables: data.tables || [],
  });
}));

app.post('/api/promos/validate', authenticate, allow('customer'), asyncRoute(async (req, res) => {
  requireFields(req.body, ['code']);
  const promos = await ReferenceData.findById('promos');
  const promo = (promos?.value || []).find((entry) => entry.code === String(req.body.code).trim().toUpperCase());
  if (!promo) throw new HttpError(404, 'That code is not valid.');
  res.json({ promo });
}));

app.post('/api/orders', authenticate, allow('customer'), asyncRoute(async (req, res) => {
  requireFields(req.body, ['items', 'type', 'tipPct']);
  if (!Array.isArray(req.body.items) || req.body.items.length === 0) throw new HttpError(400, 'Add at least one item to your order.');
  if (!['dine-in', 'pickup'].includes(req.body.type)) throw new HttpError(400, 'Choose dine-in or pickup.');
  const tipPct = Number(req.body.tipPct);
  if (![0, 10, 15, 20].includes(tipPct)) throw new HttpError(400, 'Choose a valid tip amount.');

  const itemIds = [...new Set(req.body.items.map((item) => String(item.id)))];
  if (itemIds.length !== req.body.items.length) throw new HttpError(400, 'Each menu item can only appear once in the cart.');
  const menu = await MenuItem.find({ _id: { $in: itemIds } });
  if (menu.length !== itemIds.length) throw new HttpError(400, 'A menu item in your cart no longer exists.');
  const menuById = new Map(menu.map((item) => [String(item._id), item]));
  const items = req.body.items.map((entry) => {
    const item = menuById.get(String(entry.id));
    const qty = Number(entry.qty);
    if (!item.available) throw new HttpError(409, `${item.name} is sold out.`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new HttpError(400, 'An item quantity is invalid.');
    return { id: String(item._id), name: item.name, emoji: item.emoji, price: item.price, qty };
  });
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  let discount = 0;
  if (req.body.promoCode) {
    const promoData = await ReferenceData.findById('promos');
    const promo = (promoData?.value || []).find((entry) => entry.code === String(req.body.promoCode).trim().toUpperCase());
    if (!promo) throw new HttpError(400, 'That promo code is no longer valid.');
    discount = promo.type === 'pct' ? subtotal * promo.value / 100 : Math.min(promo.value, subtotal);
  }
  discount = roundMoney(discount);
  const tip = roundMoney((subtotal - discount) * tipPct / 100);
  const order = await Order.create({
    number: `ORD-${randomBytes(4).toString('hex').toUpperCase()}`,
    customerId: String(req.user._id),
    customerName: req.user.name,
    items,
    subtotal,
    discount,
    tip,
    total: roundMoney(subtotal - discount + tip),
    type: req.body.type,
    note: String(req.body.note || '').slice(0, 500),
    status: 'new',
  });
  res.status(201).json({ order: toOrder(order) });
}));

app.patch('/api/orders/:id/status', authenticate, allow('chef', 'admin'), asyncRoute(async (req, res) => {
  const allowed = { new: 'cooking', cooking: 'ready', ready: 'served' };
  const order = await Order.findOne({ number: req.params.id });
  if (!order) throw new HttpError(404, 'Order not found.');
  if (allowed[order.status] !== req.body.status) throw new HttpError(400, 'That order status transition is not allowed.');
  order.status = req.body.status;
  await order.save();
  res.json({ order: toOrder(order) });
}));

app.post('/api/reservations', authenticate, allow('customer'), asyncRoute(async (req, res) => {
  requireFields(req.body, ['name', 'date', 'time', 'size', 'table']);
  const [tableData, slotData] = await Promise.all([
    ReferenceData.findById('tables'),
    ReferenceData.findById('slots'),
  ]);
  const table = (tableData?.value || []).find((entry) => entry.id === req.body.table);
  if (!table || Number(req.body.size) > table.seats || Number(req.body.size) < 1 || Number(req.body.size) > 8) {
    throw new HttpError(400, 'Choose a table that fits your party.');
  }
  if (!(slotData?.value || []).includes(req.body.time)) throw new HttpError(400, 'Choose a valid reservation time.');
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(req.body.date) ? Date.parse(`${req.body.date}T00:00:00Z`) : NaN;
  if (!Number.isFinite(dateValue) || new Date(dateValue).toISOString().slice(0, 10) !== req.body.date
    || req.body.date < new Date().toISOString().slice(0, 10)) {
    throw new HttpError(400, 'Choose a valid future reservation date.');
  }
  const reservation = await Reservation.create({
    customerId: String(req.user._id),
    name: String(req.body.name).trim().slice(0, 100),
    date: req.body.date,
    time: req.body.time,
    size: Number(req.body.size),
    table: table.id,
    note: String(req.body.note || '').slice(0, 500),
  });
  res.status(201).json({ reservation: toReservation(reservation) });
}));

app.delete('/api/reservations/:id', authenticate, allow('customer', 'admin'), asyncRoute(async (req, res) => {
  const query = { _id: req.params.id };
  if (req.user.role === 'customer') query.customerId = String(req.user._id);
  const reservation = await Reservation.findOneAndDelete(query);
  if (!reservation) throw new HttpError(404, 'Reservation not found.');
  res.status(204).end();
}));

app.put('/api/me/favorites/:id', authenticate, allow('customer'), asyncRoute(async (req, res) => {
  const id = req.params.id;
  if (!await MenuItem.exists({ _id: id })) throw new HttpError(404, 'Menu item not found.');
  const isFavorite = req.body.favorite === true;
  const update = isFavorite ? { $addToSet: { favorites: id } } : { $pull: { favorites: id } };
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  res.json({ favorites: { [String(user._id)]: user.favorites } });
}));

app.post('/api/menu', authenticate, allow('admin'), asyncRoute(async (req, res) => {
  requireFields(req.body, ['name', 'category', 'price', 'emoji', 'desc']);
  const categoryData = await ReferenceData.findById('categories');
  if (!(categoryData?.value || []).includes(req.body.category)) throw new HttpError(400, 'Choose a valid menu category.');
  const price = Number(req.body.price);
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, 'Enter a valid price.');
  const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
  if (!tags.every((tag) => ['vegan', 'veg', 'gf'].includes(tag))) throw new HttpError(400, 'One or more dietary tags are invalid.');
  const item = await MenuItem.create({
    _id: randomUUID(),
    name: String(req.body.name).trim(),
    category: String(req.body.category),
    price,
    emoji: String(req.body.emoji),
    desc: String(req.body.desc),
    tags,
    spice: Number(req.body.spice || 0),
    cal: Number(req.body.cal || 0),
    mood: Array.isArray(req.body.mood) ? req.body.mood : [],
    hue: Number(req.body.hue || 0),
    available: true,
  });
  res.status(201).json({ item: toMenu(item) });
}));

app.patch('/api/menu/:id/availability', authenticate, allow('chef', 'admin'), asyncRoute(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, { available: Boolean(req.body.available) }, { new: true });
  if (!item) throw new HttpError(404, 'Menu item not found.');
  res.json({ item: toMenu(item) });
}));

app.patch('/api/menu/:id', authenticate, allow('admin'), asyncRoute(async (req, res) => {
  const price = Number(req.body.price);
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, 'Enter a valid price.');
  const item = await MenuItem.findByIdAndUpdate(req.params.id, { price }, { new: true, runValidators: true });
  if (!item) throw new HttpError(404, 'Menu item not found.');
  res.json({ item: toMenu(item) });
}));

app.delete('/api/menu/:id', authenticate, allow('admin'), asyncRoute(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw new HttpError(404, 'Menu item not found.');
  res.status(204).end();
}));

app.use(express.static(path.resolve(__dirname, '../dist')));
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next(new HttpError(404, 'API route not found.'));
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

app.use((error, _req, res, _next) => {
  if (error?.code === 11000) return res.status(409).json({ error: 'That table has just been booked. Please choose another.' });
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'The submitted data is invalid.' });
  }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'The server could not complete the request.' : error.message });
});

await connectDatabase();
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
