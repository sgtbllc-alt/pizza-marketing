export type MenuCategory = 'classic' | 'specialty';

export interface MenuItem {
  name: string;
  description: string;
  category: MenuCategory;
  /** Path under public/, e.g. `menu/the-everest.jpg`. Defaults to `menu/<slug>.jpg`. */
  image?: string;
  isNew?: boolean;
}

/** Section order and names follow the Mountain Mike's main menu (mountainmikespizza.com/menu). */
export const MENU_CATEGORIES: readonly { id: MenuCategory; heading: string }[] = [
  { id: 'classic', heading: 'The Classics' },
  { id: 'specialty', heading: 'Specialty pizzas' },
];

export function menuSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function menuImage(item: MenuItem): string {
  return item.image ?? `menu/${menuSlug(item.name)}.jpg`;
}

export const MENU_ITEMS: readonly MenuItem[] = [
  // The Classics (same order as mountainmikespizza.com/menu)
  {
    name: 'GarlicParm Stuft Pizza',
    description:
      'Fresh dough with a mozzarella-filled rolled edge, brushed with garlic herb sauce and dusted with parmesan.',
    category: 'classic',
  },
  {
    name: "Nashville Hot N' Swicy Pizza",
    description:
      'Nashville Hot chicken, crunchy onion, pickles and cabbage slaw on garlic white sauce, drizzled with hot honey.',
    category: 'classic',
  },
  {
    name: 'Legendary Pepperoni',
    description: 'Curly pepperoni on red sauce and mozzarella.',
    category: 'classic',
  },
  { name: 'Classic Cheese', description: 'Red sauce and whole milk mozzarella.', category: 'classic' },
  { name: 'Create Your Own', description: 'Choose your crust, sauce and toppings.', category: 'classic' },

  // Specialty pizzas (same order as mountainmikespizza.com/menu)
  { name: 'The Everest', description: 'The classic combination pizza.', category: 'specialty' },
  {
    name: 'Pikes Peak',
    description:
      'All-meat combo of Italian sausage, pepperoni, beef, salami, linguica and ham on classic red sauce.',
    category: 'specialty',
  },
  { name: 'Mt. Veggiemore', description: 'The vegetarian pizza.', category: 'specialty' },
  {
    name: 'Chicken Club',
    description: 'Grilled chicken, bacon, tomatoes and green onion on garlic sauce.',
    category: 'specialty',
  },
  { name: 'Snowy Alps', description: 'The garlic combination pizza.', category: 'specialty' },
  {
    name: 'The McKinley',
    description:
      'Pepperoni, Italian sausage, mushrooms, black olives, bell peppers, onions and diced tomatoes on red sauce.',
    category: 'specialty',
  },
  {
    name: 'Pineapple Chicken Luau',
    description: 'Chicken, bacon and pineapple on BBQ sauce.',
    category: 'specialty',
  },
  {
    name: 'BBQ at the Ranch',
    description: 'Chicken, bacon, tomatoes and onions on BBQ sauce with a ranch drizzle.',
    category: 'specialty',
  },
  {
    name: 'Spicy Himalayan Pizza',
    description:
      'Tikka Masala chicken, mushrooms, onions, jalapenos and mozzarella on Tikka Masala sauce, topped with cilantro.',
    category: 'specialty',
  },
  {
    name: 'Vegetarian Spicy Himalayan Pizza',
    description: 'Mushrooms, onions, jalapenos, mozzarella and cilantro on Tikka Masala sauce.',
    category: 'specialty',
  },
  {
    name: 'Robbers Roost',
    description: 'The garlic chicken combination pizza.',
    category: 'specialty',
  },
  {
    name: "Sizzlin' Bacon Classic",
    description: 'Bacon, ham, mushrooms, olives and green onions on creamy garlic sauce.',
    category: 'specialty',
  },
  { name: 'Garlic Tuscan', description: '', category: 'specialty', isNew: true },
];
