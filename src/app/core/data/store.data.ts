export const STORE = {
  /** Public origin the site is served from. Used for canonical URLs, sitemap and share previews. */
  siteUrl: 'https://mountainmikes-southsj.com',
  name: "Mountain Mike's Pizza, San Jose",
  shortName: "Mountain Mike's San Jose",
  address: '4116 Monterey Road, San Jose, CA 95111',
  streetAddress: '4116 Monterey Road',
  city: 'San Jose',
  region: 'CA',
  postalCode: '95111',
  phoneE164: '+14086224755',
  phoneDisplay: '408-622-4755',
  phoneHref: 'tel:+14086224755',
  orderUrl: 'https://order.adorapos.net/?id=LBW27',
  heroHeading: "Best Pizza in San Jose – Mountain Mike's Pizza",
  heroSubtext: 'Tikka Masala, Custom Request, Specials for Parties, Catering, Fundraising support',
  promoFallback: 'Unlock 30% OFF Now!',
  /** Reward for turning on notifications. Shown in the pop-up, the status page and the in-store poster. */
  pushReward: {
    short: 'FREE soda',
    emoji: '🥤',
    /** Small print. Change to match how the store honours the offer. */
    terms: 'One free fountain soda per customer with any purchase. Show the green ✓ notification page at the counter.',
  },
} as const;
