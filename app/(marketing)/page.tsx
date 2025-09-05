import { Halo } from '@/components/landing/Halo';
import { Hero } from '@/components/landing/Hero';
import { PromptInput } from '@/components/landing/PromptInput';
import { Roadmap } from '@/components/landing/Roadmap';
import { ReviewsCarousel } from '@/components/landing/ReviewsCarousel';

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
      <section className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em]">
              Crea tu propio curso
            </h2>
            <p className="text-lg text-muted-foreground">
              Ahora es tu turno. Escribe tu prompt y genera un curso
              personalizado en minutos.
            </p>
            <PromptInput />
          </div>
        </div>
      </section>

      {/* Roadmap section */}
      <Roadmap />

      {/* Reviews Carousel */}
      <ReviewsCarousel />
    </>
  );
}
