import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Video, CheckCircle, AlertTriangle } from "lucide-react";
import { INTERVIEW_TEST_API_END_POINT, OLLAMA_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/redux/authSlice";
import axios from "axios";

const DEFAULT_QUESTIONS = [
  "Tell me about yourself and your professional background.",
  "Describe a challenging project and how you handled it.",
  "Why are you interested in this role?"
];

const TakeTestModal = ({ isOpen, onClose, skills = [] }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth) || {};
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [step, setStep] = useState("permissions"); // permissions | ready | questions | summary
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const resetState = useCallback(() => {
    setStep("permissions");
    setIsRequestingPermissions(false);
    setPermissionError("");
    setCurrentQuestionIndex(0);
    setIsUploading(false);
    setAnalysisResult(null);
    setRecordedBlob(null);
    setQuestions(DEFAULT_QUESTIONS);
    setIsLoadingQuestions(false);
    recordedChunksRef.current = [];
  }, []);

  // Fetch questions from Ollama when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!user) {
        toast.error("Please log in to take the test");
        onClose();
        return;
      }
      // Skills will be fetched from backend based on user profile
      fetchQuestions();
    }
  }, [isOpen, user]);

  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const response = await axios.post(
        `${OLLAMA_API_END_POINT}/generate-questions`,
        { skills }, // Skills passed as fallback, backend will use user profile
        {
          headers: {
            "Content-Type": "application/json"
          },
          withCredentials: true
        }
      );

      if (response.data.success && Array.isArray(response.data.questions) && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
      } else {
        // Fallback to default questions
        setQuestions(DEFAULT_QUESTIONS);
        if (response.data.warning) {
          console.warn(response.data.warning);
        }
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      // Fallback to default questions
      setQuestions(DEFAULT_QUESTIONS);
      if (error.response?.status === 401) {
        toast.error("Please log in to take the test");
        onClose();
      } else {
        toast.error("Failed to generate questions. Using default questions.");
      }
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const cleanupMedia = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanupMedia();
      resetState();
    }
  }, [isOpen, cleanupMedia, resetState]);

  const requestPermissions = async () => {
    if (isRequestingPermissions) return;
    setIsRequestingPermissions(true);
    setPermissionError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep("ready");
    } catch (err) {
      console.error("Permission error:", err);
      setPermissionError(
        "Camera and microphone permissions are required to take the test."
      );
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) {
      toast.error("Camera stream not available. Please allow permissions again.");
      setStep("permissions");
      return;
    }

    // Ensure video element continues to show the stream
    if (videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: "video/webm;codecs=vp9,opus"
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: "video/webm"
      });
      setRecordedBlob(blob);
      // Stop the stream tracks after recording is done
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setStep("questions");
    setCurrentQuestionIndex(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      stopRecording();
      setStep("summary");
    }
  };

  const handleRetake = async () => {
    stopRecording();
    setRecordedBlob(null);
    setAnalysisResult(null);
    setCurrentQuestionIndex(0);
    
    // Clean up old stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Fetch new questions for retake
    setIsLoadingQuestions(true);
    try {
      await fetchQuestions();
    } catch (error) {
      console.error("Error fetching new questions on retake:", error);
      // Continue anyway with existing questions
    } finally {
      setIsLoadingQuestions(false);
    }
    
    // Re-request camera permissions to restart the stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep("ready");
    } catch (err) {
      console.error("Permission error on retake:", err);
      setStep("permissions");
      setPermissionError("Camera and microphone permissions are required to retake the test.");
    }
  };

  const sendToFacialAnalysis = async () => {
    if (!recordedBlob) {
      toast.error("Recording not found. Please retake the test.");
      return;
    }
    if (!user) {
      toast.error("Please log in to submit the test");
      return;
    }
    
    setIsUploading(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("video", recordedBlob, `interview-${Date.now()}.webm`);
      formData.append("questions", JSON.stringify(questions));

      const response = await axios.post(
        `${INTERVIEW_TEST_API_END_POINT}/analyze`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          withCredentials: true,
          timeout: 300000 // 5 minutes timeout for video processing
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || "Analysis failed");
      }
      
      console.log("Analysis result:", response.data.data);
      setAnalysisResult(response.data.data);
      
      // Update user in Redux if updated user is returned
      if (response.data.user) {
        dispatch(setUser(response.data.user));
      }
      
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        toast.error("Please log in to submit the test");
        onClose();
      } else {
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Failed to send recording for analysis. Please try again later."
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const renderPermissionsStep = () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600">
        We need access to your camera and microphone to conduct the assessment.
        No recording will leave your device until you explicitly upload it.
      </p>
      {permissionError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {permissionError}
        </div>
      )}
      <Button onClick={requestPermissions} disabled={isRequestingPermissions}>
        {isRequestingPermissions ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Requesting permissions...
          </>
        ) : (
          "Allow Camera & Microphone"
        )}
      </Button>
    </div>
  );

  const renderReadyStep = () => (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-200 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 bg-black object-cover"
        />
      </div>
      {isLoadingQuestions ? (
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating questions...
        </div>
      ) : (
        <p className="text-sm text-zinc-600">
          When you are ready, click start. You will be asked 3 questions tailored
          to your skills. Answer each one before moving to the next.
        </p>
      )}
      <Button 
        onClick={startRecording} 
        className="bg-blue-600 hover:bg-blue-700"
        disabled={isLoadingQuestions}
      >
        <Video className="mr-2 h-4 w-4" />
        {isLoadingQuestions ? "Preparing..." : "Start Test"}
      </Button>
    </div>
  );

  // Ensure video stream stays attached during recording
  useEffect(() => {
    if (step === "questions" && videoRef.current && mediaStreamRef.current) {
      if (!videoRef.current.srcObject) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
    }
  }, [step, currentQuestionIndex]);

  const renderQuestionStep = () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover"
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-zinc-800">
          {questions[currentQuestionIndex]}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleNextQuestion}>
          {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );

  const renderSummaryStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <p className="text-sm font-medium">Recording completed</p>
      </div>

      <video
        controls
        className="w-full rounded-lg border border-zinc-200"
        src={recordedBlob ? URL.createObjectURL(recordedBlob) : undefined}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={handleRetake} className="sm:flex-1">
          Retake Test
        </Button>
        <Button
          onClick={sendToFacialAnalysis}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700 sm:flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload for Analysis"
          )}
        </Button>
      </div>
      
      {isUploading && (
        <div className="text-sm text-zinc-600 text-center">
          Processing your interview. This may take a moment...
        </div>
      )}
      
      {analysisResult && (
        <div className="text-sm text-green-600 text-center">
          Analysis completed! Your results have been saved to your profile.
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case "permissions":
        return renderPermissionsStep();
      case "ready":
        return renderReadyStep();
      case "questions":
        return renderQuestionStep();
      case "summary":
        return renderSummaryStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Practice Interview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">{renderStep()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default TakeTestModal;

