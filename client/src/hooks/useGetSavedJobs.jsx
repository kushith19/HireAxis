import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { USER_API_END_POINT } from "../utils/constant";
import { setSavedJobs } from "../redux/jobSlice";

const useGetSavedJobs = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);

  useEffect(() => {
    if (!user) {
      dispatch(setSavedJobs([]));
      return;
    }

    const fetchSavedJobs = async () => {
      try {
        const res = await axios.get(`${USER_API_END_POINT}/saved-jobs`, {
          withCredentials: true,
        });

        if (res.data.success) {
          dispatch(setSavedJobs(res.data.savedJobs || []));
        }
      } catch (error) {
        if (error.response?.status === 401) {
          dispatch(setSavedJobs([]));
          return;
        }
        console.error("Error fetching saved jobs:", error);
      }
    };

    fetchSavedJobs();
  }, [user, dispatch]);
};

export default useGetSavedJobs;

