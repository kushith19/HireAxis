import React from 'react'
import NavBar from './shared/NavBar'
import HeroSection from './HeroSection'
import CategoryCarousel from './CategoryCarousel'
import LatestJobs from './LatestJobs'
import Footer from './shared/Foter'
import useGetAllJobs from '../hooks/useGetAllJobs'

const Home=() =>{
  useGetAllJobs();
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
