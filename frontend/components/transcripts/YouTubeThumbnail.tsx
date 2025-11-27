"use client";

import Image from "next/image";
import { useState } from "react";

interface YouTubeThumbnailProps {
  videoId: string;
  title: string;
  className?: string;
}

export default function YouTubeThumbnail({
  videoId,
  title,
  className = ""
}: YouTubeThumbnailProps) {
  const [imgSrc, setImgSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  );

  const handleError = () => {
    // Fallback to medium quality if high quality fails
    setImgSrc(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
  };

  return (
    <div className={`relative w-full aspect-video bg-gray-200 dark:bg-gray-700 ${className}`}>
      <Image
        src={imgSrc}
        alt={`Thumbnail for ${title}`}
        fill
        className="object-cover rounded-t-lg"
        onError={handleError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
