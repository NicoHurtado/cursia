import { Halo } from '@/components/landing/Halo';
import { Hero } from '@/components/landing/Hero';
import { PromptInput } from '@/components/landing/PromptInput';
import Image from 'next/image';

export default function HomePage() {
  return (
    <>
      {/* Background halo */}
      <Halo />

      {/* Hero section with integrated animation */}
      <section id="inicio">
        <Hero />
      </section>

      {/* Create your own course section */}
      <section className="py-2">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em]">
              Ahora es tu turno. Crea tu propio curso
            </h2>
            <p className="text-lg text-muted-foreground">
              Ahora es tu turno. Escribe tu prompt y genera un curso
              personalizado en minutos.
            </p>
            <PromptInput />

            {/* Cursi Landing Image - Just below the input */}
            <div className="flex justify-center -mt-16">
              <div className="relative w-[24rem] h-[24rem] flex items-start justify-center">
                <Image
                  src="/cursi_landing.png?v=2"
                  alt="Cursi mascot"
                  width={600}
                  height={600}
                  className="object-bottom object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
