import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import NavBar from './components/shared/NavBar'
import Login from './components/auth/Login'
import SignUp from './components/auth/SignUp'
import Home from './components/Home'
import Jobs from './components/Jobs';
import Discover from './components/Discover';
import Profile from './components/Profile';
import JobDescription from './components/JobDescription';
import Companies from './components/admin/Companies';
import ProtectedRoute from './components/ProtectedRoute';
import CompanyCreate from './components/admin/CompanyCreate';
import CompanySetup from './components/admin/CompanySetup';
import AdminJobs from './components/admin/AdminJobs';
import PostJob from './components/admin/PostJob';
import Applicants from './components/admin/Applicants';
const appRouter=createBrowserRouter([
  {
    path:'/',
    element:<Home/>
  },
  {
    path:'/login',
    element:<Login/>
  },
  {
    path:'/signup',
    element:<SignUp/>
  },
  {
    path:'/jobs',
    element:<Jobs/>
  },
  {
    path:'description/:id',
    element:<JobDescription/>
  },
  {
    path:'/discover',
    element:<Discover/>
  },
  {
    path:'/profile',
    element:<ProtectedRoute><Profile/></ProtectedRoute>
  },
  //Adimn routes
  {
    path:'/admin/companies',
    element:<ProtectedRoute><Companies/></ProtectedRoute> 
  },
  {
    path:'/admin/companies/create',
    element:<ProtectedRoute><CompanyCreate></CompanyCreate></ProtectedRoute> 
  },               
  {
    path:'/admin/jobs/create',
    element:<ProtectedRoute><PostJob/></ProtectedRoute> 
  },
  {
    path:'/admin/companies/:id',
    element:<ProtectedRoute><CompanySetup></CompanySetup></ProtectedRoute> 
  },
  {
    path:'/admin/jobs/:id/applicants',
    element:<ProtectedRoute><Applicants></Applicants></ProtectedRoute> 
  },
  {
    path:'/admin/jobs',
    element:<ProtectedRoute><AdminJobs/></ProtectedRoute> 
  }
  
])
function App() {
 

  return (
    <>
      <RouterProvider router={appRouter}></RouterProvider>
    </>
  )
}

export default App
