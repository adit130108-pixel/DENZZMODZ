import { useState } from 'react';
import { BRAND_PROFILE_IMAGE } from './ScorpionEmblem';

interface EditorialMediaFrameProps {
  src?: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function EditorialMediaFrame({
  src = BRAND_PROFILE_IMAGE,
  alt,
  caption,
  className = '',
}: EditorialMediaFrameProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <figure
      className={`relative overflow-hidden rounded-2xl border border-[#2B1E4A] bg-[radial-gradient(circle_at_50%_45%,rgba(124,58,237,0.22),#0D0818_75%)] ${className}`}
    >
      {!hasError ? (
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className="max-h-[320px] w-auto max-w-full object-contain drop-shadow-[0_12px_28px_rgba(124,58,237,0.35)]"
          />
        </div>
      ) : (
        <div className="flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#160E29] to-[#0B0714] p-8 text-center">
          <p className="text-sm font-medium text-[#C4BBD9]">{alt}</p>
        </div>
      )}
      {caption && (
        <figcaption className="border-t border-[#2B1E4A] bg-[#110B1E]/95 px-4 py-2.5 text-xs text-[#9B8EC2]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
