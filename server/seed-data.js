export const categories = ['Starters', 'Mains', 'Desserts', 'Drinks'];

export const slots = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

export const tables = [
  { id: 'T1', seats: 2, shape: 'round' },
  { id: 'T2', seats: 2, shape: 'round' },
  { id: 'T3', seats: 2, shape: 'round' },
  { id: 'T4', seats: 4, shape: 'rect' },
  { id: 'T5', seats: 4, shape: 'rect' },
  { id: 'T6', seats: 4, shape: 'rect' },
  { id: 'T7', seats: 6, shape: 'long' },
  { id: 'T8', seats: 6, shape: 'long' },
  { id: 'T9', seats: 8, shape: 'long' },
];

const dish = (id, name, category, price, emoji, desc, tags, spice, cal, mood, hue) => ({
  _id: id,
  name,
  category,
  price,
  emoji,
  desc,
  tags,
  spice,
  cal,
  mood,
  hue,
  available: true,
});

export const menu = [
  dish('m1', 'Charred Miso Edamame', 'Starters', 8, '🫛', 'Blistered pods tossed in white miso butter and smoked sea salt.', ['vegan', 'gf'], 1, 180, ['fresh', 'adventure'], 140),
  dish('m2', 'Truffle Arancini', 'Starters', 12, '🍙', 'Crispy risotto spheres with molten fontina and black truffle aioli.', ['veg'], 0, 420, ['comfort', 'indulge'], 40),
  dish('m3', 'Tuna Tataki', 'Starters', 16, '🐟', 'Seared bluefin, yuzu ponzu, pickled shallot, crispy garlic.', ['gf'], 1, 240, ['fresh', 'indulge'], 200),
  dish('m4', 'Gochujang Fire Wings', 'Starters', 13, '🍗', 'Twice-fried wings glazed in sticky gochujang and honey.', [], 3, 560, ['comfort', 'adventure'], 5),
  dish('m5', 'Smoked Wagyu Burger', 'Mains', 22, '🍔', 'A5 wagyu patty, bourbon onions, aged cheddar, brioche.', [], 0, 820, ['comfort', 'indulge'], 25),
  dish('m6', 'Wild Mushroom Risotto', 'Mains', 19, '🍄', 'Arborio rice, porcini, thyme butter and shaved parmesan.', ['veg', 'gf'], 0, 610, ['comfort', 'indulge'], 30),
  dish('m7', 'Miso Glazed Salmon', 'Mains', 27, '🍣', 'Slow-roasted salmon, sesame greens, ginger-miso glaze.', ['gf'], 0, 540, ['fresh', 'indulge'], 15),
  dish('m8', 'Spicy Vodka Rigatoni', 'Mains', 20, '🍝', 'Bronze-cut pasta in a blushing, chili-laced vodka sauce.', ['veg'], 2, 690, ['comfort', 'adventure'], 350),
  dish('m9', 'Jackfruit Birria Tacos', 'Mains', 17, '🌮', 'Slow-braised jackfruit, consommé for dipping, lime, cilantro.', ['vegan'], 2, 480, ['adventure'], 60),
  dish('m10', 'Molten Lava Cake', 'Desserts', 11, '🍫', 'Dark chocolate core, salted caramel, vanilla bean gelato.', ['veg'], 0, 520, ['indulge', 'comfort'], 20),
  dish('m11', 'Yuzu Basque Cheesecake', 'Desserts', 10, '🍰', 'Burnt-top cheesecake with bright yuzu curd.', ['veg', 'gf'], 0, 390, ['fresh', 'indulge'], 55),
  dish('m12', 'Matcha Tiramisu', 'Desserts', 11, '🍵', 'Ceremonial matcha, mascarpone cloud, black sesame crumb.', ['veg'], 0, 410, ['indulge', 'adventure'], 130),
  dish('m13', 'Smoked Old Fashioned', 'Drinks', 15, '🥃', 'Bourbon, demerara, orange bitters, served under smoke.', [], 0, 170, ['indulge'], 35),
  dish('m14', 'Lychee Rose Spritz', 'Drinks', 12, '🍹', 'Lychee, rose, prosecco and a whisper of lime.', ['vegan'], 0, 150, ['fresh', 'adventure'], 330),
  dish('m15', 'Cold Brew Tonic', 'Drinks', 7, '☕', 'Nitro cold brew over tonic and orange peel.', ['vegan', 'gf'], 0, 20, ['fresh'], 45),
  dish('m16', 'Mango Lassi', 'Drinks', 6, '🥭', 'Alphonso mango, yogurt, cardamom.', ['veg', 'gf'], 0, 210, ['comfort', 'fresh'], 45),
];

export const promos = [
  { code: 'EMBER10', type: 'pct', value: 10, label: '10% off' },
  { code: 'WELCOME5', type: 'flat', value: 5, label: '$5 off' },
];
