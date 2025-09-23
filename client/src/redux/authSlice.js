import {createSlice} from "@reduxjs/toolkit";

const authSlice=createSlice({
  name:"auth",
  initialState:{
    loading:false,
    user:null
  },
  reducers:{
    //actions
    setLoading:(state,actions)=>{
      state.loading=actions.payload
    },
    setUser:(state,actions)=>{
      state.user=actions.payload
    }
  }
})

export const {setLoading,setUser}=authSlice.actions
export default authSlice.reducer;