'use client';

import { useState, useEffect } from 'react';

const examples = [
  'Curso de Python desde cero en 7 días',
  'Fundamentos de Kubernetes para backend',
  'UX Writing para marketing digital',
  'Entrevista técnica: algoritmos y estructuras',
  'Finanzas personales para universitarios',
];

interface TypedExamplesProps {
  isUserTyping?: boolean;
}

export function TypedExamples({ isUserTyping = false }: TypedExamplesProps) {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Clear text and pause animation when user is typing
    if (isUserTyping) {
      setCurrentText('');
      return;
    }

    const currentExample = examples[currentExampleIndex];

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 1200);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentText.length < currentExample.length) {
            setCurrentText(currentExample.slice(0, currentText.length + 1));
          } else {
            setIsPaused(true);
          }
        } else {
          if (currentText.length > 0) {
            setCurrentText(currentText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentExampleIndex(prev => (prev + 1) % examples.length);
          }
        }
      },
      isDeleting ? 25 : 45
    );

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, isPaused, currentExampleIndex, isUserTyping]);

  // Check for reduced motion preference
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldAnimate(!mediaQuery.matches);
  }, []);

  if (!shouldAnimate) {
    return <span className="text-muted-foreground/60">{examples[0]}</span>;
  }

  return (
    <span className="text-muted-foreground/60" aria-live="polite">
      {currentText}
      <span className="animate-blink">|</span>
    </span>
  );
}
