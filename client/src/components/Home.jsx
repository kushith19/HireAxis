import React from 'react'
import NavBar from './shared/NavBar'
import HeroSection from './HeroSection'
import CategoryCarousel from './CategoryCarousel'
import LatestJobs from './LatestJobs'
import Footer from './shared/Foter'

const Home=() =>{
  return (
    <div>
      <NavBar></NavBar>
      <HeroSection/>
      <CategoryCarousel></CategoryCarousel>
      <LatestJobs/>
      <Footer/>
    </div>
  )
}

export default Home
