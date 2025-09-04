# Cursia

Una plataforma educativa moderna que utiliza inteligencia artificial para generar cursos personalizados y estructurados, permitiendo a los usuarios aprender de manera interactiva y adaptada a sus necesidades.

## 🎯 Características Principales

### Generación Inteligente de Cursos
- **IA-Powered**: Utiliza Anthropic Claude para generar contenido educativo de alta calidad
- **Personalización**: Cursos adaptados al nivel del usuario (Principiante, Intermedio, Avanzado)
- **Intereses Específicos**: Hasta 6 áreas de interés para personalizar ejemplos y ejercicios
- **Estructura Modular**: Cursos organizados en módulos con chunks de contenido y quizzes

### Experiencia de Aprendizaje
- **Interfaz Moderna**: Diseño académico y profesional con modo oscuro/claro
- **Navegación Intuitiva**: Sistema de progreso visual y navegación entre módulos
- **Contenido Multimedia**: Integración con YouTube para videos educativos relevantes
- **Seguimiento de Progreso**: Sistema completo de tracking de avance y completitud

### Sistema de Evaluación
- **Quizzes Interactivos**: Evaluaciones por módulo con 7 preguntas cada una
- **Retroalimentación Detallada**: Explicaciones completas de respuestas correctas e incorrectas
- **Sistema de Aprobación**: Criterio de 50% para avanzar al siguiente módulo
- **Certificaciones**: Preparado para emisión de certificados al completar cursos

## 🏗️ Arquitectura Técnica

### Frontend
- **Next.js 15**: Framework React con App Router
- **TypeScript**: Tipado estático para mayor robustez
- **Tailwind CSS**: Estilos utilitarios y diseño responsive
- **shadcn/ui**: Componentes de interfaz modernos y accesibles

### Backend
- **API Routes**: Endpoints RESTful para todas las operaciones
- **Prisma ORM**: Gestión de base de datos con migraciones
- **NextAuth.js**: Autenticación segura con JWT

### Integraciones
- **Anthropic Claude**: Generación de contenido educativo
- **YouTube Data API**: Búsqueda y embebido de videos educativos
- **Markdown**: Renderizado de contenido estructurado

## 🎨 Experiencia de Usuario

### Dashboard
- **Gestión de Cursos**: Lista de cursos creados con estado de progreso
- **Sistema de Papelera**: Eliminación suave con posibilidad de restauración
- **Perfil de Usuario**: Información personal y acceso a papelera
- **Creación Rápida**: Formulario intuitivo para nuevos cursos

### Vista de Curso
- **Introducción**: Información del curso, prerequisitos y módulos
- **Navegación Modular**: Sidebar con progreso visual por módulo
- **Lector de Contenido**: Interfaz limpia para lectura y aprendizaje
- **Sistema de Completado**: Tracking automático de progreso
- **Transiciones Suaves**: Animaciones y feedback visual

### Sistema de Quizzes
- **Interfaz Intuitiva**: Preguntas claras con opciones múltiples
- **Resultados Detallados**: Explicaciones completas y retroalimentación
- **Animaciones de Éxito**: Celebración visual al aprobar
- **Navegación Automática**: Transición fluida al siguiente módulo

## 🔧 Funcionalidades Técnicas

### Generación de Contenido
- **Prompt Engineering**: Prompts optimizados para contenido educativo
- **Estructuración Automática**: Organización en módulos y chunks
- **Validación con Zod**: Esquemas robustos para datos generados
- **Fallbacks Inteligentes**: Manejo de errores y contenido de respaldo

### Gestión de Estado
- **React Hooks**: Estado local y efectos
- **Context API**: Estado global para autenticación
- **URL State**: Navegación basada en parámetros
- **Persistencia**: Guardado automático de progreso

### Optimizaciones
- **Lazy Loading**: Carga diferida de componentes
- **Image Optimization**: Optimización automática de imágenes
- **Code Splitting**: División automática de código
- **Caching**: Estrategias de caché para mejor rendimiento

## 🎓 Tipos de Contenido

### Módulos Educativos
- **Teoría Estructurada**: Contenido organizado en chunks lógicos
- **Ejemplos Prácticos**: Casos de uso basados en intereses del usuario
- **Ejercicios Interactivos**: Actividades para reforzar aprendizaje
- **Recursos Adicionales**: Enlaces y materiales complementarios

### Evaluaciones
- **Preguntas Múltiples**: 7 preguntas por módulo
- **Dificultad Gradual**: Progresión de complejidad
- **Explicaciones Detalladas**: Justificación de respuestas
- **Criterio de Aprobación**: 50% para continuar

## 🚀 Características Avanzadas

### Sistema de Progreso
- **Tracking Granular**: Seguimiento por chunk y módulo
- **Persistencia de Estado**: Recuperación de posición al regresar
- **Métricas Visuales**: Barras de progreso y indicadores
- **Historial Completo**: Registro de intentos y resultados

### Gestión de Cursos
- **Soft Delete**: Eliminación reversible con papelera
- **Restauración**: Recuperación de cursos eliminados
- **Eliminación Permanente**: Borrado definitivo con confirmación
- **Estados Visuales**: Indicadores claros de estado del curso

### Accesibilidad
- **WCAG 2.1 AA**: Cumplimiento de estándares de accesibilidad
- **Navegación por Teclado**: Soporte completo para teclado
- **Screen Readers**: Compatibilidad con lectores de pantalla
- **Contraste**: Colores y contrastes optimizados

## 🎨 Diseño y UX

### Principios de Diseño
- **Academic Modern**: Estética profesional y educativa
- **Consistency**: Patrones de diseño coherentes
- **Accessibility**: Inclusión y usabilidad universal
- **Responsive**: Adaptación a todos los dispositivos

### Componentes UI
- **shadcn/ui**: Biblioteca de componentes moderna
- **Tailwind CSS**: Estilos utilitarios y consistentes
- **Lucide Icons**: Iconografía clara y profesional
- **Animations**: Transiciones suaves y feedback visual

---

*Cursia representa la evolución de la educación personalizada, combinando la potencia de la inteligencia artificial con una experiencia de usuario excepcional para crear el futuro del aprendizaje online.*
