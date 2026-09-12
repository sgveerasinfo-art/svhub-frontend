import HeroRenderer from './HeroRenderer.jsx'
import StatsStrip from './StatsStrip.jsx'
import Storefronts from './Storefronts.jsx'
import FeaturedProducts from './FeaturedProducts.jsx'
import EditorialStory from './EditorialStory.jsx'
import CategorySection from './CategorySection.jsx'
import WhySvHub from './WhySvHub.jsx'
import Testimonials from './Testimonials.jsx'
import FinalCta from './FinalCta.jsx'
import HomeScroll from './HomeScroll.jsx'
import './Home.css'

function Home() {
  return (
    <HomeScroll>
      <HeroRenderer />
      <StatsStrip />
      <Storefronts />
      <FeaturedProducts />
      <EditorialStory />
      <CategorySection />
      <WhySvHub />
      <Testimonials />
      <FinalCta />
    </HomeScroll>
  )
}

export default Home
