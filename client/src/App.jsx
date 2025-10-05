import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import NavBar from './components/shared/NavBar'
import Login from './components/auth/Login'
import SignUp from './components/auth/SignUp'
import Home from './components/Home'
import Jobs from './components/Jobs';
import Discover from './components/Discover';
import Profile from './components/Profile';
import JobDescription from './components/JobDescription';
import ProtectedRoute from './components/ProtectedRoute';
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
