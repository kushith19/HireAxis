import React, { useState } from "react";
import axios from "axios";

import { USER_API_END_POINT } from "../utils/constant";

// Component imports (using placeholders for imports outside of Node_modules)
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; 
import { toast } from "sonner"; 
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector } from "react-redux";

const setUser = (user) => ({ type: 'auth/setUser', payload: user }); // Placeholder function

// Helper function to convert skills array to comma-separated string for the form input
const formatSkillsForInput = (skillsArray) => {
    return skillsArray?.length > 0 ? skillsArray.join(", ") : "";
};

const UpdateProfile = ({ open, setOpen }) => {
    const [loading, setLoading] = useState(false);
    const authState = useSelector((state) => state.auth) || {};
    const user = authState.user || {}; 
    const dispatch = useDispatch();

    const [input, setInput] = useState({
        fullname: user?.fullname || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        bio: user?.profile?.bio || "",
        skills: formatSkillsForInput(user?.profile?.skills), 
        file: null, // Holds the new resume file object
    });

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setInput({ ...input, file: e.target.files[0] });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        
        // Append standard fields
        formData.append("fullname", input.fullname);
        formData.append("email", input.email);
        formData.append("phoneNumber", input.phoneNumber);
        formData.append("bio", input.bio);

        // Determine which endpoint to hit
        const filePresent = !!input.file;
        const endpoint = filePresent
            ? `${USER_API_END_POINT}/profile/update-ml` // ML-ENABLED ENDPOINT
            : `${USER_API_END_POINT}/profile/update`;    // Standard update endpoint

        // If file is NOT present, send the manually edited skills string
        if (!filePresent) {
            formData.append("skills", input.skills);
        } else {
            // FIX: Use 'file' to match singleUpload middleware configuration (Standard Multer Field)
            formData.append("file", input.file); 
        }
        
        // --- Authentication Fix: Inject Token into Headers ---
        // Assuming your token is available here
        const token = authState.token || localStorage.getItem('userToken'); 

        const headers = {
            "Content-Type": "multipart/form-data",
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`; 
        }


        try {
            const res = await axios.post(
                endpoint,
                formData,
                {
                    headers: headers,
                    withCredentials: true,
                }
            );

            if (res.data?.success) {
                const updatedUser = res.data.user;
                dispatch(setUser(updatedUser)); 
                
                if (filePresent && res.data?.skillsExtracted) {
                    toast.success("Profile & Resume updated! Skills automatically extracted.");
                } else {
                    toast.success("Profile updated successfully");
                }
            }
        } catch (error) {
            console.error("Update Error:", error);
            // Provide specific feedback for the authentication failure
            if (error.response && error.response.status === 401) {
                 toast.error("Session expired or unauthorized. Please log out and log in again.");
            } else {
                toast.error(error?.response?.data?.message || "Something went wrong during update.");
            }
        } finally {
            setLoading(false);
            setOpen(false); 
        }
    };

    return (
        <div>
            <Dialog open={open}>
                <DialogContent
                    className="sm:max-w-[425px]"
                    onInteractOutside={() => setOpen(false)}
                    onEscapeKeyDown={() => setOpen(false)}
                >
                    <DialogHeader>
                        <DialogTitle>Update Profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Uploading a resume will automatically extract your skills.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitHandler}>
                        <div className="grid gap-4 py-4">
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" type="text" name="fullname" value={input.fullname} onChange={changeEventHandler} className="col-span-3"></Input>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="PhoneNumber" className="text-right">PhoneNumber</Label>
                                <Input id="PhoneNumber" type="text" name="phoneNumber" value={input.phoneNumber} onChange={changeEventHandler} className="col-span-3"></Input>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" type="email" name="email" value={input.email} onChange={changeEventHandler} className="col-span-3"></Input>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="bio" className="text-right">Bio</Label>
                                <Input id="bio" name="bio" value={input.bio} onChange={changeEventHandler} className="col-span-3"></Input>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="skills" className="text-right">Skills</Label>
                                <Input
                                    id="skills"
                                    name="skills"
                                    placeholder="Comma-separated (e.g., Python, React, SQL)"
                                    value={input.skills}
                                    onChange={changeEventHandler}
                                    className="col-span-3"
                                ></Input>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="file" className="text-right">Resume</Label>
                                <Input
                                    id="file"
                                    name="file"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="col-span-3"
                                ></Input>
                            </div>
                        </div>
                        <DialogFooter>
                            {loading ? (
                                <Button disabled className="w-full bg-zinc-700 text-white font-medium rounded-lg py-2 transition-all">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg py-2 transition-all"
                                >
                                    Update Profile
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UpdateProfile;