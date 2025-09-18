import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, BookOpen, Bell, CheckCircle, AlertTriangle, Star } from 'lucide-react';

// Mock data as specified
export const MOCK_STUDENTS = [
  { id: 'maria', name: 'María', color: '#2979FF' },
  { id: 'juan', name: 'Juan', color: '#2E7D32' },
  { id: 'sofia', name: 'Sofía', color: '#7B1FA2' },
];

// Onboarding hook
export function useOnboarding() {
  const [showWizard, setShowWizard] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showWeeklyInsights, setShowWeeklyInsights] = useState(false);

  useEffect(() => {
    // Check if wizard should be shown
    if (!localStorage.getItem('onboarding_wizard_completed')) {
      setShowWizard(true);
      return;
    }
    
    // Check if tour should be shown
    if (!localStorage.getItem('dashboard_tour_completed')) {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    // Check weekly insights
    const last = localStorage.getItem('weekly_insight_last_seen');
    const now = new Date();
    if (!last || new Date(last) < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      setTimeout(() => setShowWeeklyInsights(true), 2000); // Show after 2 seconds
    }
  }, []);

  const completeWizard = () => {
    localStorage.setItem('onboarding_wizard_completed', 'true');
    setShowWizard(false);
    // Ask if user wants tour
    if (confirm('¿Desea ver un tour rápido del dashboard?')) {
      setShowTour(true);
    } else {
      localStorage.setItem('dashboard_tour_completed', 'true');
    }
  };

  const completeTour = () => {
    localStorage.setItem('dashboard_tour_completed', 'true');
    setShowTour(false);
  };

  const dismissWeeklyInsights = () => {
    const now = new Date().toISOString();
    localStorage.setItem('weekly_insight_last_seen', now);
    setShowWeeklyInsights(false);
  };

  return {
    showWizard,
    showTour,
    showWeeklyInsights,
    completeWizard,
    completeTour,
    dismissWeeklyInsights,
  };
}

// Step Components for Wizard
function StepAddStudents({ onNext }) {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', grade: '' });

  const addStudent = () => {
    if (newStudent.name && newStudent.grade) {
      setStudents([...students, { ...newStudent, id: Date.now().toString() }]);
      setNewStudent({ name: '', grade: '' });
    }
  };

  return (
    <div className="text-center">
      <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Añade a tus estudiantes</h3>
      <p className="text-gray-600 mb-6">Registra el nombre, grado y avatar de cada hijo.</p>
      
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre del estudiante"
            value={newStudent.name}
            onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <select
            value={newStudent.grade}
            onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Grado</option>
            <option value="K">Kinder</option>
            <option value="1">1er Grado</option>
            <option value="2">2do Grado</option>
            <option value="3">3er Grado</option>
            <option value="4">4to Grado</option>
            <option value="5">5to Grado</option>
          </select>
          <button
            onClick={addStudent}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Agregar
          </button>
        </div>
        
        {students.length > 0 && (
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <span>{student.name} - {student.grade}° Grado</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepPlanPicker() {
  const plans = [
    { id: 'math-2', title: 'Matemáticas 2.º Grado', subject: 'Matemáticas', weeks: 12 },
    { id: 'eng-2', title: 'Inglés 2.º Grado', subject: 'Inglés', weeks: 15 },
    { id: 'sci-2', title: 'Ciencias 2.º Grado', subject: 'Ciencias', weeks: 10 },
  ];

  return (
    <div className="text-center">
      <BookOpen className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Aplica un plan recomendado</h3>
      <p className="text-gray-600 mb-6">Planes alineados a estándares; siempre editables.</p>
      
      <div className="grid gap-4 max-w-2xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="text-left">
              <h4 className="font-semibold">{plan.title}</h4>
              <p className="text-sm text-gray-600">{plan.subject} • {plan.weeks} semanas</p>
            </div>
            <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
              Aplicar
            </button>
          </div>
        ))}
      </div>
      
      <button className="mt-4 text-gray-500 hover:text-gray-700">
        Saltar este paso
      </button>
    </div>
  );
}

function StepMiniCalendar() {
  return (
    <div className="text-center">
      <Calendar className="w-16 h-16 text-purple-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Ajusta tu calendario familiar</h3>
      <p className="text-gray-600 mb-6">Decide los dias y las horas de estudio ajustado a tu rutina.</p>
      
      <div className="max-w-md mx-auto bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="font-semibold p-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({length: 35}, (_, i) => (
            <div key={i} className="aspect-square bg-white border rounded text-xs flex items-center justify-center">
              {i > 6 && i < 28 ? i - 6 : ''}
            </div>
          ))}
        </div>
      </div>
      
      <button className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600">
        Guardar agenda
      </button>
    </div>
  );
}

