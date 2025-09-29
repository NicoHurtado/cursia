'use client';

import { useState, useEffect } from 'react';
import {
  Check,
  ArrowRight,
  Star,
  Users,
  Award,
  Clock,
  Target,
  BookOpen,
  Zap,
  Shield,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ComoFuncionaPage() {
  const [activeSection, setActiveSection] = useState('proceso');

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'proceso',
        'beneficios',
        'demo',
        'casos',
        'personalizacion',
        'planes',
        'seguridad',
        'faq',
      ];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqData = [
    {
      question: '¿Cursia es gratis?',
      answer:
        'Sí, con el plan gratuito puedes crear 1 curso al mes y acceder a todos los cursos creados. Los planes pagos incluyen más cursos, certificados y acceso a la comunidad.',
    },
    {
      question: '¿Qué incluye cada plan?',
      answer:
        'Aprendiz y Experto añaden diplomas, comunidad y más cursos por mes. El plan Maestro incluye soporte prioritario y la posibilidad de publicar cursos en la comunidad.',
    },
    {
      question: '¿Cómo se generan los cursos?',
      answer:
        'Usamos IA para estructurar módulos, lecciones, ejercicios y quizzes basándose en tu objetivo de aprendizaje, nivel y tiempo disponible.',
    },
    {
      question: '¿Necesito conocimientos previos?',
      answer:
        'No. Puedes elegir principiante y empezar desde cero. Cursia se adapta a tu nivel actual de conocimiento.',
    },
    {
      question: '¿Puedo retomar mis cursos?',
      answer:
        'Sí, tienes acceso a lo que has creado. Tu progreso queda guardado y puedes continuar desde donde lo dejaste.',
    },
    {
      question: '¿Cómo funcionan los certificados?',
      answer:
        'En planes pagos, al terminar un curso obtienes un certificado verificable que puedes descargar y compartir donde quieras.',
    },
    {
      question: '¿Qué pasa si no me gusta?',
      answer:
        'Puedes cancelar cuando quieras. No hay compromisos a largo plazo ni cargos ocultos.',
    },
    {
      question: '¿Soporte?',
      answer: 'Si nos necesitas escríbenos al prompt2course@gmail.com',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Submenú Sticky */}
      <div className="bg-slate-50 border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-8 py-3 overflow-x-auto">
            {[
              { id: 'proceso', label: 'Proceso' },
              { id: 'beneficios', label: 'Beneficios' },
              { id: 'demo', label: 'Demo' },
              { id: 'casos', label: 'Casos de uso' },
              { id: 'personalizacion', label: 'Personalización' },
              { id: 'planes', label: 'Planes' },
              { id: 'seguridad', label: 'Seguridad' },
              { id: 'faq', label: 'FAQ' },
              { id: 'legal', label: 'Información legal', href: '/legal' },
            ].map(item =>
              item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className="whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                Cómo funciona <span className="text-blue-600">Cursia</span>
              </h1>
              <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
                Genera cursos completos con IA, personalizados a tu tiempo,
                nivel y objetivos.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Escribe lo que quieres aprender
                  </h3>
                  <p className="text-slate-600">
                    Cuéntanos tu objetivo y nosotros hacemos el resto
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    La IA te arma un curso completo en segundos
                  </h3>
                  <p className="text-slate-600">
                    Módulos, lecciones y ejercicios personalizados
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Aprende con módulos, ejercicios y certificado
                  </h3>
                  <p className="text-slate-600">
                    En planes pagos obtienes certificados verificables
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center"
                >
                  Probar gratis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>

              {/* Imagen de interfaz */}
              <div className="mt-16 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                  <div className="w-full h-96 rounded-lg overflow-hidden">
                    <Image
                      src="/sc_cursia.png"
                      alt="Interfaz de Cursia"
                      width={800}
                      height={400}
                      className="w-full h-full object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proceso en 3 pasos */}
        <section id="proceso" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
                Tu curso en 3 pasos
              </h2>

              <div className="grid md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Escribe tu objetivo
                  </h3>
                  <p className="text-slate-600">
                    Cuéntanos qué quieres aprender y cuánto tiempo tienes.
                    Puedes elegir nivel (principiante, intermedio o avanzado).
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-purple-600">
                      2
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Cursia genera tu curso
                  </h3>
                  <p className="text-slate-600">
                    En segundos, nuestra IA arma módulos, lecciones, ejemplos y
                    quizzes. Tú decides el ritmo.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Aprende y avanza
                  </h3>
                  <p className="text-slate-600">
                    Sigue el contenido, practica y obtén tu certificado (según
                    plan). Puedes retomar cuando quieras.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section id="beneficios" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
                Qué hace Cursia
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Target className="w-8 h-8 text-blue-600" />,
                    title: 'Personalización real',
                    description:
                      'Se adapta a tu nivel, tu tiempo y tus intereses.',
                  },
                  {
                    icon: <BookOpen className="w-8 h-8 text-purple-600" />,
                    title: 'Contenido accionable',
                    description:
                      'Te da lecciones, ejemplos y ejercicios prácticos.',
                  },
                  {
                    icon: <Star className="w-8 h-8 text-green-600" />,
                    title: 'Quizzes y progreso',
                    description: 'Mide tu avance y te mantiene motivado.',
                  },
                  {
                    icon: <Zap className="w-8 h-8 text-orange-600" />,
                    title: 'Estructura en los cursos',
                    description:
                      'Para que puedas navegar y estudiar cómodo con nuestra interfaz.',
                  },
                  {
                    icon: <Users className="w-8 h-8 text-indigo-600" />,
                    title: 'Comunidad',
                    description:
                      'Aprende con otros, comparte y descubre más cursos.',
                  },
                  {
                    icon: <Award className="w-8 h-8 text-red-600" />,
                    title: 'Certificados verificables',
                    description:
                      'Demuestra lo que aprendiste con certificados profesionales.',
                  },
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200"
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Demo estática */}
        <section id="demo" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
                Así se ve un curso en Cursia
              </h2>

              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="w-full h-auto rounded-lg overflow-hidden">
                  <Image
                    src="/curso.png"
                    alt="Interfaz de curso en Cursia"
                    width={1200}
                    height={800}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>
              </div>

              <p className="text-center text-slate-500 text-sm mt-4">
                Esto es un ejemplo visual. Tu curso real se genera según tu
                objetivo.
              </p>
            </div>
          </div>
        </section>

        {/* Casos de uso */}
        <section id="casos" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
                Sirve para…
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Tecnología
                  </h3>
                  <ul className="space-y-2 text-slate-600 mb-6">
                    <li>• Lenguajes de programación</li>
                    <li>• SQL</li>
                    <li>• Edición</li>
                    <li>• Fundamentos de IA</li>
                    <li>• Desarrollo web</li>
                    <li>• Machine Learning</li>
                    <li>• Manejo de tecnología</li>
                    <li>• Cloud Computing</li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Cocina
                  </h3>
                  <ul className="space-y-2 text-slate-600 mb-6">
                    <li>• Técnicas básicas</li>
                    <li>• Cocina internacional</li>
                    <li>• Repostería</li>
                    <li>• Cocina saludable</li>
                    <li>• Platos vegetarianos</li>
                    <li>• Conservación de alimentos</li>
                    <li>• Técnicas de corte</li>
                    <li>• Cocina molecular</li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Trabajo y empresa
                  </h3>
                  <ul className="space-y-2 text-slate-600 mb-6">
                    <li>• Onboarding</li>
                    <li>• Ciberseguridad</li>
                    <li>• OKRs</li>
                    <li>• Ventas</li>
                    <li>• Excel ejecutivo</li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Habilidades blandas
                  </h3>
                  <ul className="space-y-2 text-slate-600 mb-6">
                    <li>• Storytelling</li>
                    <li>• Comunicación</li>
                    <li>• Liderazgo</li>
                    <li>• Trabajo en equipo</li>
                    <li>• Gestión del tiempo</li>
                    <li>• Inteligencia emocional</li>
                    <li>• Negociación</li>
                    <li>• Presentaciones</li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                    <Clock className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Día a día
                  </h3>
                  <ul className="space-y-2 text-slate-600 mb-6">
                    <li>• Finanzas personales</li>
                    <li>• Organización del hogar</li>
                    <li>• Jardinería</li>
                    <li>• Bricolaje</li>
                    <li>• Fitness en casa</li>
                    <li>• Meditación</li>
                    <li>• Idiomas</li>
                    <li>• Fotografía</li>
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                    <Target className="w-8 h-8 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Aprender a usar herramientas
                  </h3>
                  <ul className="space-y-2 text-slate-600 mb-6">
                    <li>• Excel avanzado</li>
                    <li>• PowerPoint</li>
                    <li>• Photoshop</li>
                    <li>• Canva</li>
                    <li>• Figma</li>
                    <li>• Google Workspace</li>
                    <li>• Notion</li>
                    <li>• Trello</li>
                  </ul>
                </div>
              </div>

              {/* Mensaje de seguridad */}
              <div className="mt-16 text-center">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold text-red-800">
                      Política de Contenido
                    </h3>
                  </div>
                  <p className="text-red-700">
                    Bloqueamos contenido peligroso o que va en contra de
                    nuestras políticas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Personalización */}
        <section id="personalizacion" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center text-slate-900 mb-8">
                Personalización que importa
              </h2>
              <p className="text-xl text-slate-600 text-center mb-16">
                Cursia adapta el contenido a tu nivel y tu tiempo.
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  'Nivel (principiante/intermedio/avanzado)',
                  'Tiempo por semana (microlecciones o bloques largos)',
                  'Estilo de aprendizaje (más ejemplos, más ejercicios, o mixto)',
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Planes */}
        <section id="planes" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
                Elige tu plan
              </h2>

              <div className="grid md:grid-cols-4 gap-8">
                {[
                  {
                    name: 'Gratis',
                    price: '$0',
                    period: '/mes',
                    features: [
                      '1 curso al mes',
                      'Acceso a cursos creados',
                      'Lecciones + videos + quizzes',
                    ],
                    button: 'Empezar gratis',
                    popular: false,
                  },
                  {
                    name: 'Aprendiz',
                    price: '$29.900',
                    period: '/mes',
                    features: [
                      '5 cursos al mes + 2 bonificación',
                      'Diplomas personalizados',
                      'Acceso a cursos creados',
                    ],
                    button: 'Elegir plan',
                    popular: false,
                  },
                  {
                    name: 'Experto',
                    price: '$49.900',
                    period: '/mes',
                    features: [
                      '10 cursos al mes + 3 bonificación',
                      'Todo lo del Plan Aprendiz',
                      'Acceso a comunidad',
                      'Soporte prioritario',
                    ],
                    button: 'Más popular',
                    popular: true,
                  },
                  {
                    name: 'Maestro',
                    price: '$69.900',
                    period: '/mes',
                    features: [
                      '20 cursos al mes + 5 bonificación',
                      'Todo lo del Plan Experto',
                      'Publica en comunidad',
                      'Soporte VIP 24/7',
                    ],
                    button: 'Para creadores',
                    popular: false,
                  },
                ].map((plan, index) => (
                  <div
                    key={index}
                    className={`bg-white p-8 rounded-2xl shadow-sm border-2 ${plan.popular ? 'border-blue-500' : 'border-gray-200'} relative`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Más Popular
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900">
                        {plan.price}
                      </span>
                      <span className="text-slate-600">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start space-x-3"
                        >
                          <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={
                        plan.name === 'Gratis' ? '/signup' : '/dashboard/plans'
                      }
                      className={`w-full py-3 rounded-lg font-semibold text-center block transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {plan.button}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  href="/dashboard/plans"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver detalles de planes →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Seguridad y pagos */}
        <section id="seguridad" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-slate-900 mb-8">
                Pagos seguros y control total
              </h2>
              <p className="text-xl text-slate-600 mb-12">
                Pagos procesados de forma segura. Tú decides cuándo cancelar.
                Sin cargos ocultos.
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                  <Shield className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Pagos seguros
                  </h3>
                  <p className="text-slate-600 text-sm">Procesados con Wompi</p>
                </div>
                <div className="flex flex-col items-center">
                  <Clock className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Cancela cuando quieras
                  </h3>
                  <p className="text-slate-600 text-sm">Sin compromisos</p>
                </div>
                <div className="flex flex-col items-center">
                  <HelpCircle className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Soporte
                  </h3>
                  <p className="text-slate-600 text-sm">Cuando necesites</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
                Preguntas frecuentes
              </h2>

              <div className="space-y-4">
                {faqData.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200"
                  >
                    <button
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                      onClick={() =>
                        setOpenFaq(openFaq === index ? null : index)
                      }
                    >
                      <span className="text-lg font-semibold text-slate-900">
                        {faq.question}
                      </span>
                      <div
                        className={`transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                      >
                        <ArrowRight className="w-5 h-5 text-slate-600" />
                      </div>
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6">
                        <p className="text-slate-600">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Empieza ahora mismo
              </h2>
              <p className="text-xl text-slate-600 mb-12">
                Crea tu primer curso en segundos. Es gratis probar.
              </p>

              <div className="flex justify-center">
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center"
                >
                  Probar gratis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
