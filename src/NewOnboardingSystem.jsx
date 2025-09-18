import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, BookOpen, Bell, CheckCircle, AlertTriangle, Star, Settings, FileText, Target } from 'lucide-react';

// Mock data as specified
export const MOCK_STUDENTS = [
  { id: 'maria', name: 'María', color: '#2979FF' },
  { id: 'juan', name: 'Juan', color: '#2E7D32' },
  { id: 'sofia', name: 'Sofía', color: '#7B1FA2' },
];

// Enhanced 6-step onboarding hook with improved state persistence
export function useNewOnboarding() {
  const [showWizard, setShowWizard] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showWeeklyInsights, setShowWeeklyInsights] = useState(false);
  const [wizardProgress, setWizardProgress] = useState({
    currentStep: 1,
    completedSteps: [],
    skippedSteps: [],
    startedAt: null,
    lastActiveAt: null
  });

  useEffect(() => {
    // Load wizard progress from localStorage
    const savedProgress = localStorage.getItem('onboarding_wizard_progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setWizardProgress(progress);
      } catch (error) {
        console.warn('Failed to parse onboarding progress:', error);
      }
    }

    // Check if new wizard should be shown
    const wizardCompleted = localStorage.getItem('new_onboarding_wizard_completed');
    const wizardDismissed = localStorage.getItem('onboarding_wizard_dismissed');
    
    if (!wizardCompleted && !wizardDismissed) {
      setShowWizard(true);
      // Update start time if not set
      if (!wizardProgress.startedAt) {
        const newProgress = {
          ...wizardProgress,
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };
        setWizardProgress(newProgress);
        localStorage.setItem('onboarding_wizard_progress', JSON.stringify(newProgress));
      }
      return;
    }
    
    // Check if tour should be shown
    if (wizardCompleted && !localStorage.getItem('dashboard_tour_completed')) {
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

  // Save wizard progress whenever it changes
  useEffect(() => {
    if (wizardProgress.startedAt) {
      localStorage.setItem('onboarding_wizard_progress', JSON.stringify(wizardProgress));
    }
  }, [wizardProgress]);

  const updateWizardProgress = (updates) => {
    setWizardProgress(prev => ({
      ...prev,
      ...updates,
      lastActiveAt: new Date().toISOString()
    }));
  };

  const completeWizard = () => {
    const completionData = {
      completedAt: new Date().toISOString(),
      totalSteps: 6,
      completedSteps: wizardProgress.completedSteps,
      skippedSteps: wizardProgress.skippedSteps,
      startedAt: wizardProgress.startedAt,
      duration: wizardProgress.startedAt ? 
        new Date().getTime() - new Date(wizardProgress.startedAt).getTime() : 0
    };
    
    localStorage.setItem('new_onboarding_wizard_completed', 'true');
    localStorage.setItem('onboarding_completion_data', JSON.stringify(completionData));
    setShowWizard(false);
    
    // Ask if user wants tour with better UX
    const showTourConfirm = window.confirm('¿Desea ver un tour rápido del dashboard?');
    if (showTourConfirm) {
      setShowTour(true);
    } else {
      localStorage.setItem('dashboard_tour_completed', 'true');
    }
  };

  const dismissWizard = () => {
    localStorage.setItem('onboarding_wizard_dismissed', 'true');
    localStorage.setItem('onboarding_dismissed_at', new Date().toISOString());
    setShowWizard(false);
  };

  const completeTour = () => {
    localStorage.setItem('dashboard_tour_completed', 'true');
    localStorage.setItem('tour_completed_at', new Date().toISOString());
    setShowTour(false);
  };

  const dismissWeeklyInsights = () => {
    const now = new Date().toISOString();
    localStorage.setItem('weekly_insight_last_seen', now);
    setShowWeeklyInsights(false);
  };

  // Reset onboarding (for testing or user request)
  const resetOnboarding = () => {
    const keysToRemove = [
      'new_onboarding_wizard_completed',
      'onboarding_wizard_dismissed',
      'onboarding_wizard_progress',
      'onboarding_completion_data',
      'dashboard_tour_completed',
      'tour_completed_at',
      'onboarding_students',
      'onboarding_selected_plans',
      'onboarding_calendar_config',
      'onboarding_notifications',
      'onboarding_portfolio',
      'onboarding_final_settings'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setWizardProgress({
      currentStep: 1,
      completedSteps: [],
      skippedSteps: [],
      startedAt: null,
      lastActiveAt: null
    });
    setShowWizard(true);
  };

  return {
    showWizard,
    showTour,
    showWeeklyInsights,
    wizardProgress,
    updateWizardProgress,
    completeWizard,
    dismissWizard,
    completeTour,
    dismissWeeklyInsights,
    resetOnboarding,
  };
}

// Step 1: Add Students
function Step1AddStudents({ onNext, onSkip }) {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', grade: '' });

  const addStudent = () => {
    if (newStudent.name && newStudent.grade) {
      setStudents([...students, { 
        ...newStudent, 
        id: Date.now().toString(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      }]);
      setNewStudent({ name: '', grade: '' });
    }
  };

  const removeStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleNext = () => {
    // Save students to localStorage
    localStorage.setItem('onboarding_students', JSON.stringify(students));
    onNext();
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
            aria-label="Nombre del estudiante"
          />
          <select
            value={newStudent.grade}
            onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
            className="px-3 py-2 border rounded-md"
            aria-label="Grado del estudiante"
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
            aria-label="Agregar estudiante"
          >
            Agregar
          </button>
        </div>
        
        {students.length > 0 && (
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <span>{student.name} - {student.grade}° Grado</span>
                <button 
                  onClick={() => removeStudent(student.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Eliminar ${student.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-500 hover:text-gray-700"
        >
          Omitir este paso
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          disabled={students.length === 0}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// Step 2: Plan Selection
function Step2PlanSelection({ onNext, onSkip }) {
  const [selectedPlans, setSelectedPlans] = useState([]);
  
  const plans = [
    { id: 'math-2', title: 'Matemáticas 2.º Grado', subject: 'Matemáticas', weeks: 12, description: 'Suma, resta y números hasta 100' },
    { id: 'eng-2', title: 'Inglés 2.º Grado', subject: 'Inglés', weeks: 15, description: 'Vocabulario básico y conversación' },
    { id: 'sci-2', title: 'Ciencias 2.º Grado', subject: 'Ciencias', weeks: 10, description: 'Observación y método científico' },
    { id: 'esp-2', title: 'Español 2.º Grado', subject: 'Español', weeks: 12, description: 'Lectura comprensiva y escritura básica' },
  ];

  const togglePlan = (planId) => {
    setSelectedPlans(prev => 
      prev.includes(planId) 
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  const handleNext = () => {
    localStorage.setItem('onboarding_selected_plans', JSON.stringify(selectedPlans));
    onNext();
  };

  return (
    <div className="text-center">
      <BookOpen className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Aplica un plan recomendado</h3>
      <p className="text-gray-600 mb-6">Planes alineados a estándares; siempre editables.</p>
      
      <div className="grid gap-4 max-w-2xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedPlans.includes(plan.id) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => togglePlan(plan.id)}
          >
            <div className="text-left">
              <h4 className="font-semibold">{plan.title}</h4>
              <p className="text-sm text-gray-600">{plan.description}</p>
              <p className="text-xs text-gray-500">{plan.subject} • {plan.weeks} semanas</p>
            </div>
            <div className="flex items-center">
              {selectedPlans.includes(plan.id) && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-500 hover:text-gray-700"
        >
          Omitir este paso
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// Step 3: Calendar Configuration
function Step3CalendarConfig({ onNext, onSkip }) {
  const [selectedDays, setSelectedDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [studyTime, setStudyTime] = useState('09:00');
  
  const days = [
    { id: 'monday', label: 'Lunes' },
    { id: 'tuesday', label: 'Martes' },
    { id: 'wednesday', label: 'Miércoles' },
    { id: 'thursday', label: 'Jueves' },
    { id: 'friday', label: 'Viernes' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' },
  ];

  const toggleDay = (dayId) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleNext = () => {
    localStorage.setItem('onboarding_calendar_config', JSON.stringify({
      selectedDays,
      studyTime
    }));
    onNext();
  };

  return (
    <div className="text-center">
      <Calendar className="w-16 h-16 text-purple-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Ajusta tu calendario familiar</h3>
      <p className="text-gray-600 mb-6">Arrastra y suelta las lecciones para adaptarlas a tu rutina.</p>
      
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h4 className="font-medium mb-3">Días de estudio</h4>
          <div className="grid grid-cols-2 gap-2">
            {days.map((day) => (
              <label 
                key={day.id}
                className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedDays.includes(day.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day.id)}
                  onChange={() => toggleDay(day.id)}
                  className="sr-only"
                />
                <span className={selectedDays.includes(day.id) ? 'text-purple-700 font-medium' : 'text-gray-600'}>
                  {day.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Hora de inicio preferida</h4>
          <input
            type="time"
            value={studyTime}
            onChange={(e) => setStudyTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-500 hover:text-gray-700"
        >
          Omitir este paso
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// Step 4: Notifications Setup
function Step4NotificationsSetup({ onNext, onSkip }) {
  const [notifications, setNotifications] = useState({
    daily: true,
    weekly: true,
    reports: true,
    achievements: true,
  });

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNext = () => {
    localStorage.setItem('onboarding_notifications', JSON.stringify(notifications));
    onNext();
  };

  return (
    <div className="text-center">
      <Bell className="w-16 h-16 text-orange-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Activa tus notificaciones</h3>
      <p className="text-gray-600 mb-6">Recibe recordatorios y genera reportes en PDF con un clic.</p>
      
      <div className="max-w-md mx-auto space-y-4">
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Recordatorios diarios</span>
          <input
            type="checkbox"
            checked={notifications.daily}
            onChange={() => handleNotificationChange('daily')}
            className="w-4 h-4 text-orange-500"
          />
        </label>
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Resumen semanal</span>
          <input
            type="checkbox"
            checked={notifications.weekly}
            onChange={() => handleNotificationChange('weekly')}
            className="w-4 h-4 text-orange-500"
          />
        </label>
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Reportes automáticos</span>
          <input
            type="checkbox"
            checked={notifications.reports}
            onChange={() => handleNotificationChange('reports')}
            className="w-4 h-4 text-orange-500"
          />
        </label>
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Notificaciones de logros</span>
          <input
            type="checkbox"
            checked={notifications.achievements}
            onChange={() => handleNotificationChange('achievements')}
            className="w-4 h-4 text-orange-500"
          />
        </label>
      </div>
      
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-500 hover:text-gray-700"
        >
          Omitir este paso
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// Step 5: Portfolio Configuration
function Step5PortfolioConfig({ onNext, onSkip }) {
  const [portfolioSettings, setPortfolioSettings] = useState({
    autoReports: true,
    includePhotos: true,
    includeProjects: true,
    reportFrequency: 'monthly'
  });

  const handleSettingChange = (key, value) => {
    setPortfolioSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNext = () => {
    localStorage.setItem('onboarding_portfolio', JSON.stringify(portfolioSettings));
    onNext();
  };

  return (
    <div className="text-center">
      <FileText className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Configura tu portafolio</h3>
      <p className="text-gray-600 mb-6">Personaliza cómo se generan los reportes y documentos de progreso.</p>
      
      <div className="max-w-md mx-auto space-y-4">
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Reportes automáticos</span>
          <input
            type="checkbox"
            checked={portfolioSettings.autoReports}
            onChange={(e) => handleSettingChange('autoReports', e.target.checked)}
            className="w-4 h-4 text-indigo-500"
          />
        </label>
        
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Incluir fotos de proyectos</span>
          <input
            type="checkbox"
            checked={portfolioSettings.includePhotos}
            onChange={(e) => handleSettingChange('includePhotos', e.target.checked)}
            className="w-4 h-4 text-indigo-500"
          />
        </label>
        
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Incluir trabajos destacados</span>
          <input
            type="checkbox"
            checked={portfolioSettings.includeProjects}
            onChange={(e) => handleSettingChange('includeProjects', e.target.checked)}
            className="w-4 h-4 text-indigo-500"
          />
        </label>

        <div className="p-3 border rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frecuencia de reportes
          </label>
          <select
            value={portfolioSettings.reportFrequency}
            onChange={(e) => handleSettingChange('reportFrequency', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="quarterly">Trimestral</option>
          </select>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-500 hover:text-gray-700"
        >
          Omitir este paso
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

// Step 6: Final Configuration
function Step6FinalConfig({ onFinish }) {
  const [finalSettings, setFinalSettings] = useState({
    showTutorial: true,
    enableTips: true,
    shareData: false
  });

  const handleSettingChange = (key, value) => {
    setFinalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_final_settings', JSON.stringify(finalSettings));
    localStorage.setItem('onboarding_completed_at', new Date().toISOString());
    onFinish();
  };

  return (
    <div className="text-center">
      <Target className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">¡Casi terminamos!</h3>
      <p className="text-gray-600 mb-6">Últimos ajustes para personalizar tu experiencia.</p>
      
      <div className="max-w-md mx-auto space-y-4">
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Mostrar tutorial del dashboard</span>
          <input
            type="checkbox"
            checked={finalSettings.showTutorial}
            onChange={(e) => handleSettingChange('showTutorial', e.target.checked)}
            className="w-4 h-4 text-green-600"
          />
        </label>
        
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Mostrar consejos útiles</span>
          <input
            type="checkbox"
            checked={finalSettings.enableTips}
            onChange={(e) => handleSettingChange('enableTips', e.target.checked)}
            className="w-4 h-4 text-green-600"
          />
        </label>
        
        <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <span>Compartir datos para mejorar el servicio</span>
          <input
            type="checkbox"
            checked={finalSettings.shareData}
            onChange={(e) => handleSettingChange('shareData', e.target.checked)}
            className="w-4 h-4 text-green-600"
          />
        </label>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-lg max-w-md mx-auto">
        <h4 className="font-medium text-green-800 mb-2">¡Configuración completada!</h4>
        <p className="text-sm text-green-700">
          Tu dashboard está listo. Puedes modificar estas configuraciones en cualquier momento desde el menú de Configuración.
        </p>
      </div>
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleFinish}
          className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          Terminar y entrar al Dashboard
        </button>
      </div>
    </div>
  );
}

// Enhanced Skip Modal Component with better accessibility
function SkipModal({ isOpen, onClose, onConfirm, stepTitle, stepDescription, stepNumber }) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      const firstButton = document.querySelector('[data-skip-modal] button');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="skip-modal-title"
      aria-describedby="skip-modal-description"
      data-skip-modal
    >
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 id="skip-modal-title" className="text-lg font-semibold text-gray-900 mb-1">
              Omitir paso {stepNumber}: {stepTitle}
            </h3>
            <p id="skip-modal-description" className="text-gray-600 mb-3">
              {stepDescription}
            </p>
            <p className="text-sm text-gray-500">
              Puedes configurar esto más tarde desde el menú de Configuración.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            aria-label="Cancelar y volver al paso"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            aria-label={`Confirmar omitir paso ${stepNumber}`}
          >
            Entendido, omitir
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Main New Onboarding Wizard Component with improved state management
export function NewOnboardingWizard({ onFinish }) {
  const [step, setStep] = useState(1);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipModalData, setSkipModalData] = useState({});
  const [completedSteps, setCompletedSteps] = useState([]);
  const [skippedSteps, setSkippedSteps] = useState([]);
  
  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('onboarding_wizard_progress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        if (progress.currentStep) {
          setStep(progress.currentStep);
        }
        if (progress.completedSteps) {
          setCompletedSteps(progress.completedSteps);
        }
        if (progress.skippedSteps) {
          setSkippedSteps(progress.skippedSteps);
        }
      } catch (error) {
        console.warn('Failed to load wizard progress:', error);
      }
    }
  }, []);

  // Save progress whenever step changes
  useEffect(() => {
    const progress = {
      currentStep: step,
      completedSteps,
      skippedSteps,
      lastActiveAt: new Date().toISOString()
    };
    localStorage.setItem('onboarding_wizard_progress', JSON.stringify(progress));
  }, [step, completedSteps, skippedSteps]);
  
  const steps = [
    { 
      id: 1, 
      component: Step1AddStudents, 
      title: 'Estudiantes',
      description: 'Puedes añadir estudiantes más tarde desde el menú principal.',
      icon: Users
    },
    { 
      id: 2, 
      component: Step2PlanSelection, 
      title: 'Planes',
      description: 'Encontrarás planes recomendados en la sección de Planificación.',
      icon: BookOpen
    },
    { 
      id: 3, 
      component: Step3CalendarConfig, 
      title: 'Calendario',
      description: 'Puedes ajustar tu horario desde el Calendario en cualquier momento.',
      icon: Calendar
    },
    { 
      id: 4, 
      component: Step4NotificationsSetup, 
      title: 'Notificaciones',
      description: 'Las notificaciones se pueden activar desde Configuración.',
      icon: Bell
    },
    { 
      id: 5, 
      component: Step5PortfolioConfig, 
      title: 'Portafolio',
      description: 'Configura tu portafolio desde la sección Portafolio cuando lo necesites.',
      icon: FileText
    },
    { 
      id: 6, 
      component: Step6FinalConfig, 
      title: 'Configuración final',
      description: 'Estos ajustes están disponibles en el menú de Configuración.',
      icon: Target
    },
  ];

  const currentStepData = steps.find(s => s.id === step);
  const CurrentStep = currentStepData.component;

  const handleNext = () => {
    // Mark current step as completed
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
    
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    setSkipModalData({
      title: currentStepData.title,
      description: currentStepData.description,
      stepNumber: step
    });
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    // Mark current step as skipped
    if (!skippedSteps.includes(step)) {
      setSkippedSteps(prev => [...prev, step]);
    }
    
    setShowSkipModal(false);
    
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStepClick = (stepId) => {
    // Allow navigation to any previous step or current step
    if (stepId <= step) {
      setStep(stepId);
    }
  };

  const handleClose = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar el asistente? Tu progreso se guardará.')) {
      onFinish();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      } else if (event.key === 'ArrowLeft' && step > 1) {
        handlePrevious();
      } else if (event.key === 'ArrowRight' && step < steps.length) {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        aria-describedby="wizard-description"
      >
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <header className="flex items-center justify-between mb-6">
              <div>
                <h1 id="wizard-title" className="text-2xl font-bold text-gray-800">
                  ¡Bienvenido a Genial Skills Homeschool!
                </h1>
                <p id="wizard-description" className="text-gray-600">
                  Configura tu hogar de aprendizaje en minutos.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Paso {step} de {steps.length}
                </span>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Cerrar asistente"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>
            
            {/* Step indicators */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((stepData, index) => {
                const isCompleted = completedSteps.includes(stepData.id);
                const isSkipped = skippedSteps.includes(stepData.id);
                const isCurrent = stepData.id === step;
                const isAccessible = stepData.id <= step;
                
                return (
                  <button
                    key={stepData.id}
                    onClick={() => handleStepClick(stepData.id)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                      isCurrent 
                        ? 'bg-blue-100 text-blue-700' 
                        : isCompleted 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : isSkipped
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : isAccessible
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label={`Paso ${stepData.id}: ${stepData.title}${
                      isCompleted ? ' (completado)' : isSkipped ? ' (omitido)' : isCurrent ? ' (actual)' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full mb-1">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isSkipped ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <stepData.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{stepData.title}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / steps.length) * 100}%` }}
                role="progressbar"
                aria-valuenow={step}
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-label={`Progreso del asistente: paso ${step} de ${steps.length}`}
              ></div>
            </div>
            
            <main className="min-h-[400px] mb-8">
              <CurrentStep 
                onNext={handleNext} 
                onSkip={handleSkip}
                onFinish={onFinish}
                stepNumber={step}
                totalSteps={steps.length}
              />
            </main>
            
            <footer className="flex justify-between items-center">
              <button 
                className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handlePrevious}
                disabled={step === 1}
                aria-label="Ir al paso anterior"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  Todos los pasos son opcionales • Usa ← → para navegar
                </span>
                <span className="text-xs text-gray-400">
                  ESC para cerrar
                </span>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <SkipModal
        isOpen={showSkipModal}
        onClose={() => setShowSkipModal(false)}
        onConfirm={confirmSkip}
        stepTitle={skipModalData.title}
        stepDescription={skipModalData.description}
        stepNumber={skipModalData.stepNumber}
      />
    </>
  );
}

// Dashboard Tour Component (unchanged but improved)
export function DashboardTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  const tourSteps = [
    {
      target: '#cards-hijos',
      title: 'Tus estudiantes',
      content: 'Haz clic para ver el detalle del progreso.',
      position: 'bottom'
    },
    {
      target: '[data-menu="planificacion"]',
      title: 'Gestión Académica',
      content: 'Administre los planes académicos de su hijo y cree asignaciones.',
      position: 'right'
    },
    {
      target: '[data-menu="calendario"]',
      title: 'Calendario',
      content: 'Arrastra para reprogramar. Clic para ver detalles.',
      position: 'right'
    },
    {
      target: '[data-menu="catalogo"]',
      title: 'Catálogo',
      content: 'Vea el catálogo de lecciones de Genial Skills y asigne lecciones desde el mismo.',
      position: 'right'
    },
    {
      target: '[data-menu="portafolio"]',
      title: 'Portafolio',
      content: 'Genera un portafolio para tu hijo con todas las lecciones, proyectos y evaluaciones.',
      position: 'right'
    },
    {
      target: '[data-menu="comunidad"]',
      title: 'Comunidad',
      content: 'Conecte con otros homeschoolers o acceda a guías y recursos para su gestión académica.',
      position: 'right'
    }
  ];

  const currentTourStep = tourSteps[currentStep];

  // Calculate tooltip position based on target element
  useEffect(() => {
    const updatePosition = () => {
      const targetElement = document.querySelector(currentTourStep.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        let top, left;
        
        switch (currentTourStep.position) {
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + (rect.width / 2) - 150; // Center tooltip (300px width / 2)
            break;
          case 'right':
            top = rect.top + (rect.height / 2) - 75; // Center vertically (150px height / 2)
            left = rect.right + 10;
            break;
          case 'left':
            top = rect.top + (rect.height / 2) - 75;
            left = rect.left - 310; // Tooltip width + margin
            break;
          case 'top':
            top = rect.top - 160; // Tooltip height + margin
            left = rect.left + (rect.width / 2) - 150;
            break;
          default:
            top = rect.bottom + 10;
            left = rect.left;
        }
        
        // Ensure tooltip stays within viewport
        const maxLeft = window.innerWidth - 320;
        const maxTop = window.innerHeight - 170;
        
        setTooltipPosition({
          top: Math.max(10, Math.min(top, maxTop)),
          left: Math.max(10, Math.min(left, maxLeft))
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, currentTourStep]);

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

  // Highlight target element
  useEffect(() => {
    const targetElement = document.querySelector(currentTourStep.target);
    if (targetElement) {
      targetElement.style.position = 'relative';
      targetElement.style.zIndex = '45';
      targetElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
      targetElement.style.borderRadius = '8px';
      
      return () => {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
        targetElement.style.borderRadius = '';
      };
    }
  }, [currentStep, currentTourStep]);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" />
      
      {/* Tooltip */}
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-xl p-4 w-80 border-2 border-blue-500"
        style={{ 
          top: `${tooltipPosition.top}px`, 
          left: `${tooltipPosition.left}px` 
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800">{currentTourStep.title}</h3>
          <button onClick={skipTour} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar tour">
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
      </div>
    </>
  );
}

// Weekly Insights Component - DISABLED during onboarding
export function WeeklyInsightsCard({ onDismiss }) {
  // Component disabled to avoid interference with onboarding tutorial
  return null;
  
  /* ORIGINAL CODE - COMMENTED OUT
  const kpis = [
    {
      icon: CheckCircle,
      text: "María completó 5 de 7 sesiones (+2)",
      color: "text-green-600"
    },
    {
      icon: AlertTriangle,
      text: "Juan tiene 2 pendientes en Matemáticas",
      color: "text-amber-600"
    },
    {
      icon: Star,
      text: "Sofía ganó la insignia Exploradora Científica",
      color: "text-purple-600"
    }
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
        <button className="flex-1 text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
          Ver calendario
        </button>
        <button className="flex-1 text-xs bg-orange-50 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors">
          Asignar Avanza
        </button>
      </div>
    </aside>
  );
  */
}
