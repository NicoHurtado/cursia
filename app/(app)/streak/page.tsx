'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StreakPage() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const { getStreak, touchStreak } = require('@/lib/streak');
    touchStreak();
    setCount(getStreak().count);
  }, []);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-4 flex items-center">
        <Flame className="h-7 w-7 text-orange-500 mr-2" />
        Tu racha de aprendizaje
      </h1>
      <p className="text-muted-foreground mb-6">
        Contamos días consecutivos en los que abriste Cursia. Mantén tu racha
        viva visitando cada día.
      </p>
      <div className="rounded-xl border p-6 bg-muted/30 flex items-center gap-4">
        <Flame className="h-10 w-10 text-orange-500" />
        <div>
          <div className="text-3xl font-extrabold">{count} días</div>
          <div className="text-sm text-muted-foreground">
            ¡Sigue así! Vuelve mañana para aumentarla.
          </div>
        </div>
      </div>
      <div className="mt-6">
        <Button
          onClick={() => setCount(require('@/lib/streak').touchStreak().count)}
        >
          Actualizar racha
        </Button>
      </div>
    </div>
  );
}