function StepNotifications() {
  const [notifications, setNotifications] = useState({
    daily: true,
    weekly: true,
    reports: true,
  });

  return (
    <div className="text-center">
      <Bell className="w-16 h-16 text-orange-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Activa tus notificaciones</h3>
      <p className="text-gray-600 mb-6">Recibe recordatorios y genera reportes en PDF con un clic.</p>
      
      <div className="max-w-md mx-auto space-y-4">
        <label className="flex items-center justify-between p-3 border rounded-lg">
          <span>Recordatorios diarios</span>
          <input
            type="checkbox"
            checked={notifications.daily}
            onChange={(e) => setNotifications({...notifications, daily: e.target.checked})}
            className="w-4 h-4"
          />
        </label>
        <label className="flex items-center justify-between p-3 border rounded-lg">
          <span>Resumen semanal</span>
          <input
            type="checkbox"
            checked={notifications.weekly}
            onChange={(e) => setNotifications({...notifications, weekly: e.target.checked})}
            className="w-4 h-4"
          />
        </label>
        <label className="flex items-center justify-between p-3 border rounded-lg">
          <span>Reportes automáticos</span>
          <input
            type="checkbox"
            checked={notifications.reports}
            onChange={(e) => setNotifications({...notifications, reports: e.target.checked})}
            className="w-4 h-4"
          />
        </label>
      </div>
      
      <label className="flex items-center justify-center mt-6 text-sm text-gray-600">
        <input type="checkbox" className="mr-2" />
        No volver a mostrar el asistente
      </label>
    </div>
  );
}

// Main Wizard Component
export function OnboardingWizard({ onFinish }) {
  const [step, setStep] = useState(0);
  
  const steps = [
    { component: StepAddStudents, title: 'Estudiantes' },
    { component: StepPlanPicker, title: 'Planificación' },
    { component: StepMiniCalendar, title: 'Calendario' },
    { component: StepNotifications, title: 'Notificaciones' },
  ];

  const CurrentStep = steps[step].component;

  return (
    <div role="dialog" aria-modal className="fixed inset-0 bg-black/60 grid place-items-center z-50">
      <section className="w-full max-w-4xl bg-white rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">¡Bienvenido a Genial Skills Homeschool!</h2>
            <p className="text-gray-600">Configura tu hogar de aprendizaje en minutos.</p>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {step + 1} / {steps.length}
          </span>
        </header>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="min-h-[400px] mb-8">
          <CurrentStep onNext={() => setStep(step + 1)} />
        </div>
        
        <footer className="flex justify-between">
          <button 
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Anterior
          </button>
          
          {step < steps.length - 1 ? (
            <button 
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => setStep(step + 1)}
            >
              Continuar
            </button>
          ) : (
            <button 
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              onClick={onFinish}
            >
              Terminar y entrar al Dashboard
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

// Dashboard Tour Component
export function DashboardTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const tourSteps = [
    {
      target: '#cards-hijos',
      title: 'Tus estudiantes',
      content: 'Haz clic para ver el detalle del progreso.',
      position: 'bottom'
    },
    {
      target: '[data-menu="planificacion"]',
      title: 'Planes recomendados',
      content: 'Catálogo editable por grado y materia.',
      position: 'right'
    },
    {
      target: '[data-menu="calendario"]',
      title: 'Calendario',
      content: 'Arrastra para reprogramar. Clic para ver detalles.',
      position: 'right'
    }
  ];

  const currentTourStep = tourSteps[currentStep];

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipTour = () => {
    onComplete();
  };

  // Simple tour with floating card - no blocking overlay
  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-xl p-4 max-w-sm border-2 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800">{currentTourStep.title}</h3>
        <button onClick={skipTour} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-gray-600 mb-4">{currentTourStep.content}</p>
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Paso {currentStep + 1} de {tourSteps.length}
        </span>
        
        <div className="flex gap-2">
          <button 
            onClick={skipTour}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Omitir
          </button>
          <button 
            onClick={nextStep}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {currentStep < tourSteps.length - 1 ? 'Siguiente' : 'Finalizar'}
          </button>
        </div>
      </div>
      
      {/* Arrow pointing to target */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-4 h-4 bg-white border-r border-b border-blue-500 transform rotate-45"></div>
      </div>
    </div>
  );
}

// Weekly Insights Card
export function WeeklyInsightsCard({ onDismiss }) {
  const kpis = [
    { icon: CheckCircle, text: 'María completó 5 de 7 sesiones (+2)', color: 'text-green-500' },
    { icon: AlertTriangle, text: 'Juan tiene 2 pendientes en Matemáticas', color: 'text-yellow-500' },
    { icon: Star, text: 'Sofía ganó la insignia Exploradora Científica', color: 'text-purple-500' },
  ];

  return (
    <aside className="fixed bottom-4 right-4 w-[320px] bg-white rounded-xl shadow-lg p-4 z-50 border">
      <header className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Resumen rápido de tu semana</h3>
        <button 
          aria-label="Cerrar" 
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </header>
      
      <ul className="text-sm space-y-2 mb-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <li key={index} className="flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 ${kpi.color}`} />
              <span className="text-gray-700">{kpi.text}</span>
            </li>
          );
        })}
      </ul>
      
      <div className="flex gap-2">
        <a 
          href="/calendar" 
          className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-center"
        >
          Ver calendario
        </a>
        <a 
          href="/gestion-academica?tab=avanza" 
          className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center"
        >
          Asignar Avanza
        </a>
      </div>
    </aside>
  );
}
