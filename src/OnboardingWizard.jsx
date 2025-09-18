import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Calendar, BookOpen, Users, Settings, Check } from 'lucide-react';
import ModalWrapper from './components/ModalWrapper' // o la ruta que uses
import './styles/modal.css'

// Types and interfaces (adapted from TypeScript)
const PLAN_CADENCES = {
  weekly: 'Semanal',
  monthly: 'Mensual', 
  semester: 'Semestral'
};

const SUBJECTS = ['Español', 'Inglés', 'Matemáticas', 'Ciencias', 'Estudios Sociales'];

const AVAILABLE_PLANS = {
  'Español': [
    { id: 'plan_esp_g2_12w', title: 'Español 2.º Grado - 12 semanas', description: 'Lectura comprensiva y escritura básica' },
    { id: 'plan_esp_g3_15w', title: 'Español 3.º Grado - 15 semanas', description: 'Gramática y composición' }
  ],
  'Inglés': [
    { id: 'plan_eng_g2_15w', title: 'Inglés 2.º Grado - 15 semanas', description: 'Vocabulario básico y conversación' },
    { id: 'plan_eng_g3_12w', title: 'Inglés 3.º Grado - 12 semanas', description: 'Grammar y reading comprehension' }
  ],
  'Matemáticas': [
    { id: 'plan_math_g2_10w', title: 'Matemáticas 2.º Grado - 10 semanas', description: 'Suma, resta y números hasta 100' },
    { id: 'plan_math_g3_12w', title: 'Matemáticas 3.º Grado - 12 semanas', description: 'Multiplicación y división básica' }
  ],
  'Ciencias': [
    { id: 'plan_sci_g2_8w', title: 'Ciencias 2.º Grado - 8 semanas', description: 'Observación y método científico' },
    { id: 'plan_sci_g3_10w', title: 'Ciencias 3.º Grado - 10 semanas', description: 'Estados de la materia y ecosistemas' }
  ],
  'Estudios Sociales': [
    { id: 'plan_soc_g2_10w', title: 'Estudios Sociales 2.º Grado - 10 semanas', description: 'Comunidad y geografía de Puerto Rico' },
    { id: 'plan_soc_g3_12w', title: 'Estudios Sociales 3.º Grado - 12 semanas', description: 'Historia y cultura puertorriqueña' }
  ]
};

/** Paquetes de asignaciones pre-hechas por materia (Paso 5) */
const PREMADE_ASSIGNMENT_PACKAGES = {
  'Español': [
    {
      id: 'pkg_esp_basico',
      name: 'Asignaciones Español - Básico',
      items: [
        { title: 'Dictado #1', weight: 10 },
        { title: 'Comprensión de lectura A', weight: 15 },
        { title: 'Escritura: Mi fin de semana', weight: 20 }
      ]
    },
    {
      id: 'pkg_esp_intermedio',
      name: 'Asignaciones Español - Intermedio',
      items: [
        { title: 'Gramática: Sustantivos y adjetivos', weight: 15 },
        { title: 'Comprensión de lectura B', weight: 15 },
        { title: 'Ensayo corto: Mi héroe', weight: 20 }
      ]
    }
  ],
  'Matemáticas': [
    {
      id: 'pkg_math_basico',
      name: 'Asignaciones Matemáticas - Básico',
      items: [
        { title: 'Suma y resta 0-100', weight: 10 },
        { title: 'Problemas de palabras (intro)', weight: 15 },
        { title: 'Fact fluency 1', weight: 10 }
      ]
    },
    {
      id: 'pkg_math_intermedio',
      name: 'Asignaciones Matemáticas - Intermedio',
      items: [
        { title: 'Multiplicación (tabla del 2–5)', weight: 15 },
        { title: 'División básica (entre 2–5)', weight: 15 },
        { title: 'Fracciones: mitades y cuartos', weight: 20 }
      ]
    }
  ],
  'Ciencias': [
    {
      id: 'pkg_sci_naturaleza',
      name: 'Ciencias - Naturaleza y método',
      items: [
        { title: 'Diario de observación 1', weight: 10 },
        { title: 'Experimento: germinación', weight: 20 },
        { title: 'Quiz método científico', weight: 10 }
      ]
    }
  ],
  'Estudios Sociales': [
    {
      id: 'pkg_soc_comunidad',
      name: 'Sociales - Mi comunidad',
      items: [
        { title: 'Mapa de mi barrio', weight: 15 },
        { title: 'Entrevista a un vecino', weight: 15 },
        { title: 'Línea de tiempo familiar', weight: 20 }
      ]
    }
  ],
  'Inglés': [
    {
      id: 'pkg_eng_basics',
      name: 'English - Basics',
      items: [
        { title: 'Phonics practice A', weight: 10 },
        { title: 'Reading log (1 semana)', weight: 15 },
        { title: 'Vocabulary set #1', weight: 10 }
      ]
    }
  ]
};

