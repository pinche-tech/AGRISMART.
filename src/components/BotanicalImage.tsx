import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

interface BotanicalImageProps {
  src: string;
  alt: string;
  className?: string;
  caption?: string;
}

export const BotanicalImage: React.FC<BotanicalImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  caption,
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <figure className="relative w-full h-full overflow-hidden bg-[#EBE6DF]">
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={className}
        />
      ) : (
        <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#EBE6DF] to-[#D6CEBE] text-[#292524]">
          <Leaf className="w-10 h-10 text-[#14532D] mb-3 opacity-80" />
          <span className="font-display text-xl italic text-[#1C1917]">{alt}</span>
          <span className="text-xs font-sans-ui text-[#57534E] mt-1">
            Botanical Archive Plate
          </span>
        </div>
      )}
      {caption && (
        <figcaption className="text-xs font-serif-prose italic text-[#57534E] mt-2 px-1">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
