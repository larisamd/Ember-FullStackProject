import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { categories, menu, promos, slots, tables } from './seed-data.js';
import { connectDatabase } from './database.js';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Configure it in .env.');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  passwordHash: String,
  role: { type: String, enum: ['customer', 'chef', 'admin'] },
  favorites: { type: [String], default: [] },
  tokenVersion: { type: Number, default: 0 },
});
const menuSchema = new mongoose.Schema({
  _id: String,
  name: String, category: String, price: Number, emoji: String, desc: String, tags: [String],
  spice: Number, cal: Number, mood: [String], hue: Number, available: Boolean,
});
const referenceSchema = new mongoose.Schema({ _id: String, value: mongoose.Schema.Types.Mixed });
const User = mongoose.model('User', userSchema);
const MenuItem = mongoose.model('MenuItem', menuSchema);
const ReferenceData = mongoose.model('ReferenceData', referenceSchema);

const accounts = [
  { role: 'customer', name: process.env.CUSTOMER_NAME, email: process.env.CUSTOMER_EMAIL, password: process.env.CUSTOMER_PASSWORD },
  { role: 'chef', name: process.env.CHEF_NAME, email: process.env.CHEF_EMAIL, password: process.env.CHEF_PASSWORD },
  { role: 'admin', name: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
];

for (const account of accounts) {
  if (!account.name || !account.email || !account.password || account.password.length < 12) {
    throw new Error(`Set ${account.role.toUpperCase()}_NAME, ${account.role.toUpperCase()}_EMAIL, and a password of at least 12 characters in .env.`);
  }
}

try {
  await connectDatabase();
  for (const item of menu) {
    const { _id, ...fields } = item;
    await MenuItem.updateOne({ _id }, { $setOnInsert: fields }, { upsert: true });
  }
  for (const account of accounts) {
    const email = account.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== account.role) throw new Error(`Account ${email} already exists with a different role.`);
      const hash = await bcrypt.hash(account.password, 12);
      await User.updateOne({ _id: existing._id }, { $set: { name: account.name, passwordHash: hash } });
    } else {
      await User.create({
        name: account.name.trim(),
        email,
        passwordHash: await bcrypt.hash(account.password, 12),
        role: account.role,
      });
    }
  }
  for (const [key, value] of Object.entries({ categories, slots, tables, promos })) {
    await ReferenceData.updateOne({ _id: key }, { $setOnInsert: { value } }, { upsert: true });
  }
  console.log(`Seed complete: ${menu.length} menu items, ${accounts.length} user accounts, and reference data.`);
} finally {
  await mongoose.disconnect();
}
