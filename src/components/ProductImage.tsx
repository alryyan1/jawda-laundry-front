import React, { useState } from "react";
import { Shirt, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  url?: string | null;
  alt: string;
  className?: string;
  isIconFallback?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  url,
  alt,
  className,
  isIconFallback = true,
}) => {
  const [hasError, setHasError] = useState(false);

  if (url && !hasError) {
    return (
      <img
        src={url}
        alt={alt}
        className={cn("", className)}
        onError={() => setHasError(true)}
      />
    );
  }

  // Fallback
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gray-100 text-gray-400",
        className,
      )}
    >
      {isIconFallback ? (
        <Shirt className="h-1/2 w-1/2" />
      ) : (
        <Package className="h-1/2 w-1/2" />
      )}
    </div>
  );
};
