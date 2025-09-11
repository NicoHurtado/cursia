'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TypedExamples } from './TypedExamples';
import { CourseFunnelModal } from './CourseFunnelModal';

export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleSubmit = () => {
    if (session?.user) {
      // User is already logged in, go directly to course creation
      const encodedPrompt = encodeURIComponent(prompt);
      const url = prompt
        ? `/dashboard/create-course?prompt=${encodedPrompt}`
        : '/dashboard/create-course';
      router.push(url);
    } else {
      // User is not logged in, show funnel modal
      setShowFunnelModal(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <>
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Ghost text overlay */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none z-10">
          <TypedExamples isUserTyping={prompt.length > 0} />
        </div>

        {/* Input container */}
        <div className="relative flex items-center h-16 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.25)] transition-all duration-200 hover:shadow-[0_15px_50px_-20px_rgba(0,0,0,0.3)]">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder=""
            className="flex-1 h-full px-4 pr-20 bg-transparent border-0 outline-none text-foreground placeholder:text-transparent focus:outline-none"
            aria-label="Escribe tu prompt para generar un curso"
          />

          <Button
            onClick={handleSubmit}
            size="lg"
            className="absolute right-2 h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
            aria-label="Crear curso con el prompt ingresado"
          >
            <span className="hidden sm:inline">Crear mi curso</span>
            <span className="sm:hidden">Crear</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Funnel Modal */}
      <CourseFunnelModal
        isOpen={showFunnelModal}
        onClose={() => setShowFunnelModal(false)}
        initialPrompt={prompt}
      />
    </>
  );
}
