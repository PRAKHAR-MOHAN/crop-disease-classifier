import React, { useRef } from "react";
import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CameraButtonProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export const CameraButton: React.FC<CameraButtonProps> = ({
  onCapture,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onCapture(e.target.files[0]);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md shadow-emerald-700/20 active:scale-95 transition min-h-[44px] disabled:opacity-50 cursor-pointer"
        aria-label={t("upload.cameraBtn")}
      >
        <Camera className="w-4 h-4" />
        <span>{t("upload.cameraBtn")}</span>
      </button>
    </>
  );
};
