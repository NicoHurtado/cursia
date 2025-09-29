'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  Zap,
  BookOpen,
  Target,
  Sparkles,
  X,
} from 'lucide-react';

interface CardData {
  id: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryGameProps {
  onGameComplete?: () => void;
  courseProgress?: number;
  isCourseReady?: boolean;
  onCancelCreation?: () => void;
  isCancelling?: boolean;
}

const PROFESSION_IMAGES = [
  { id: 1, image: '/game/1.png', profession: 'Programador' },
  { id: 2, image: '/game/2.png', profession: 'Diseñador' },
  { id: 3, image: '/game/3.png', profession: 'Científico' },
  { id: 4, image: '/game/4.png', profession: 'Músico' },
  { id: 5, image: '/game/5.png', profession: 'Chef' },
  { id: 6, image: '/game/6.png', profession: 'Artista' },
];

// Curious facts, tips, and interesting data about learning
const learningFacts = [
  '🧠 El cerebro humano puede procesar 11 millones de bits de información por segundo, pero solo puede procesar conscientemente 40 bits.',
  '⚡ La técnica de espaciado puede mejorar la retención de información hasta en un 200% comparado con el estudio masivo.',
  '🎯 Los estudiantes que establecen objetivos específicos tienen 42% más probabilidades de alcanzarlos que aquellos con objetivos vagos.',
  '🔄 El efecto de repetición espaciada fue descubierto por Hermann Ebbinghaus en 1885 y sigue siendo la técnica más efectiva.',
  '🧘 La meditación de solo 10 minutos al día puede aumentar la concentración y reducir el estrés durante el estudio.',
  '🎵 La música instrumental puede mejorar el rendimiento cognitivo hasta en un 23% durante tareas complejas.',
  '🌙 El sueño REM es crucial para consolidar la memoria. Dormir 7-9 horas optimiza el aprendizaje.',
  '💡 El ejercicio físico aumenta la producción de BDNF, una proteína que mejora la neuroplasticidad cerebral.',
  '📝 Escribir a mano activa más áreas del cerebro que escribir en teclado, mejorando la retención.',
  '🎨 El uso de colores en notas puede mejorar la memoria hasta en un 55% comparado con texto monocromático.',
  '🤝 Enseñar a otros lo que aprendes puede aumentar tu comprensión hasta en un 90%.',
  '⏰ El momento óptimo para aprender nueva información es entre las 10 AM y 2 PM.',
  '🧩 Resolver puzzles y rompecabezas puede aumentar la capacidad de resolución de problemas en un 40%.',
  '💧 La deshidratación puede reducir la capacidad cognitiva hasta en un 15%. Mantente hidratado.',
  '🌱 El aprendizaje de nuevas habilidades físicas crea nuevas conexiones neuronales permanentes.',
];

// Course generation progress messages
const progressMessages = [
  'Ya casi está tu curso...',
  'Estamos ultimando detalles...',
  'Generando contenido...',
  'Buscando temas...',
  'Preparando lecciones...',
  'Organizando material...',
  'Creando experiencias únicas...',
  'Dándole el toque final...',
];

export function MemoryGame({
  onGameComplete,
  courseProgress,
  isCourseReady = false,
  onCancelCreation,
  isCancelling = false,
}: MemoryGameProps) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showAllCards, setShowAllCards] = useState(true);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [currentProgressIndex, setCurrentProgressIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReshuffling, setIsReshuffling] = useState(false);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  // Show all cards initially for 5 seconds
  useEffect(() => {
    if (cards.length > 0) {
      const timer = setTimeout(() => {
        setShowAllCards(false);
        setCards(prev => prev.map(card => ({ ...card, isFlipped: false })));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [cards.length]);

  // Rotate learning facts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % learningFacts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate progress messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProgressIndex(prev => (prev + 1) % progressMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Check if course is ready
  useEffect(() => {
    if (isCourseReady && onGameComplete) {
      onGameComplete();
    }
  }, [isCourseReady, onGameComplete]);

  const initializeGame = () => {
    // Create pairs of cards
    const cardPairs = [...PROFESSION_IMAGES, ...PROFESSION_IMAGES];
    const shuffledCards = cardPairs
      .map((card, index) => ({
        ...card,
        id: index,
        isFlipped: true, // Show initially
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setGameComplete(false);
    setShowAllCards(true);
    setIsReshuffling(false);
  };

  const reshuffleGame = () => {
    setIsReshuffling(true);

    // Create new pairs with new IDs
    const cardPairs = [...PROFESSION_IMAGES, ...PROFESSION_IMAGES];
    const shuffledCards = cardPairs
      .map((card, index) => ({
        ...card,
        id: Date.now() + index, // Use timestamp to ensure unique IDs
        isFlipped: true, // Show initially
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setGameComplete(false);
    setShowAllCards(true);

    // Hide cards after 3 seconds (shorter time for reshuffled games)
    setTimeout(() => {
      setShowAllCards(false);
      setCards(prev => prev.map(card => ({ ...card, isFlipped: false })));
      setIsReshuffling(false);
    }, 3000);
  };

  const handleCardClick = useCallback(
    (cardId: number) => {
      if (isProcessing || showAllCards || gameComplete) return;

      const card = cards.find(c => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return;

      const newFlippedCards = [...flippedCards, cardId];
      setFlippedCards(newFlippedCards);

      setCards(prev =>
        prev.map(c => (c.id === cardId ? { ...c, isFlipped: true } : c))
      );

      if (newFlippedCards.length === 2) {
        setIsProcessing(true);
        const [firstId, secondId] = newFlippedCards;
        const firstCard = cards.find(c => c.id === firstId);
        const secondCard = cards.find(c => c.id === secondId);

        if (firstCard && secondCard && firstCard.image === secondCard.image) {
          // Match found
          setTimeout(() => {
            setCards(prev =>
              prev.map(c =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isMatched: true }
                  : c
              )
            );
            setMatchedPairs(prev => prev + 1);
            setFlippedCards([]);
            setIsProcessing(false);

            // Check if game is complete
            if (matchedPairs + 1 === PROFESSION_IMAGES.length) {
              setGameComplete(true);

              // If course is not ready, reshuffle the cards
              if (!isCourseReady) {
                setTimeout(() => {
                  reshuffleGame();
                }, 2000); // Wait 2 seconds before reshuffling
              } else {
                // If course is ready, call onGameComplete
                setTimeout(() => {
                  if (onGameComplete) {
                    onGameComplete();
                  }
                }, 1000);
              }
            }
          }, 500);
        } else {
          // No match
          setTimeout(() => {
            setCards(prev =>
              prev.map(c =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isFlipped: false }
                  : c
              )
            );
            setFlippedCards([]);
            setIsProcessing(false);
          }, 1000);
        }
      }
    },
    [
      cards,
      flippedCards,
      matchedPairs,
      isProcessing,
      showAllCards,
      gameComplete,
      onGameComplete,
    ]
  );

  const currentFact = learningFacts[currentFactIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-2">
            {isCourseReady ? '¡Curso Listo!' : 'Generando tu Curso'}
          </h1>
          <p className="text-muted-foreground">
            {isCourseReady
              ? 'Tu curso ha sido generado exitosamente. ¡Disfruta aprendiendo!'
              : `¡Juega este mini-juego de memoria con Cursi! ${isReshuffling ? 'Nueva ronda - observa por 3 segundos' : 'Observa las cartas por 5 segundos'} y luego encuentra los pares.`}
          </p>
        </div>

        {/* Game Board */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-10">
            {isReshuffling && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  ¡Nueva ronda! Cartas rebarajadas
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {cards.map(card => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`
                    relative aspect-square rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${
                      card.isMatched
                        ? 'opacity-0 scale-0'
                        : card.isFlipped || showAllCards
                          ? 'opacity-100 scale-100'
                          : 'opacity-100 scale-100'
                    }
                    ${isProcessing ? 'pointer-events-none' : ''}
                  `}
                >
                  <div
                    className={`
                    w-full h-full rounded-xl border-2 transition-all duration-300 flex items-center justify-center
                    ${
                      card.isFlipped || showAllCards
                        ? 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 border-slate-400 dark:border-slate-500'
                    }
                    ${card.isMatched ? 'border-green-400 bg-green-100 dark:bg-green-900/20' : ''}
                  `}
                  >
                    {card.isFlipped || showAllCards ? (
                      <img
                        src={card.image}
                        alt={`Panda ${card.id}`}
                        className="w-24 h-24 md:w-28 md:h-28 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-600 dark:text-slate-400 tracking-wider">
                          CURSIA
                        </div>
                      </div>
                    )}
                  </div>

                  {card.isMatched && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Section */}
        <div className="space-y-6">
          {/* Game Progress */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Progreso del Juego
                </h3>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {matchedPairs}/{PROFESSION_IMAGES.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    pares encontrados
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Generation Progress */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-center space-y-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Generación del Curso
                </h3>

                {/* Learning Facts */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-lg font-medium text-blue-900 dark:text-blue-100 leading-relaxed">
                    {currentFact}
                  </p>
                </div>

                {/* Enhanced Loading Animation */}
                <div className="flex justify-center items-center py-8">
                  <div className="relative">
                    {/* Main pulsing circle */}
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse shadow-xl"></div>

                    {/* Rotating outer ring */}
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin"></div>

                    {/* Inner dots */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex gap-1">
                        <div
                          className="w-3 h-3 bg-white rounded-full animate-bounce shadow-sm"
                          style={{ animationDelay: '0ms' }}
                        ></div>
                        <div
                          className="w-3 h-3 bg-white rounded-full animate-bounce shadow-sm"
                          style={{ animationDelay: '150ms' }}
                        ></div>
                        <div
                          className="w-3 h-3 bg-white rounded-full animate-bounce shadow-sm"
                          style={{ animationDelay: '300ms' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress message */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl px-6 py-4 border border-blue-200/50 dark:border-blue-700/50">
                    <p className="text-xl font-bold text-blue-800 dark:text-blue-200 animate-pulse">
                      {progressMessages[currentProgressIndex]}
                    </p>
                  </div>
                </div>

                {isCourseReady && (
                  <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    ¡Curso listo!
                  </div>
                )}

                {/* Cancel Button - Only show if not ready and not cancelling */}
                {!isCourseReady && onCancelCreation && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={onCancelCreation}
                      disabled={isCancelling}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      {isCancelling ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Cancelando...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Cancelar Creación
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
