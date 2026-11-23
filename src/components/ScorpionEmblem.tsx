interface ScorpionEmblemProps {
  className?: string;
}

export const BRAND_PROFILE_IMAGE = '/assets/aistudio/Proyek_Baru_20__396E1FC__26d48dd7.png';

export function ScorpionEmblem({ className = 'h-5 w-5' }: ScorpionEmblemProps) {
  return (
    <img
      src={BRAND_PROFILE_IMAGE}
      alt=""
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full border border-violet-500/40 bg-[#130D21] p-0.5 object-contain ${className}`}
    />
  );
}
