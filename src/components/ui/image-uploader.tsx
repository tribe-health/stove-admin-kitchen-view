import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  initialImageUrl?: string;
  bucketName?: string;
}

export function ImageUploader({
  onImageUploaded,
  initialImageUrl,
  bucketName = "product-images"
}: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      // Generate a unique file name to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      onImageUploaded(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadImage(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleRemoveImage = () => {
    setImageUrl(null);
    onImageUploaded("");
  };

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors",
          "flex flex-col items-center justify-center text-center",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <div className="animate-pulse">
              <Upload className="h-10 w-10 text-muted-foreground" />
            </div>
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          )}
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragActive 
                ? "Drop the image here" 
                : isUploading 
                  ? "Uploading..." 
                  : "Drag & drop an image here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to select a file
            </p>
          </div>
        </div>
      </div>
      
      {error && <p className="text-sm text-red-500">{error}</p>}
      
      {imageUrl && (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Uploaded image"
            className="h-40 w-full object-cover rounded-md border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
