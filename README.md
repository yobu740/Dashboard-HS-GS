# Dashboard de Homeschooling - Genial Skills

Un dashboard completo de gestión académica diseñado específicamente para familias que practican homeschooling, con herramientas integradas de planificación, seguimiento de progreso y gestión de lecciones.

## Características Principales

### Sistema de Onboarding Interactivo
El dashboard incluye un sistema de onboarding de 6 pasos que guía a los usuarios a través de la configuración inicial. Cada paso está diseñado para ser opcional y permite omitir secciones con modales informativos que explican dónde configurar esas opciones más tarde.

### Gestión de Estudiantes
La plataforma permite gestionar múltiples estudiantes con tarjetas personalizadas que muestran el progreso académico mediante gráficas circulares. Cada estudiante tiene un perfil detallado con pestañas para progreso, tiempo de estudio, dificultades, logros y notas.

### Catálogo de Lecciones
El catálogo incluye un sistema de filtros avanzado con acordeón expandible que permite buscar lecciones por materia, grado, dificultad y duración. También incluye campos de búsqueda por código y texto para encontrar contenido específico.

### Planificación Académica
Las herramientas de planificación permiten crear y gestionar planes académicos personalizados, asignar lecciones y crear evaluaciones. La interfaz simplificada se enfoca en las acciones principales sin sobrecargar visualmente.

### Tour Guiado
Un tour interactivo posiciona dinámicamente las ventanas de ayuda sobre los iconos específicos del menú, proporcionando una experiencia de aprendizaje intuitiva sin bloquear la funcionalidad del dashboard.

## Tecnologías Utilizadas

- **React 19** con hooks modernos para gestión de estado
- **Vite** como bundler para desarrollo rápido
- **Tailwind CSS** para estilos responsivos y consistentes
- **Recharts** para visualizaciones de datos interactivas
- **Lucide React** para iconografía moderna y consistente

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/dashboard-homeschool.git
cd dashboard-homeschool

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## Estructura del Proyecto

El proyecto está organizado en componentes modulares que facilitan el mantenimiento y la escalabilidad. El componente principal `App.jsx` maneja el estado global y la navegación, mientras que componentes especializados como `NewOnboardingSystem.jsx` y `StudentDetailModal.jsx` manejan funcionalidades específicas.

## Configuración

El dashboard utiliza localStorage para persistir el estado del usuario, incluyendo el progreso del onboarding y las preferencias de filtros. No requiere configuración de base de datos externa para funcionar.

## Despliegue

La aplicación está optimizada para despliegue en plataformas como Vercel, Netlify o cualquier servidor que soporte aplicaciones React estáticas. El build de producción genera archivos optimizados con code splitting automático.

## Contribución

Para contribuir al proyecto, por favor sigue las convenciones de código establecidas y asegúrate de que todas las funcionalidades existentes sigan funcionando correctamente después de tus cambios.

## Licencia

Este proyecto está desarrollado para Genial Skills y su uso está sujeto a los términos de la plataforma educativa.
