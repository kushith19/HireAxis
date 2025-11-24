import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { APPLICATION_API_END_POINT } from "../utils/constant";
import { setAllAppliedJobs } from "../redux/jobSlice";

const useGetAppliedJobs = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  
  useEffect(() => {
    // Only fetch if user is authenticated
    if (!user) {
      dispatch(setAllAppliedJobs([]));
      return;
    }
    
    dispatch(setAllAppliedJobs([]));
    const fetchAppliedJobs = async () => {
      try {
        const res = await axios.get(`${APPLICATION_API_END_POINT}/getappliedjobs`, {
          withCredentials: true,
        });
       console.log(res.data);
       
        if (res.data.success) {
          dispatch(setAllAppliedJobs(res.data.applications))
        }
      } catch (error) {
        // Silently handle 401/404 errors - they're expected when user is not authenticated
        if (error.response?.status === 401 || error.response?.status === 404) {
          // User not authenticated or route not found - expected behavior
          return;
        }
        console.log(error);
      }
    };
    fetchAppliedJobs();
  }, [user, dispatch]);
};
export default useGetAppliedJobs;