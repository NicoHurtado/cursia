'use client';

import Link from 'next/link';
import React from 'react';

export default function LegalPage() {
  const lastUpdated = '28 de septiembre de 2025';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Información Legal y Términos de Uso
          </h1>
          <p className="mt-2 text-slate-600">
            Última actualización: {lastUpdated}
          </p>
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Importante:</p>
            <p>
              <b>
                Todo el contenido de Cursia es tercero, no es de nuestra autoría
                o verificable, nosotros somos una herramienta para acercar el
                contenido público a las personas.
              </b>
              Cursia no es una fuente citable ya que el contenido proviene de la
              IA y no de fuentes verificadas.
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold">Lectura rápida:</p>
            <p>
              Este documento resume reglas de uso, límites de responsabilidad,
              políticas de contenido, propiedad intelectual, privacidad y pagos
              aplicables a tu uso de Cursia (la &quot;Plataforma&quot;). Es un
              texto informativo; <b>no constituye asesoría legal</b>. Te
              recomendamos revisión profesional para tu jurisdicción.
            </p>
          </div>
        </header>

        {/* Índice */}
        <nav
          aria-label="Índice"
          className="sticky top-16 z-10 bg-slate-50/80 backdrop-blur pb-3"
        >
          <ul className="flex flex-wrap gap-3 text-sm">
            {[
              ['1. Quiénes somos y propósito', '#quienes'],
              ['2. Aceptación de términos', '#aceptacion'],
              ['3. Descripción del servicio', '#servicio'],
              ['4. Uso aceptable y restricciones', '#uso'],
              ['5. Contenido generado por IA', '#ia'],
              ['6. Propiedad intelectual', '#pi'],
              ['7. Privacidad y datos', '#privacidad'],
              ['8. Pagos y facturación', '#pagos'],
              ['9. Garantías y responsabilidad', '#garantias'],
              ['10. Disponibilidad y cambios', '#disponibilidad'],
              ['11. Ley aplicable', '#ley'],
              ['12. Contacto', '#contacto'],
            ].map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 hover:bg-indigo-50 hover:border-indigo-200"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section id="quienes" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">1. Quiénes somos y propósito</h2>
          <p>
            &quot;Cursia&quot; es una plataforma educativa que permite generar
            cursos personalizados con apoyo de modelos de inteligencia
            artificial. Nuestro propósito es{' '}
            <b>
              acercar el aprendizaje a las personas mediante rutas de estudio
              adaptadas a su nivel, tiempo y objetivos
            </b>
            .
          </p>
        </section>

        <section id="aceptacion" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">2. Aceptación de términos</h2>
          <p>
            Al acceder o usar la Plataforma, aceptas estos Términos y la
            Política de Privacidad correspondiente. Si no estás de acuerdo, por
            favor no uses Cursia. Podremos actualizar estos Términos; el uso
            continuo implica aceptación de los cambios publicados.
          </p>
        </section>

        <section id="servicio" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">3. Descripción del servicio</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Generación de cursos personalizados (módulos, lecciones,
              ejercicios, quizzes) con apoyo de IA.
            </li>
            <li>
              Funciones opcionales según plan: certificados, comunidad, soporte.
            </li>
            <li>
              Acceso a los cursos creados por el usuario, sujeto a su plan y a
              estas reglas.
            </li>
          </ul>
          <p className="text-sm text-slate-600">
            <b>No garantizamos</b> la exactitud, integridad o actualidad de los
            contenidos generados por IA. El material es referencial y debe
            revisarse críticamente.{' '}
            <b>
              No es asesoría profesional (médica, legal, financiera, de
              seguridad, etc.)
            </b>
            .
          </p>
        </section>

        <section id="uso" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">
            4. Uso aceptable y restricciones
          </h2>
          <p>
            Te comprometes a usar Cursia de forma legal, ética y respetuosa.
            Está prohibido, entre otros:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Publicar o solicitar contenido ilegal, difamatorio, fraudulento o
              que incite a la violencia.
            </li>
            <li>
              Generar, compartir o solicitar contenido sexualmente explícito,
              explotación o abuso.
            </li>
            <li>Promover odio, discriminación, acoso o doxxing.</li>
            <li>
              Instrucciones para actividades peligrosas o ilícitas (armas,
              drogas, malware, etc.).
            </li>
            <li>
              Ingeniería inversa, scraping abusivo, spam, acceso no autorizado,
              elusión de seguridad.
            </li>
            <li>
              Uso para evaluar, perfilar o tomar decisiones automatizadas
              sensibles sin base legal.
            </li>
          </ul>
          <p className="text-sm text-slate-600">
            Podemos moderar, limitar o suspender cuentas que incumplan estas
            reglas.
          </p>
        </section>

        <section id="ia" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">5. Contenido generado por IA</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              El contenido se genera automáticamente a partir de tus entradas y
              modelos de IA.
            </li>
            <li>
              Puede contener errores, sesgos o imprecisiones.{' '}
              <b>Úsalo bajo tu criterio</b>.
            </li>
            <li>
              Tú eres responsable del uso que hagas del contenido y de cumplir
              la ley aplicable.
            </li>
          </ul>
        </section>

        <section id="pi" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">6. Propiedad intelectual</h2>
          <p>
            Cursia y sus licenciatarios conservan los derechos sobre la
            Plataforma, marca, diseño de interfaz, código, textos propios y
            demás elementos protegidos.
          </p>
          <p>
            <b>
              Nuestro contenido no es autónomo y las fuentes son públicas,
              tomadas de la IA.
            </b>
            Todo el contenido generado proviene de fuentes públicas disponibles
            a través de modelos de inteligencia artificial.
          </p>
        </section>

        <section id="privacidad" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">7. Privacidad y datos</h2>
          <p>
            Respetamos tu privacidad. Tratamos datos personales para operar
            Cursia, mejorar el servicio, cumplir obligaciones legales y de
            seguridad.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Datos de cuenta y uso (registro, progreso, interacción).</li>
            <li>
              Pagos gestionados por terceros (no almacenamos datos completos de
              tarjeta).
            </li>
            <li>
              Medidas técnicas y organizativas razonables para proteger la
              información.
            </li>
          </ul>
        </section>

        <section id="pagos" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">
            8. Pagos, facturación y reembolsos
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Las suscripciones y cobros se procesan a través de un proveedor
              externo de pagos (ej.: Wompi/Stripe).
            </li>
            <li>
              Los precios, límites y beneficios por plan se publican en{' '}
              <Link
                href="/dashboard/plans"
                className="text-indigo-600 underline"
              >
                /planes
              </Link>
              .
            </li>
            <li>
              Puedes cancelar tu suscripción en cualquier momento; el acceso se
              mantiene hasta el fin del período pagado.
            </li>
          </ul>
        </section>

        <section id="garantias" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">
            9. Garantías, descargos y limitación de responsabilidad
          </h2>
          <p>
            Cursia se ofrece &quot;<b>tal cual</b>&quot; y &quot;
            <b>según disponibilidad</b>
            &quot;. No garantizamos que el servicio sea ininterrumpido, libre de
            errores o que el contenido generado cumpla objetivos específicos. En
            la máxima medida permitida por la ley,{' '}
            <b>negamos garantías explícitas o implícitas</b> (incluidas
            comerciabilidad, idoneidad para un propósito particular y no
            infracción).
          </p>
          <p>
            En ningún caso seremos responsables por daños indirectos,
            incidentales, especiales, consecuenciales, pérdida de beneficios,
            datos o reputación derivados del uso o imposibilidad de uso de la
            Plataforma. Algunas jurisdicciones no permiten limitar ciertas
            responsabilidades; en tal caso, la responsabilidad se limitará al
            máximo permitido.
          </p>
        </section>

        <section id="disponibilidad" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">
            10. Disponibilidad del servicio y cambios
          </h2>
          <p>
            Dependemos de proveedores de servicio (modelos de IA), esto está
            sujeto a caídas y fallas. Podemos modificar, suspender o
            descontinuar funciones o planes en cualquier momento para mejorar el
            servicio o por razones operativas/legales. Intentaremos comunicar
            cambios relevantes con antelación razonable.
          </p>
        </section>

        <section id="ley" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">
            11. Ley aplicable y jurisdicción
          </h2>
          <p>
            Estos Términos se rigen por las leyes de Colombia y cualquier
            controversia será resuelta por los jueces de Medellín, Antioquia.
          </p>
        </section>

        <section id="contacto" className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">12. Contacto</h2>
          <p>
            <span className="block font-semibold">prompt2course@gmail.com</span>
          </p>
        </section>
      </main>
    </div>
  );
}
