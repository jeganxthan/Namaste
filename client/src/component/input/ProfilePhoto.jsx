import React, { useRef, useState, useEffect } from "react";
import { Pen, Trash } from "lucide-react";

const DEFAULT_IMAGE = "/profilepic.png"; 

const ProfilePhoto = ({ image, setImage }) => {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (image) {
      const objectUrl = URL.createObjectURL(image);
      setPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl); 
    } else {
      setPreview(null);
    }
  }, [image]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file); 
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const triggerFileInput = () => {
    inputRef.current.click();
  };

  return (
    <div className="flex justify-center items-center mt-6">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      <div className="relative w-[100px] h-[100px]">
        <img
          src={preview || DEFAULT_IMAGE}
          alt="Profile"
          className="w-full h-full rounded-full object-cover border border-gray-300"
        />

        <button
          type="button"
          onClick={triggerFileInput}
          className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full shadow"
        >
          <Pen size={14} className="text-white" />
        </button>

        {image && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-0 right-0 bg-red-100 text-red-500 p-1.5 rounded-full shadow"
          >
            <Trash size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePhoto;
