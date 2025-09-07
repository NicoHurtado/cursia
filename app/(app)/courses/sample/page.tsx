import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function SampleCoursePage() {
  // Find the course with the specific title
  const course = await db.course.findFirst({
    where: {
      title: 'Estructuras de Datos Aplicadas al Análisis Deportivo',
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground">
            The sample course "Estructuras de Datos Aplicadas al Análisis
            Deportivo" doesn't exist yet. Please create a course first.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to the actual course page
  redirect(`/courses/${course.id}`);
}
