import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitWordsForReveal } from '../utils/validation';

gsap.registerPlugin(ScrollTrigger);

interface WordRevealHeadingProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  immediate?: boolean;
}

export function WordRevealHeading({
  text,
  as = 'h2',
  className = '',
  immediate = false,
}: WordRevealHeadingProps) {
  const containerRef = useRef<HTMLHeadingElement | null>(null);
  const words = useMemo(() => splitWordsForReveal(text), [text]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || words.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const wordTargets = el.querySelectorAll<HTMLElement>('[data-word-inner]');
    if (wordTargets.length === 0) return;

    if (prefersReducedMotion) {
      gsap.set(wordTargets, { yPercent: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        wordTargets,
        {
          yPercent: 110,
          opacity: 0,
        },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.68,
          stagger: 0.055,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: el,
            start: immediate ? 'top 99%' : 'top 94%',
            once: true,
          },
        }
      );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [text, words, immediate]);

  const Tag = as;

  return (
    <Tag
      ref={containerRef}
      aria-label={text}
      className={`text-balance ${className}`}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true">
          <span className="inline-block overflow-hidden align-bottom py-[0.04em]">
            <span data-word-inner className="inline-block will-change-transform">
              {word}
            </span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
