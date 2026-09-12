import { images } from './images.js'

export const heroContent = {
  eyebrow: 'Rooted in Wellness',
  title: 'Pure Native Goodness, Delivered Fresh Every Day.',
  copy: 'Organic staples, authentic masalas, traditional sweets and wholesome daily meals — crafted with love and tradition.',
  cta: 'Shop Now',
  ctaTo: '/shop',
  image: images.hero,
  imageAlt: 'Aerial view of lush green farmland',
}

export const stats = [
  { value: '50+', label: 'Products', dummy: true },
  { value: '500+', label: 'Happy Customers', dummy: true },
  { value: '100%', label: 'Natural', dummy: true },
  { value: '2', label: 'Storefronts', dummy: true },
]

export const housesIntro = {
  eyebrow: 'Explore SV Hub',
  title: 'Two Houses, One Commitment to Goodness.',
  copy: 'Explore traditional foods and handmade natural care, thoughtfully brought together.',
}

export const featuredIntro = {
  eyebrow: 'Handpicked For You',
  title: 'Staples for every day.',
  copy: 'Explore a few of our everyday favourites, rooted in traditional ingredients and made for modern homes.',
  cta: 'Explore All Products',
  ctaTo: '/shop',
}

export const editorial = {
  label: 'Our Story',
  year: '2026',
  origin: 'Coimbatore',
  themes: [
    { number: '01', label: 'Organic Farming' },
    { number: '02', label: 'Native Grains' },
    { number: '03', label: 'Traditional Methods' },
  ],
  headline: 'From the grain to the table.',
  storyTitle: 'From Farm to Home.',
  storyCopy:
    'From indigenous grains to traditional recipes, SV Hub brings the goodness of our roots into modern homes — grown with care, made by hand, and meant for everyday tables.',
  storyCta: 'Discover Our Story',
  storyTo: '/about',
  grid: [
    { src: images.rice, alt: 'Native rice grains in a traditional brass vessel' },
    {
      src: images.cooking,
      alt: 'Idiyappam with egg roast and filter coffee served on a banana leaf',
      featured: true,
    },
    { src: images.ingredients, alt: 'South Indian spices, turmeric, mustard and dried chillies' },
    {
      src: images.farmer,
      alt: 'A farmer gathering harvested paddy in a rural field',
      wide: true,
    },
  ],
}

export const categoryIntro = {
  eyebrow: 'Shop by Category',
  title: 'Find Goodness Your Way.',
  copy: 'Organic staples, traditional recipes, and handmade care — grouped the way our kitchens and homes use them.',
}

export const grownIntro = {
  eyebrow: 'From Farm to Home',
  title: 'Grown with care. Meant for the kitchen.',
  copy: 'From indigenous grains to traditional recipes, SV Hub brings the goodness of our roots into modern homes — grown with care, made by hand, and meant for everyday tables.',
  principles: [
    { number: '01', title: 'Native grains', copy: 'Native ingredients and recipes rooted in our heritage.' },
    { number: '02', title: 'Traditional methods', copy: 'Simple ingredients and traditional methods.' },
    { number: '03', title: 'Everyday tables', copy: 'Sourced with care and brought closer to your kitchen.' },
  ],
}

export const whyIntro = {
  eyebrow: 'Why SV Hub',
  title: 'The SV Hub Promise',
  copy: 'Goodness begins with what goes into every product — and the care behind it.',
}

export const whyItems = [
  {
    number: '01',
    title: 'From Farm to Home',
    copy: 'Sourced with care and brought closer to your kitchen.',
  },
  {
    number: '02',
    title: 'Pure by Nature',
    copy: 'Simple ingredients and traditional methods.',
  },
  {
    number: '03',
    title: 'Traditional Goodness',
    copy: 'Native ingredients and recipes rooted in our heritage.',
  },
  {
    number: '04',
    title: 'Sustainable Living',
    copy: 'Supporting conscious choices for homes and communities.',
  },
]

export const finalCta = {
  eyebrow: 'Taste of Tradition',
  headline: 'Bring Native Goodness Home.',
  copy: 'Explore traditional foods and handmade self-care products rooted in the goodness of our traditions.',
  primary: { label: 'Shop All Products', to: '/shop' },
  secondary: { label: 'Our Story', to: '/about' },
}
