import heroFarm from '../assets/hero-farm.jpg'
import authKitchen from '../assets/auth-kitchen.jpg'
import nutriHero from '../assets/nutri-hero.jpg'
import ganeshArt from '../assets/ganesh-chaturthi-art.webp'

const pexels = (id, w) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

const unsplash = (id, w) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const images = {
  hero: heroFarm,
  ganeshArt,
  authKitchen,
  nutriHub: unsplash('photo-1673158191698-f1550a68c422', 1400),
  nutriHero,
  selfCare: pexels('6621464', 1400),
  farmland:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/A_colorful_Paddy_field.JPG/1280px-A_colorful_Paddy_field.JPG',
  farmer: pexels('29733497', 1200),
  rice: unsplash('photo-1673158191698-f1550a68c422', 1200),
  cooking: pexels('14132109', 1200),
  contactHero: authKitchen,
  ingredients: pexels('2802527', 1200),
  family: pexels('29733497', 1200),
  kullakar: unsplash('photo-1673158191698-f1550a68c422', 1000),
  kavuni: pexels('4110255', 1000),
  samba: pexels('4110256', 1000),
  thokku:
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Amla_Pickles.jpg',
  soap: pexels('1340116', 1000),
  nativeRice: pexels('4110256', 1200),
  pickles:
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Amla_Pickles.jpg',
  masalas: pexels('2802527', 1200),
  sweets: pexels('16062642', 1200),
  savouries: pexels('12865863', 1200),
  meals: pexels('5560763', 1200),
  handmadeSoaps: pexels('6621464', 1200),
  herbs: pexels('1172675', 900),
  hibiscus: pexels('33155255', 800),
  careHero: pexels('6621464', 1800),
  careLeaves: pexels('807598', 900),
  careIngredients: pexels('2802527', 900),
  carePrep: pexels('1340116', 1200),
  careTexture: pexels('6621463', 900),
  vettiver: pexels('6621463', 1000),
  kuppaimeni: pexels('1172675', 1000),
  kasthuriManjal: pexels('1340116', 1000),
  sweetBasil: pexels('4750274', 1000),
  multanimitti: pexels('6621464', 1000),
}
