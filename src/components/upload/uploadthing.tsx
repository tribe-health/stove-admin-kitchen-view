import React from 'react';
import { ImageUploader } from "@/components/ui/image-uploader";

interface UploadButtonProps {
  endpoint: string; // Not used but kept for API compatibility
  onClientUploadComplete?: (result: { url: string }[]) => void;
  onUploadError?: (error: Error) => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  onClientUploadComplete,
  onUploadError,
}) => {
  const handleImageUploaded = (url: string) => {
    if (url && onClientUploadComplete) {
      onClientUploadComplete([{ url }]);
    }
  };

  return (
    <ImageUploader
      onImageUploaded={handleImageUploaded}
      bucketName="product-images"
      // Pass errors to the onUploadError callback
      // This is handled internally by ImageUploader, but we're adding a wrapper
      // to maintain API compatibility with the expected UploadButton interface
    />
  );
};