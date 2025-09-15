# Instrucciones de Instalación - Nuevo Sistema de Onboarding

## Archivos Entregados

- `dashboard-homeschool-onboarding-6-pasos-FINAL.zip` - Proyecto completo con el nuevo sistema
- `NUEVO_SISTEMA_ONBOARDING.md` - Documentación detallada del sistema implementado
- `INSTRUCCIONES_INSTALACION_ONBOARDING.md` - Este archivo

## Instalación Local

### 1. Extraer el Proyecto
```bash
unzip dashboard-homeschool-onboarding-6-pasos-FINAL.zip
cd dashboard-homeschool
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Ejecutar en Desarrollo
```bash
npm run dev
```

El dashboard estará disponible en: `http://localhost:5173/`

### 4. Construir para Producción
```bash
npm run build
```

## Despliegue en Producción

### Opción 1: Reemplazar Archivos Existentes

1. **Hacer backup del sistema actual**
2. **Reemplazar archivos modificados:**
   - `src/App.jsx` (actualizado con nueva importación)
   - `src/NewOnboardingSystem.jsx` (nuevo archivo)

### Opción 2: Despliegue Completo

1. **Subir todo el proyecto actualizado**
2. **Instalar dependencias en el servidor**
3. **Construir para producción**
4. **Configurar servidor web**

## Verificación de Funcionamiento

### 1. Limpiar localStorage (para testing)
```javascript
// En la consola del navegador
localStorage.clear();
```

### 2. Recargar la página
El nuevo wizard de 6 pasos debería aparecer automáticamente.

### 3. Probar Funcionalidades
- ✅ Navegación entre los 6 pasos
- ✅ Añadir estudiantes
- ✅ Omitir pasos y ver modales informativos
- ✅ Navegación hacia atrás
- ✅ Cerrar wizard
- ✅ Dashboard funcional durante el wizard

## Configuración Avanzada

### Desactivar Onboarding Temporalmente
```javascript
// En la consola del navegador
localStorage.setItem('new_onboarding_wizard_completed', 'true');
```

### Reactivar Onboarding
```javascript
// En la consola del navegador
localStorage.removeItem('new_onboarding_wizard_completed');
localStorage.removeItem('onboarding_wizard_dismissed');
```

### Ver Estado del Onboarding
```javascript
// En la consola del navegador
console.log('Onboarding State:', {
  completed: localStorage.getItem('new_onboarding_wizard_completed'),
  dismissed: localStorage.getItem('onboarding_wizard_dismissed'),
  progress: JSON.parse(localStorage.getItem('onboarding_wizard_progress') || '{}')
});
```

## Personalización

### Modificar Pasos del Wizard
Editar el archivo `src/NewOnboardingSystem.jsx` en la sección `steps`:

```javascript
const steps = [
  { 
    id: 1, 
    component: Step1AddStudents, 
    title: 'Estudiantes',
    description: 'Descripción personalizada...',
    icon: Users
  },
  // ... más pasos
];
```

### Cambiar Textos y Mensajes
Buscar y modificar los textos en los componentes individuales de cada paso.

### Ajustar Estilos
Los estilos utilizan Tailwind CSS. Modificar las clases CSS en los componentes según necesidades.

## Solución de Problemas

### El wizard no aparece
1. Verificar que localStorage esté limpio
2. Verificar que no hay errores en la consola
3. Verificar que la importación en App.jsx sea correcta

### Errores de compilación
1. Verificar que todas las dependencias estén instaladas
2. Verificar que no hay conflictos de versiones
3. Limpiar cache: `npm run dev -- --force`

### Problemas de persistencia
1. Verificar que localStorage esté habilitado en el navegador
2. Verificar que no hay errores de JSON parsing
3. Limpiar localStorage y reiniciar

## Soporte

Para cualquier problema o pregunta sobre la implementación:

1. Revisar la documentación en `NUEVO_SISTEMA_ONBOARDING.md`
2. Verificar la consola del navegador para errores
3. Probar en modo incógnito para descartar problemas de cache

## Notas Importantes

- ✅ El sistema es completamente compatible con la versión actual
- ✅ No interfiere con las funcionalidades existentes del dashboard
- ✅ Todos los datos se guardan en localStorage del navegador
- ✅ El wizard se puede omitir o cerrar en cualquier momento
- ✅ El dashboard permanece funcional durante todo el proceso

## Próximas Mejoras Sugeridas

1. **Integración con Backend**: Conectar los datos del onboarding con una API
2. **Analytics**: Añadir tracking de uso y abandono
3. **Personalización**: Permitir configurar qué pasos mostrar
4. **Validaciones**: Añadir validaciones más robustas
5. **Internacionalización**: Soporte para múltiples idiomas
