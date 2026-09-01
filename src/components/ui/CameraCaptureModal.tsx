"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Camera, X, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
  guideType?: "face" | "clothing" | "general";
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Take Photo",
  guideType = "face",
}: CameraCaptureModalProps) {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Start Camera Stream
  const startCamera = async (mode: "user" | "environment") => {
    setIsLoadingCamera(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Please check your camera permissions.");
      }
    } finally {
      setIsLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Take Snapshot
  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, flip horizontally for natural mirror effect
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="w-full max-w-lg my-auto rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] space-y-4 p-5 sm:p-6"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {capturedImage ? "Review your photo" : "Align and snap your picture"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-[var(--border)]">
          {cameraError ? (
            <div className="p-6 text-center text-white space-y-3">
              <AlertCircle className="w-10 h-10 text-[var(--error)] mx-auto" />
              <p className="text-sm font-medium text-red-200">{cameraError}</p>
              <Button variant="outline" size="sm" onClick={() => startCamera(facingMode)}>
                Try Again
              </Button>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Viewfinder Overlay Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {guideType === "face" && (
                  <div className="w-48 h-60 sm:w-56 sm:h-72 rounded-[50%] border-2 border-dashed border-white/60 shadow-lg" />
                )}
                {guideType === "clothing" && (
                  <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-dashed border-white/60 shadow-lg" />
                )}
              </div>

              {/* Flip Camera Button */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/20 transition-all shadow-md"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {capturedImage ? (
            <>
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 py-3 text-xs sm:text-sm font-bold min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Retake Photo
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                className="flex-1 py-3 text-xs sm:text-sm font-bold min-h-[44px]"
              >
                <Check className="w-4 h-4 mr-1.5" /> Use This Photo
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={onClose}
                className="px-4 py-3 text-xs sm:text-sm min-h-[44px]"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleSnap}
                disabled={Boolean(cameraError) || isLoadingCamera}
                className="flex-1 py-3 px-6 rounded-2xl bg-[var(--primary)] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-95 transition-all min-h-[44px] disabled:opacity-50"
              >
                <Camera className="w-5 h-5" /> Take Picture
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