// Hook para mostrar la primera vez (si lo usas externamente, puedes ignorar este hook)
export function useOnboardingWizard() {
  const [showWizard, setShowWizard] = useState(false);
  const [onboardingPayload, setOnboardingPayload] = useState({
    students: [],
    cadence: null,
    appliedPlans: [],
    startDates: [],
    assignmentBanks: [],
    portfolio: {
      externalDocs: [],
      autoReportsEnabled: false
    }
  });

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_wizard_completed');
    if (!completed) {
      setShowWizard(true);
    }
  }, []);

  const completeWizard = () => {
    localStorage.setItem('onboarding_wizard_completed', 'true');
    setShowWizard(false);
  };

  const updatePayload = (updates) => {
    setOnboardingPayload(prev => ({ ...prev, ...updates }));
  };

  return {
    showWizard,
    onboardingPayload,
    updatePayload,
    completeWizard
  };
}

// Step 1: Add Students
function Step1AddStudents({ students, onAddStudent, onUpdateStudents }) {
  const [newStudent, setNewStudent] = useState({ name: '', grade: 2, color: '#2979FF' });

  const addStudent = () => {
    if (newStudent.name.trim()) {
      const student = {
        id: Date.now().toString(),
        name: newStudent.name.trim(),
        grade: parseInt(newStudent.grade),
        color: newStudent.color
      };
      onAddStudent(student);
      setNewStudent({ name: '', grade: 2, color: '#2979FF' });
    }
  };

  const removeStudent = (id) => {
    const updated = students.filter(s => s.id !== id);
    onUpdateStudents(updated);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Añade a tus estudiantes</h2>
        <p className="text-gray-600">Registra el nombre y grado de cada hijo para personalizar su experiencia.</p>
      </div>

      {/* Add Student Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={newStudent.name}
              onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Nombre del estudiante"
              aria-label="Nombre del estudiante"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
            <select
              value={newStudent.grade}
              onChange={(e) => setNewStudent(prev => ({ ...prev, grade: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                <option key={grade} value={grade}>{grade}.º Grado</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="color"
              value={newStudent.color}
              onChange={(e) => setNewStudent(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 border rounded-lg"
            />
          </div>
          <button
            onClick={addStudent}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar estudiante
          </button>
        </div>
      </div>

      {/* Students List */}
      {students.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Estudiantes añadidos:</h3>
          {students.map(student => (
            <div key={student.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: student.color }}
                ></div>
                <div>
                  <span className="font-medium">{student.name}</span>
                  <span className="text-gray-500 ml-2">{student.grade}.º Grado</span>
                </div>
              </div>
              <button
                onClick={() => removeStudent(student.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Step 2: Choose Plan Cadence
function Step2Cadence({ cadence, onSelectCadence, onSkip }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Elige el tipo de plan</h2>
        <p className="text-gray-600">Selecciona el período para organizar tus lecciones.</p>
      </div>

      <div className="space-y-4">
        {Object.entries(PLAN_CADENCES).map(([key, label]) => (
          <label key={key} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="cadence"
              value={key}
              checked={cadence === key}
              onChange={(e) => onSelectCadence(e.target.value)}
              className="mr-3"
            />
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-sm text-gray-500">
                {key === 'weekly' && 'Planificación semanal con flexibilidad diaria'}
                {key === 'monthly' && 'Organización mensual con objetivos a largo plazo'}
                {key === 'semester' && 'Estructura semestral para proyectos extensos'}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// Step 3: Apply Plans by Subject
function Step3ApplyPlans({ students, appliedPlans, onApplyPlan, onSkip }) {
  const [showSkipModal, setShowSkipModal] = useState(false);

  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    setShowSkipModal(false);
    onSkip();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aplica un plan disponible</h2>
        <p className="text-gray-600">Elige un plan sugerido por materia y asígnalo a un estudiante. Siempre podrás editarlo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUBJECTS.map(subject => (
          <div key={subject} className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">{subject}</h3>
            <div className="space-y-2">
              {AVAILABLE_PLANS[subject]?.map(plan => (
                <div key={plan.id} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-sm">{plan.title}</div>
                  <div className="text-xs text-gray-600 mb-2">{plan.description}</div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onApplyPlan({
                          studentId: e.target.value,
                          subject: subject,
                          planId: plan.id
                        });
                      }
                    }}
                    className="w-full text-xs border rounded px-2 py-1"
                    defaultValue=""
                  >
                    <option value="">Aplicar a...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Applied Plans Summary */}
      {appliedPlans.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Planes aplicados:</h3>
          {appliedPlans.map((plan, index) => {
            const student = students.find(s => s.id === plan.studentId);
            return (
              <div key={index} className="text-sm text-green-700">
                {student?.name} - {plan.subject}
              </div>
            );
          })}
        </div>
      )}

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4" role="dialog" aria-modal="true">
            <h3 className="text-lg font-semibold mb-2">Lo puedes hacer más tarde</h3>
            <p className="text-gray-600 mb-4">
              Añade planes sugeridos o personalizados cuando quieras desde Planificación.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSkipModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSkip}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4: Set Start Dates
function Step4StartDates({ students, appliedPlans, startDates, onSetStartDate }) {
  const [newDate, setNewDate] = useState({
    studentId: '',
    subject: '',
    startISO: new Date().toISOString().slice(0, 16)
  });

  const addStartDate = () => {
    if (newDate.studentId && newDate.subject) {
      onSetStartDate(newDate);
      setNewDate({
        studentId: '',
        subject: '',
        startISO: new Date().toISOString().slice(0, 16)
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Define las fechas de inicio</h2>
        <p className="text-gray-600">Selecciona cuándo comienza cada plan. Podrás editarlo desde el calendario.</p>
      </div>

      {/* Add Date Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
            <select
              value={newDate.studentId}
              onChange={(e) => setNewDate(prev => ({ ...prev, studentId: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
            <select
              value={newDate.subject}
              onChange={(e) => setNewDate(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar...</option>
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={newDate.startISO}
              onChange={(e) => setNewDate(prev => ({ ...prev, startISO: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <button
            onClick={addStartDate}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      </div>

      {/* Start Dates List */}
      {startDates.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Fechas programadas:</h3>
          {startDates.map((date, index) => {
            const student = students.find(s => s.id === date.studentId);
            return (
              <div key={index} className="bg-white p-3 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{student?.name}</span>
                    <span className="text-gray-500 mx-2">-</span>
                    <span>{date.subject}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(date.startISO).toLocaleString('es-PR')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- STEP 5: Assignment Bank (con paquetes pre-hechos) ---------- */
function Step5AssignmentBank({ students, assignmentBanks, onAddAssignment, onSkip }) {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    studentId: '',
    subject: '',
    title: '',
    weight: ''
  });
  const [selectedPackageId, setSelectedPackageId] = useState('');

  // Agrega 1 asignación o un paquete completo
  const addAssignment = () => {
    if (!newAssignment.studentId || !newAssignment.subject) return;

    // Si hay paquete seleccionado, agrega todas las items del paquete
    const pkgList = PREMADE_ASSIGNMENT_PACKAGES[newAssignment.subject] || [];
    const pkg = pkgList.find(p => p.id === selectedPackageId);

    if (pkg) {
      pkg.items.forEach(item => {
        onAddAssignment({
          studentId: newAssignment.studentId,
          subject: newAssignment.subject,
          title: item.title,
          weight: item.weight
        });
      });
      // Limpia el selector de paquete tras agregar
      setSelectedPackageId('');
      return;
    }

    // Si no hay paquete, agrega la asignación individual (por título)
    if (newAssignment.title.trim()) {
      onAddAssignment({
        studentId: newAssignment.studentId,
        subject: newAssignment.subject,
        title: newAssignment.title.trim(),
        weight: newAssignment.weight ? parseInt(newAssignment.weight) : undefined
      });
      setNewAssignment({ studentId: '', subject: '', title: '', weight: '' });
    }
  };

  const confirmSkip = () => { setShowSkipModal(false); onSkip(); };

  const packagesForSubject = PREMADE_ASSIGNMENT_PACKAGES[newAssignment.subject] || [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Añade un banco de asignaciones</h2>
        <p className="text-gray-600">
          Usa el campo “Título” para una tarea específica o elige un <strong>paquete pre-hecho</strong> por materia para agregar varias.
        </p>
      </div>

      {/* Formulario: ahora con selector de paquete */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
            <select
              value={newAssignment.studentId}
              onChange={(e) => setNewAssignment(prev => ({ ...prev, studentId: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
            <select
              value={newAssignment.subject}
              onChange={(e) => { 
                setNewAssignment(prev => ({ ...prev, subject: e.target.value }));
                setSelectedPackageId('');
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar...</option>
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Título de asignación individual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={newAssignment.title}
              onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Nombre de la asignación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puntos</label>
            <input
              type="number"
              value={newAssignment.weight}
              onChange={(e) => setNewAssignment(prev => ({ ...prev, weight: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Opcional"
              min="1"
              max="100"
            />
          </div>

          {/* Botón principal (agrega título o paquete) */}
          <button onClick={addAssignment} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Añadir
          </button>
        </div>

        {/* Selector de paquete (opcional) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paquete pre-hecho (opcional)
            </label>
            <select
              disabled={!newAssignment.subject}
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
            >
              <option value="">{newAssignment.subject ? `Selecciona un paquete de ${newAssignment.subject}` : 'Selecciona primero una materia'}</option>
              {packagesForSubject.map(pkg => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>
            {selectedPackageId && (
              <div className="text-xs text-gray-600 mt-2">
                Se agregarán todas las tareas del paquete seleccionado al estudiante/materia indicados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listado de bancos creados */}
      {assignmentBanks.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Asignaciones creadas:</h3>
          {assignmentBanks.map((bank, bankIndex) => (
            <div key={bankIndex} className="bg-white border rounded-lg p-4">
              <h4 className="font-medium mb-2">{bank.studentId} - {bank.subject}</h4>
              <div className="space-y-1">
                {bank.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between text-sm">
                    <span>{item.title}</span>
                    {item.weight && <span className="text-gray-500">Peso: {item.weight}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-right">
        <button onClick={() => setShowSkipModal(true)} className="text-sm text-gray-600 hover:text-gray-800 underline">
          Omitir este paso
        </button>
      </div>

      {showSkipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4" role="dialog" aria-modal="true">
            <h3 className="text-lg font-semibold mb-2">Lo puedes crear después</h3>
            <p className="text-gray-600 mb-4">Desde Planificación podrás crear, editar y asignar tareas.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSkipModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={() => { setShowSkipModal(false); onSkip(); }} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 6: Portfolio and External Documents
function Step6Portfolio({ portfolio, onUploadExternalDoc, onToggleAutoReports }) {
  const [fileName, setFileName] = useState('');

  const handleUpload = () => {
    if (fileName.trim()) {
      onUploadExternalDoc({ name: fileName.trim() });
      setFileName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa el progreso y sube evidencias</h2>
        <p className="text-gray-600">El Portafolio reúne el progreso y documentos externos. Puedes exportarlo en PDF.</p>
      </div>

      {/* Upload Document */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-3">Subir documento</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="Nombre del archivo (ej: Proyecto volcán.jpg)"
          />
          <button
            onClick={handleUpload}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Subir documento
          </button>
        </div>
      </div>

      {/* External Documents List */}
      {portfolio.externalDocs.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Documentos subidos:</h3>
          {portfolio.externalDocs.map((doc, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border flex items-center gap-2">
              <Upload className="w-4 h-4 text-gray-500" />
              <span>{doc.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Auto Reports Toggle */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={portfolio.autoReportsEnabled}
            onChange={(e) => onToggleAutoReports(e.target.checked)}
            className="w-4 h-4"
          />
          <div>
            <div className="font-medium text-blue-800">Activar reportes automáticos</div>
            <div className="text-sm text-blue-600">
              Genera reportes PDF semanales con el progreso de tus estudiantes
            </div>
          </div>
        </label>
      </div>

      <div className="text-center text-sm text-gray-500">
        💡 Tip: Exporta tu Reporte en PDF desde Portafolio.
      </div>
    </div>
  );
}

// Main Wizard Component
export function OnboardingWizard({ onFinish }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [payload, setPayload] = useState({
    students: [
      { id: 'maria', name: 'María', grade: 2, color: '#2979FF' },
      { id: 'juan', name: 'Juan', grade: 3, color: '#2E7D32' },
      { id: 'sofia', name: 'Sofía', grade: 2, color: '#7B1FA2' }
    ],
    cadence: null,
    appliedPlans: [],
    startDates: [],
    assignmentBanks: [],
    portfolio: {
      externalDocs: [],
      autoReportsEnabled: false
    }
  });

  const totalSteps = 6;

  const updatePayload = (updates) => {
    setPayload(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    const dismissedSteps = JSON.parse(localStorage.getItem('onboarding_dismissed_steps') || '[]');
    dismissedSteps.push(`step${currentStep}`);
    localStorage.setItem('onboarding_dismissed_steps', JSON.stringify(dismissedSteps));
    nextStep();
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_wizard_completed', 'true');
    onFinish();
  };

  // Event handlers
  const handleAddStudent = (student) => {
    updatePayload({ students: [...payload.students, student] });
  };

  const handleUpdateStudents = (students) => {
    updatePayload({ students });
  };

  const handleSelectCadence = (cadence) => {
    updatePayload({ cadence });
  };

  const handleApplyPlan = (plan) => {
    const existing = payload.appliedPlans.filter(p => 
      !(p.studentId === plan.studentId && p.subject === plan.subject)
    );
    updatePayload({ appliedPlans: [...existing, plan] });
  };

  const handleSetStartDate = (date) => {
    const existing = payload.startDates.filter(d => 
      !(d.studentId === date.studentId && d.subject === date.subject)
    );
    updatePayload({ startDates: [...existing, date] });
  };

  const handleAddAssignment = (assignment) => {
    const existingBanks = payload.assignmentBanks.filter(b => 
      !(b.studentId === assignment.studentId && b.subject === assignment.subject)
    );
    
    const existingBank = payload.assignmentBanks.find(b => 
      b.studentId === assignment.studentId && b.subject === assignment.subject
    );

    const items = existingBank ? [...existingBank.items, { title: assignment.title, weight: assignment.weight }] : [{ title: assignment.title, weight: assignment.weight }];
    
    const newBank = {
      studentId: assignment.studentId,
      subject: assignment.subject,
      items
    };

    updatePayload({ assignmentBanks: [...existingBanks, newBank] });
  };

  const handleUploadExternalDoc = (doc) => {
    updatePayload({
      portfolio: {
        ...payload.portfolio,
        externalDocs: [...payload.portfolio.externalDocs, doc]
      }
    });
  };

  const handleToggleAutoReports = (enabled) => {
    updatePayload({
      portfolio: {
        ...payload.portfolio,
        autoReportsEnabled: enabled
      }
    });
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return payload.students.length > 0;
      case 4:
        return payload.startDates.length > 0;
      default:
        return true;
    }
  };

  const canSkip = () => {
    return [2, 3, 5].includes(currentStep);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">¡Bienvenido a Genial Skills Homeschool!</h2>
            <p className="text-gray-600">Configura tu hogar de aprendizaje en minutos.</p>
            ,<div></div>
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres cerrar el asistente?')) {
                  onFinish();
                }
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Paso {currentStep} de {totalSteps}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && (
            <Step1AddStudents
              students={payload.students}
              onAddStudent={handleAddStudent}
              onUpdateStudents={handleUpdateStudents}
            />
          )}
          {currentStep === 2 && (
            <Step2Cadence
              cadence={payload.cadence}
              onSelectCadence={handleSelectCadence}
              onSkip={skipStep}
            />
          )}
          {currentStep === 3 && (
            <Step3ApplyPlans
              students={payload.students}
              appliedPlans={payload.appliedPlans}
              onApplyPlan={handleApplyPlan}
              onSkip={skipStep}
            />
          )}
          {currentStep === 4 && (
            <Step4StartDates
              students={payload.students}
              appliedPlans={payload.appliedPlans}
              startDates={payload.startDates}
              onSetStartDate={handleSetStartDate}
            />
          )}
          {currentStep === 5 && (
            <Step5AssignmentBank
              students={payload.students}
              assignmentBanks={payload.assignmentBanks}
              onAddAssignment={handleAddAssignment}
              onSkip={skipStep}
            />
          )}
          {currentStep === 6 && (
            <Step6Portfolio
              portfolio={payload.portfolio}
              onUploadExternalDoc={handleUploadExternalDoc}
              onToggleAutoReports={handleToggleAutoReports}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <div className="flex gap-2">
              {canSkip() && (
                <button
                  onClick={skipStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Omitir este paso
                </button>
              )}
              <button
                onClick={nextStep}
                disabled={!canContinue()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === totalSteps ? 'Terminar y entrar al Dashboard' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
