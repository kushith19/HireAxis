import React, { useEffect } from "react";
import NavBar from "../shared/NavBar";
import ApplicantsTable from "./ApplicantsTable";
import { APPLICATION_API_END_POINT } from "../../utils/constant";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAllApplicants } from "../../redux/applicationSlice";

const Applicants = () => {
  const params = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAllApplicants = async () => {
      try {
        const res = await axios.get(
          `${APPLICATION_API_END_POINT}/${params.id}/applicants`,
          { withCredentials: true }
        );

        if (res.data.success) {
          dispatch(setAllApplicants(res.data.job));
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchAllApplicants();
  }, [dispatch, params.id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100">
      <NavBar />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-24 pb-16">
        <ApplicantsTable />
      </div>
    </div>
  );
};

export default Applicants;
