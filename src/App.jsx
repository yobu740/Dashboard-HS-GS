import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Home, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Users2, 
  FolderOpen,
  Bell,
  Calendar,
  CalendarDays,
  Briefcase,
  Clock,
  Star,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Play,
  Settings,
  FileText,
  Plus,
  Palette,
  Presentation,
  Calculator
,
  Menu
} from 'lucide-react'
import mariaAvatar from './assets/maria-avatar.png'
import juanAvatar from './assets/juan-avatar.png'
import sofiaAvatar from './assets/sofia-avatar.png'
import logo from './assets/logo.svg'
import homeIcon from './assets/NavMenu-icon-Home.28a18adb10b1606f3726.svg'
import studentsIcon from './assets/NavMenu-icon-Students.4a0ed71e3b1455ec6541.svg'
import progressIcon from './assets/NavMenu-icon-Progress.dd0e0a014bbd772a2f18.svg'
import messagesIcon from './assets/NavMenu-icon-Messages.39300cea3a3040c7e48d.svg'
import teamsIcon from './assets/NavMenu-icon-Teams.b60747bd585e71e0e081.svg'
import catalogIcon from './assets/NavMenu-icon-Catalog.cdf34a75cac8cf3bc453.svg'
import calendarIcon from './assets/NavMenu-icon-Calendar.png'
import planningIcon from './assets/NavMenu-icon-Planning.png'
import portfolioIcon from './assets/NavMenu-icon-Portfolio.png'
import communityIcon from './assets/NavMenu-icon-Community.png'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNewOnboarding, NewOnboardingWizard, DashboardTour, WeeklyInsightsCard } from './NewOnboardingSystem.jsx'
import CatalogFilters from './CatalogFilters.jsx'
import StudentDetailModal from './StudentDetailModal.jsx'
import './App.css'
import './styles/drawer.css'

// Progress Area Component
const ProgressArea = () => {
  const { useMemo, useEffect } = React
  const [selectedStudent, setSelectedStudent] = useState("María González")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState("Todas")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [dateFrom, setDateFrom] = useState("2025-07-31")
  const [dateTo, setDateTo] = useState("2025-09-11")
  const [sortKey, setSortKey] = useState("fecha_desc")
  const [page, setPage] = useState(1)
  const pageSize = 5

  // Mock data
  const SUBJECT_COLORS = {
    Español: "#EF4444",
    Inglés: "#3B82F6", 
    Matemáticas: "#10B981",
    Ciencias: "#F59E0B",
    Sociales: "#8B5CF6",
  }

  const MOCK_BY_STUDENT = {
    "María González": {
      averages: [
        { subject: "Español", avg: 70 },
        { subject: "Inglés", avg: 72 },
        { subject: "Matemáticas", avg: 65 },
        { subject: "Ciencias", avg: 80 },
        { subject: "Sociales", avg: 55 },
      ],
      lessons: [
        { id: "204579", title: "El sistema solar", level: "8", subject: "Ciencias", average: 30, completed: false, lastWorkedAt: "2025-09-08T08:07:00-04:00" },
        { id: "201093", title: "Reading Comprehension", level: "8", subject: "Inglés", average: 30, completed: false, lastWorkedAt: "2025-09-05T08:52:00-04:00" },
        { id: "203373", title: "Proporcionalidad de triángulos", level: "10", subject: "Matemáticas", average: 57.14, completed: false, lastWorkedAt: "2025-08-29T08:13:00-04:00" },
        { id: "201367", title: "Word Recognition and Understanding", level: "8", subject: "Inglés", average: 21.42, completed: false, lastWorkedAt: "2025-08-26T09:16:00-04:00" },
        { id: "902", title: "División silábica", level: "2", subject: "Español", average: 11.11, completed: false, lastWorkedAt: "2025-08-19T19:44:00-04:00" },
      ],
    },
    "Juan Pérez": {
      averages: [
        { subject: "Español", avg: 62 },
        { subject: "Inglés", avg: 68 },
        { subject: "Matemáticas", avg: 73 },
        { subject: "Ciencias", avg: 58 },
        { subject: "Sociales", avg: 61 },
      ],
      lessons: [
        { id: "J101", title: "Fracciones propias e impropias", level: "5", subject: "Matemáticas", average: 74, completed: true, lastWorkedAt: "2025-09-10T10:00:00-04:00" },
        { id: "J102", title: "Energía y cambios", level: "6", subject: "Ciencias", average: 52, completed: false, lastWorkedAt: "2025-09-07T09:30:00-04:00" },
        { id: "J103", title: "Comprensión lectora B", level: "5", subject: "Español", average: 66, completed: false, lastWorkedAt: "2025-09-02T14:30:00-04:00" },
      ],
    },
    "Sofía López": {
      averages: [
        { subject: "Español", avg: 77 },
        { subject: "Inglés", avg: 71 },
        { subject: "Matemáticas", avg: 69 },
        { subject: "Ciencias", avg: 84 },
        { subject: "Sociales", avg: 63 },
      ],
      lessons: [
        { id: "S201", title: "Clasificación de seres vivos", level: "6", subject: "Ciencias", average: 86, completed: true, lastWorkedAt: "2025-09-09T13:00:00-04:00" },
        { id: "S202", title: "Vocabulario: contextos bilingües", level: "6", subject: "Inglés", average: 72, completed: false, lastWorkedAt: "2025-09-05T10:45:00-04:00" },
        { id: "S203", title: "Perímetro y área", level: "6", subject: "Matemáticas", average: 64, completed: false, lastWorkedAt: "2025-08-28T11:15:00-04:00" },
      ],
    },
  }

  const SORTERS = {
    promedio_asc: (a, b) => (a.average ?? 0) - (b.average ?? 0),
    promedio_desc: (a, b) => (b.average ?? 0) - (a.average ?? 0),
    fecha_asc: (a, b) => new Date(a.lastWorkedAt).getTime() - new Date(b.lastWorkedAt).getTime(),
    fecha_desc: (a, b) => new Date(b.lastWorkedAt).getTime() - new Date(a.lastWorkedAt).getTime(),
  }

  const raw = MOCK_BY_STUDENT[selectedStudent]

  const filteredLessons = useMemo(() => {
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : -Infinity
    const toMs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Infinity
    return raw.lessons.filter((l) => {
      const d = new Date(l.lastWorkedAt).getTime()
      const okDate = d >= fromMs && d <= toMs
      const okSubject = selectedSubject === "Todas" || l.subject === selectedSubject
      const okLevel = !selectedLevel || (l.level?.toString().toLowerCase() === selectedLevel.toLowerCase())
      return okDate && okSubject && okLevel
    }).sort(SORTERS[sortKey])
  }, [raw.lessons, dateFrom, dateTo, selectedSubject, selectedLevel, sortKey])

  const chartData = useMemo(() => {
    const base = raw.averages
    if (selectedSubject === "Todas") return base
    return base.map((d) => ({ ...d, highlight: d.subject === selectedSubject }))
  }, [raw.averages, selectedSubject])

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize))
  const pageData = filteredLessons.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [selectedSubject, selectedLevel, dateFrom, dateTo])

  const fmtDate = (iso) => new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", hour12: true })

  return (
    <div className="space-y-6">
      <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Progreso Académico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Estudiante</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm" 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                {Object.keys(MOCK_BY_STUDENT).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Materia</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm" 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {["Todas", "Español", "Inglés", "Matemáticas", "Ciencias", "Sociales"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Fecha desde</label>
              <input 
                type="date" 
                className="w-full border rounded-lg px-3 py-2 text-sm" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Fecha hasta</label>
              <input 
                type="date" 
                className="w-full border rounded-lg px-3 py-2 text-sm" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
              />
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Promedio por materia</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "Promedio"]} />
                  <Bar dataKey="avg" onClick={(d) => setSelectedSubject(d.subject)}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.subject] || "#9CA3AF"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Lessons Table */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Lecciones recientes</h3>
              <select 
                className="border rounded-lg px-2 py-1 text-sm" 
                value={sortKey} 
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="fecha_desc">Fecha (reciente primero)</option>
                <option value="fecha_asc">Fecha (antiguo primero)</option>
                <option value="promedio_desc">Promedio (alto a bajo)</option>
                <option value="promedio_asc">Promedio (bajo a alto)</option>
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-3">Lección</th>
                    <th className="py-2 pr-3">Materia</th>
                    <th className="py-2 pr-3">Promedio</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Última fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((lesson) => (
                    <tr key={lesson.id} className="border-b">
                      <td className="py-2 pr-3 font-medium">{lesson.title}</td>
                      <td className="py-2 pr-3">
                        <Badge style={{ backgroundColor: SUBJECT_COLORS[lesson.subject] }} className="text-white">
                          {lesson.subject}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">{lesson.average.toFixed(1)}%</td>
                      <td className="py-2 pr-3">
                        {lesson.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gray-500">{fmtDate(lesson.lastWorkedAt)}</td>
                    </tr>
                  ))}
                  {pageData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">
                        Sin lecciones para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3">
                <div className="text-xs text-gray-500">
                  Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredLessons.length)} de {filteredLessons.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page <= 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">{page} / {totalPages}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page >= totalPages} 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('inicio')
  const [calendarView, setCalendarView] = useState('month') // 'month' or 'week'
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [studentFilters, setStudentFilters] = useState({
    s1: true, // María
    s2: true, // Juan
    s3: true  // Sofía
  })
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [showCustomPlanning, setShowCustomPlanning] = useState(false)
  const [customPlanningSection, setCustomPlanningSection] = useState('lessons')
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showCatalogPlans, setShowCatalogPlans] = useState(false)
  const [showOptionB, setShowOptionB] = useState(false)
  const [showAssignmentCreation, setShowAssignmentCreation] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showStudentDetail, setShowStudentDetail] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Drag and Drop state
  const [lessons, setLessons] = useState([
    { id: 'lesson-1', content: '➕ Suma y Resta Básica (45 min)' },
    { id: 'lesson-2', content: '➕ Multiplicación por 2 (60 min)' },
    { id: 'lesson-3', content: '📘 Vocabulary: Animals (30 min)' },
    { id: 'lesson-4', content: '📘 Grammar: Present Simple (50 min)' },
    { id: 'lesson-5', content: '🔬 El Ciclo del Agua (40 min)' },
    { id: 'lesson-6', content: '✏️ Comprensión Lectora (45 min)' }
  ])
  
  const [weeklySchedule, setWeeklySchedule] = useState({
    'lesson-bank': lessons.map(lesson => lesson.id),
    'Lunes': [],
    'Martes': [],
    'Miércoles': [],
    'Jueves': [],
    'Viernes': []
  })

  // Onboarding system
  const {
    showWizard,
    showTour,
    showWeeklyInsights,
    completeWizard,
    completeTour,
    dismissWeeklyInsights,
  } = useNewOnboarding()

  // PDF Generation Function
  const generatePDF = () => {
    // Create a comprehensive PDF report
    const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Portafolio de Aprendizaje - Homeschool</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #FF6B35; font-size: 24px; font-weight: bold; }
        .title { font-size: 28px; color: #2C3E50; margin: 20px 0; }
        .student-info { background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .section { margin: 30px 0; }
        .section h2 { color: #2C3E50; border-bottom: 2px solid #3498DB; padding-bottom: 10px; }
        .progress-bar { background: #ECF0F1; height: 20px; border-radius: 10px; margin: 5px 0; }
        .progress-fill { height: 100%; border-radius: 10px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #BDC3C7; padding: 12px; text-align: left; }
        .table th { background: #3498DB; color: white; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin: 2px; }
        .badge-blue { background: #3498DB; color: white; }
        .badge-green { background: #27AE60; color: white; }
        .badge-orange { background: #F39C12; color: white; }
        .notes { background: #FFF3CD; padding: 15px; border-radius: 8px; border-left: 4px solid #F39C12; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">GENIAL SKILLS</div>
        <h1 class="title">Portafolio de Aprendizaje – Homeschool</h1>
        <div class="student-info">
            <h3>María González</h3>
            <p><strong>Grado:</strong> 2.º grado</p>
            <p><strong>Periodo:</strong> Agosto – Septiembre 2025</p>
            <p><em>"Aprender es crecer juntos cada día"</em></p>
        </div>
    </div>

    <div class="section">
        <h2>1. Resumen General de Progreso</h2>
        <table class="table">
            <tr>
                <th>Materia</th>
                <th>Progreso</th>
                <th>Lecciones Completadas</th>
                <th>Pendientes</th>
                <th>Tiempo Dedicado</th>
            </tr>
            <tr>
                <td>Inglés</td>
                <td>72%</td>
                <td>18</td>
                <td>7</td>
                <td>6h 30m</td>
            </tr>
            <tr>
                <td>Matemáticas</td>
                <td>90%</td>
                <td>12</td>
                <td>9</td>
                <td>5h 10m</td>
            </tr>
            <tr>
                <td>Ciencias</td>
                <td>78%</td>
                <td>8</td>
                <td>2</td>
                <td>3h 45m</td>
            </tr>
            <tr>
                <td>Español</td>
                <td>85%</td>
                <td>15</td>
                <td>5</td>
                <td>6h 00m</td>
            </tr>
            <tr>
                <td>Estudios Sociales</td>
                <td>82%</td>
                <td>10</td>
                <td>3</td>
                <td>4h 20m</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>2. Reporte por Materia</h2>
        
        <h3>Inglés</h3>
        <p><strong>Objetivo del trimestre:</strong> Manejar correctamente el verbo to be y leer cuentos cortos.</p>
        <p><strong>Habilidades dominadas:</strong> uso de am/is/are, comprensión de textos de 80-100 palabras.</p>
        <p><strong>En progreso:</strong> escritura de frases completas.</p>
        <p><strong>Sugerencia:</strong> reforzar con módulo "Avanza: Writing Basics".</p>

        <h3>Matemáticas</h3>
        <p><strong>Objetivo del trimestre:</strong> Dominar suma y resta hasta 100, comenzar multiplicaciones.</p>
        <p><strong>Habilidades dominadas:</strong> suma hasta 100.</p>
        <p><strong>En progreso:</strong> resta con llevadas.</p>
        <p><strong>Sugerencia:</strong> aplicar "Avanza: Operaciones básicas".</p>

        <h3>Ciencias</h3>
        <p><strong>Objetivo del trimestre:</strong> Introducir método científico y observaciones.</p>
        <p><strong>Logro:</strong> distingue observaciones cualitativas y cuantitativas.</p>
        <p><strong>Actividad destacada:</strong> experimento casero de volcanes con bicarbonato.</p>
    </div>

    <div class="section">
        <h2>3. Evidencias de Aprendizaje</h2>
        <ul>
            <li>Proyecto de volcán - experimento casero con bicarbonato</li>
            <li>Cuaderno de matemáticas - ejercicios de suma y resta</li>
            <li>Quiz completado en Genial Skills - calificación 85%</li>
            <li>Certificados digitales obtenidos</li>
        </ul>
    </div>

    <div class="section">
        <h2>4. Recompensas y Logros</h2>
        <h3>⭐ Insignias obtenidas:</h3>
        <div>
            <span class="badge badge-blue">Lectora Estrella</span> - por completar 5 lecturas en inglés
        </div>
        <div>
            <span class="badge badge-green">Matemática Genial</span> - por resolver 20 problemas en línea
        </div>
        
        <h3>🎯 Misiones cumplidas:</h3>
        <ul>
            <li>"3 días seguidos completando Ciencias"</li>
            <li>"Proyecto familiar de Ciencias: Experimento del volcán"</li>
        </ul>
    </div>

    <div class="section">
        <h2>5. Notas del Padre/Madre</h2>
        <div class="notes">
            <p>"María ha mostrado entusiasmo con Ciencias, especialmente en experimentos caseros. Requiere apoyo adicional en escritura en inglés, pero se nota motivada con el refuerzo de Avanza."</p>
            <p><strong>Observaciones adicionales:</strong></p>
            <ul>
                <li>Excelente progreso en fracciones matemáticas</li>
                <li>Necesita más práctica en comprensión lectora</li>
                <li>Muestra gran interés por los experimentos científicos</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>6. Planificación Próxima Semana</h2>
        <table class="table">
            <tr>
                <th>Día</th>
                <th>Materia</th>
                <th>Actividad</th>
                <th>Duración</th>
            </tr>
            <tr>
                <td>Lunes</td>
                <td>Matemáticas</td>
                <td>Suma y resta</td>
                <td>45 min</td>
            </tr>
            <tr>
                <td>Lunes</td>
                <td>Inglés</td>
                <td>Verb to be</td>
                <td>30 min</td>
            </tr>
            <tr>
                <td>Martes</td>
                <td>Ciencias</td>
                <td>El agua</td>
                <td>40 min</td>
            </tr>
            <tr>
                <td>Martes</td>
                <td>Español</td>
                <td>Lectura comprensiva</td>
                <td>35 min</td>
            </tr>
            <tr>
                <td>Miércoles</td>
                <td>Sociales</td>
                <td>Mi comunidad</td>
                <td>40 min</td>
            </tr>
        </table>
    </div>

    <div style="text-align: center; margin-top: 40px; color: #7F8C8D;">
        <p>Reporte generado el ${new Date().toLocaleDateString('es-ES')} por Genial Skills</p>
        <p>Dashboard Homeschool - Educación personalizada para tu familia</p>
    </div>
</body>
</html>
    `;

    // Create and download the PDF
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Portafolio-Aprendizaje-Maria-Gonzalez.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    alert('¡Reporte PDF generado exitosamente! Se ha descargado el archivo HTML que puedes convertir a PDF.');
  }

  // Catalog Plans Data
  const catalogPlans = [
    {
      "plan_id": "plan_eng_g2_15w",
      "title": "Inglés 2.º Grado – 15 semanas",
      "subject": "Inglés",
      "grade": 2,
      "duration_weeks": 15,
      "standards": ["DEPR-ENG2.GRAM.1", "DEPR-ENG2.READ.3"],
      "author": "Dra. A. Quintero",
      "context_pr": true,
      "weeks": [
        {
          "week": 1,
          "sessions": [
            {
              "title": "Verb to be (am/is/are)",
              "objective": "Usar 'am/is/are' en oraciones simples.",
              "resources": ["leccion://eng2-verb-to-be", "video://id123"],
              "assessment": {"type": "autoquiz", "id": "quiz-verb-tobe"},
              "tags": ["gramática", "básico"]
            }
          ]
        }
      ]
    },
    {
      "plan_id": "plan_math_g2_12w",
      "title": "Matemáticas 2.º Grado – 12 semanas",
      "subject": "Matemáticas",
      "grade": 2,
      "duration_weeks": 12,
      "standards": ["DEPR-MATH2.NUM.2", "DEPR-MATH2.GEO.1"],
      "author": "Prof. L. Rivera",
      "context_pr": true,
      "weeks": [
        {
          "week": 1,
          "sessions": [
            {
              "title": "Suma y resta hasta 100",
              "objective": "Resolver problemas sencillos de suma y resta.",
              "resources": ["leccion://math2-sum-resta", "worksheet://math2-sum-resta"],
              "assessment": {"type": "worksheet", "id": "worksheet-001"},
              "tags": ["aritmética", "básico"]
            }
          ]
        }
      ]
    },
    {
      "plan_id": "plan_sci_g2_10w",
      "title": "Ciencias 2.º Grado – 10 semanas",
      "subject": "Ciencias",
      "grade": 2,
      "duration_weeks": 10,
      "standards": ["DEPR-SCI2.OBS.1", "DEPR-SCI2.MAT.2"],
      "author": "MSc. C. Morales",
      "context_pr": true,
      "weeks": [
        {
          "week": 1,
          "sessions": [
            {
              "title": "Observaciones cualitativas y cuantitativas",
              "objective": "Distinguir entre observaciones con los sentidos y con instrumentos.",
              "resources": ["video://sci2-observaciones", "leccion://sci2-obs"],
              "assessment": {"type": "quiz", "id": "quiz-observaciones"},
              "tags": ["observación", "método científico"]
            }
          ]
        }
      ]
    }
  ]



  // Calendar data
  const calendarStudents = [
    {"id":"s1","name":"María","color":"#2979FF"},
    {"id":"s2","name":"Juan","color":"#2E7D32"},
    {"id":"s3","name":"Sofía","color":"#7B1FA2"}
  ]

  const [calendarEvents, setCalendarEvents] = useState([
    {
      "id":"e1",
      "title":"Verb to be (am/is/are)",
      "subject":"Inglés",
      "icon":"📘",
      "studentId":"s1",
      "objective":"Usar am/is/are en oraciones simples.",
      "start":"2025-09-15T09:00:00",
      "end":"2025-09-15T09:45:00",
      "status":"assigned"
    },
    {
      "id":"e2",
      "title":"Suma y resta hasta 100",
      "subject":"Matemáticas",
      "icon":"➕",
      "studentId":"s2",
      "objective":"Resolver problemas básicos hasta 100.",
      "start":"2025-09-15T10:30:00",
      "end":"2025-09-15T11:15:00",
      "status":"in_progress"
    },
    {
      "id":"e3",
      "title":"Observaciones cualitativas",
      "subject":"Ciencias",
      "icon":"🔬",
      "studentId":"s3",
      "objective":"Distinguir observaciones con los sentidos.",
      "start":"2025-09-16T14:00:00",
      "end":"2025-09-16T14:45:00",
      "status":"assigned"
    },
    {
      "id":"e4",
      "title":"Lectura guiada: cuento corto",
      "subject":"Español",
      "icon":"✏️",
      "studentId":"s1",
      "objective":"Comprender ideas principales de un texto breve.",
      "start":"2025-09-17T09:00:00",
      "end":"2025-09-17T09:40:00",
      "status":"completed"
    },
    {
      "id":"e5",
      "title":"Figuras geométricas básicas",
      "subject":"Matemáticas",
      "icon":"➕",
      "studentId":"s3",
      "objective":"Identificar triángulo, cuadrado y círculo.",
      "start":"2025-09-18T11:00:00",
      "end":"2025-09-18T11:40:00",
      "status":"assigned"
    },
    {
      "id":"e6",
      "title":"Contextos bilingües: vocabulario",
      "subject":"Inglés",
      "icon":"📘",
      "studentId":"s2",
      "objective":"Aplicar vocabulario en frases cotidianas.",
      "start":"2025-09-19T10:00:00",
      "end":"2025-09-19T10:45:00",
      "status":"assigned"
    },
    {
      "id":"e7",
      "title":"Mapa de Puerto Rico: regiones",
      "subject":"Estudios Sociales",
      "icon":"🌍",
      "studentId":"s1",
      "objective":"Reconocer regiones geográficas principales.",
      "start":"2025-09-22T13:00:00",
      "end":"2025-09-22T13:45:00",
      "status":"assigned"
    }
  ])



  // Student Detail View Component
  const StudentDetailView = ({ student, onClose }) => {
    const [range, setRange] = useState("weekly")
    const [subjectFilter, setSubjectFilter] = useState("Todas")
    const [notes, setNotes] = useState([
      { id: "n1", text: "Se motiva con experimentos. Reforzar escritura en inglés.", timestamp: "2025-09-11T08:45:00-04:00" },
      { id: "n2", text: "Reducir tiempo de pantalla entre sesiones.", timestamp: "2025-09-05T18:20:00-04:00" },
    ])
    const [noteText, setNoteText] = useState("")
    const [difficulties, setDifficulties] = useState([
      { id: "d1", skill: "Resta con llevadas", subject: "Matemáticas", accuracy: 42, lastTried: "2025-09-01T10:10:00-04:00", suggested: false },
      { id: "d2", skill: "Comprensión literal (inglés)", subject: "Inglés", accuracy: 55, lastTried: "2025-08-30T09:30:00-04:00", suggested: true },
      { id: "d3", skill: "Uso de mayúsculas", subject: "Español", accuracy: 48, lastTried: "2025-08-25T16:00:00-04:00", suggested: false },
    ])
    const [toast, setToast] = useState("")
    const [selectedActivity, setSelectedActivity] = useState(null)
    const [openResultados, setOpenResultados] = useState(false)

    const SUBJECT_COLORS = {
      Español: "#EF4444",
      Inglés: "#3B82F6", 
      Matemáticas: "#10B981",
      Ciencias: "#F59E0B",
      Sociales: "#8B5CF6",
    }

    const progressData = {
      weekly: [
        { subject: "Español", avg: student?.progress?.Español || 68 },
        { subject: "Inglés", avg: student?.progress?.Inglés || 71 },
        { subject: "Matemáticas", avg: student?.progress?.Matemáticas || 63 },
        { subject: "Ciencias", avg: student?.progress?.Ciencias || 78 },
        { subject: "Sociales", avg: student?.progress?.Sociales || 57 },
      ],
      monthly: [
        { subject: "Español", avg: student?.progress?.Español || 70 },
        { subject: "Inglés", avg: student?.progress?.Inglés || 72 },
        { subject: "Matemáticas", avg: student?.progress?.Matemáticas || 65 },
        { subject: "Ciencias", avg: student?.progress?.Ciencias || 80 },
        { subject: "Sociales", avg: student?.progress?.Sociales || 55 },
      ]
    }

    const activities = [
      { id: "a1", lesson: "El sistema solar", subject: "Ciencias", status: "completado", date: "2025-09-08T08:07:00-04:00", durationMin: 18 },
      { id: "a2", lesson: "Reading Comprehension", subject: "Inglés", status: "en_curso", date: "2025-09-05T08:52:00-04:00", durationMin: 12 },
      { id: "a3", lesson: "Proporcionalidad de triángulos", subject: "Matemáticas", status: "reprobado", date: "2025-08-29T08:13:00-04:00", durationMin: 20 },
      { id: "a4", lesson: "Word Recognition and Understanding", subject: "Inglés", status: "en_curso", date: "2025-08-26T09:16:00-04:00", durationMin: 9 },
      { id: "a5", lesson: "División silábica", subject: "Español", status: "reprobado", date: "2025-08-19T19:44:00-04:00", durationMin: 7 },
    ].filter(a => subjectFilter === "Todas" || a.subject === subjectFilter)

    const fmt = (iso) => new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", hour12: true })
    const fmtDate = (iso) => new Date(iso).toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico" })

    const addNote = () => {
      const text = noteText.trim()
      if(!text) return
      const note = { id: Date.now().toString(), text, timestamp: new Date().toISOString() }
      setNotes([note, ...notes])
      setNoteText("")
    }

    const suggestAvanza = (id) => {
      setDifficulties(difficulties.map(d => d.id===id? { ...d, suggested: true } : d))
      setToast("Se sugirió refuerzo en Avanza")
      setTimeout(() => setToast(""), 2000)
    }

    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="py-4 flex items-center gap-4">
            <Button onClick={onClose} variant="outline">
              ← Volver al Dashboard
            </Button>
            <div className="h-24 w-24 rounded-full overflow-hidden">
              <img src={student?.avatar || '/default-avatar.png'} alt={student?.name || 'Estudiante'} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{student?.name || 'Estudiante'}</h1>
              <p className="text-slate-500">{student?.grade || 'Grado'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(student?.badges || []).map((badge, index) => (
                  <span key={index} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border text-sm">
                    <Award className="w-4 h-4" /> {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Progress Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Progreso por materia</h2>
              <div className="inline-flex rounded-lg border overflow-hidden">
                <button 
                  className={`px-3 py-1.5 text-sm ${range==='weekly'? 'bg-slate-900 text-white':'bg-white'}`} 
                  onClick={()=>setRange('weekly')}
                >
                  Semanal
                </button>
                <button 
                  className={`px-3 py-1.5 text-sm ${range==='monthly'? 'bg-slate-900 text-white':'bg-white'}`} 
                  onClick={()=>setRange('monthly')}
                >
                  Mensual
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData[range]} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0,100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Promedio']} />
                  <Legend />
                  <Bar dataKey="avg">
                    {progressData[range].map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={SUBJECT_COLORS[entry.subject] || '#9CA3AF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Difficulties */}
          <aside className="rounded-2xl border p-4">
            <h2 className="font-semibold mb-2">Dificultades</h2>
            <ul className="space-y-3">
              {difficulties.map(d => (
                <li key={d.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{d.skill}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2.5 w-2.5 rounded-full" style={{background: SUBJECT_COLORS[d.subject]}} /> 
                          {d.subject}
                        </span>
                        <span>• Precisión: <strong>{d.accuracy}%</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.suggested && <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Sugerido</span>}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={d.suggested} 
                        onClick={()=>suggestAvanza(d.id)}
                      >
                        Sugerir Avanza
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* Activities */}
        <section className="rounded-2xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Últimas actividades</h2>
            <div className="text-sm text-slate-500">Materia: {subjectFilter}</div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">Lección</th>
                  <th className="py-2 pr-3">Materia</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Duración</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2 pr-3 font-medium text-slate-800">{a.lesson}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: SUBJECT_COLORS[a.subject] || '#9CA3AF' }} />
                        {a.subject}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {a.status === 'completado' && <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Completado</span>}
                      {a.status === 'en_curso' && <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">En curso</span>}
                      {a.status === 'reprobado' && <span className="px-2 py-1 text-xs rounded-full bg-rose-50 text-rose-700 border border-rose-200">Reprobado</span>}
                    </td>
                    <td className="py-2 pr-3">{fmt(a.date)}</td>
                    <td className="py-2 pr-3">{a.durationMin} min</td>
                    <td className="py-2 pr-3">
                      <Button size="sm" variant="outline" onClick={()=>{ setSelectedActivity(a); setOpenResultados(true); }}>
                        Resultados
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Parent Notes */}
        <section className="rounded-2xl border p-4">
          <h2 className="font-semibold mb-2">Comentarios del padre</h2>
          <div className="flex gap-2">
            <textarea 
              className="flex-1 border rounded-lg p-3" 
              placeholder="Añadir nota rápida…" 
              value={noteText} 
              onChange={e=>setNoteText(e.target.value)} 
            />
            <Button onClick={addNote}>Guardar</Button>
          </div>
          <ul className="mt-3 space-y-3">
            {notes.map(n => (
              <li key={n.id} className="border rounded-xl p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm">{n.text}</div>
                  <div className="text-xs text-slate-500 mt-1">{fmt(n.timestamp)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        {/* Results Modal */}
        {openResultados && selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpenResultados(false)} />
            <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Resultados — {selectedActivity.lesson}</h3>
                <Button variant="outline" onClick={() => setOpenResultados(false)}>✕</Button>
              </div>
              <div className="p-4 grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">Detalle</p>
                  <div className="mt-2 text-sm space-y-1">
                    <div><span className="text-slate-500">Materia:</span> <strong>{selectedActivity.subject}</strong></div>
                    <div><span className="text-slate-500">Estado:</span> <strong>{selectedActivity.status}</strong></div>
                    <div><span className="text-slate-500">Fecha:</span> {fmt(selectedActivity.date)}</div>
                    <div><span className="text-slate-500">Duración:</span> {selectedActivity.durationMin} min</div>
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">Intentos (mock)</p>
                  <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                    <li>Intento 1 — 60% (12 min)</li>
                    <li>Intento 2 — 80% (9 min)</li>
                    <li>Intento 3 — 90% (8 min)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Datos de ejemplo para los estudiantes
  const students = [
    {
      id: 1,
      name: 'María González',
      grade: '2.º Grado',
      avatar: mariaAvatar,
      progress: {
        'Español': 85,
        'Inglés': 72,
        'Matemáticas': 90,
        'Ciencias': 78,
        'Sociales': 82
      },
      badges: ['Lectora Estrella', 'Matemática Genial'],
      alerts: ['Dificultad con fracciones']
    },
    {
      id: 2,
      name: 'Juan Rodríguez',
      grade: '4.º Grado',
      avatar: juanAvatar,
      progress: {
        'Español': 78,
        'Inglés': 85,
        'Matemáticas': 75,
        'Ciencias': 88,
        'Sociales': 80
      },
      badges: ['Científico Curioso', 'Explorador'],
      alerts: ['5 días sin entrar a Ciencias']
    },
    {
      id: 3,
      name: 'Sofía Martínez',
      grade: '1.º Grado',
      avatar: sofiaAvatar,
      progress: {
        'Español': 92,
        'Inglés': 88,
        'Matemáticas': 85,
        'Ciencias': 90,
        'Sociales': 87
      },
      badges: ['Artista Creativa', 'Estudiante Ejemplar'],
      alerts: []
    }
  ]

  // Drag and Drop handler
  const handleOnDragEnd = (result) => {
    const { destination, source, draggableId } = result

    if (!destination) {
      return
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const start = weeklySchedule[source.droppableId]
    const finish = weeklySchedule[destination.droppableId]

    if (start === finish) {
      const newTaskIds = Array.from(start)
      newTaskIds.splice(source.index, 1)
      newTaskIds.splice(destination.index, 0, draggableId)

      const newColumn = {
        ...weeklySchedule,
        [source.droppableId]: newTaskIds,
      }

      setWeeklySchedule(newColumn)
      return
    }

    // Moving from one list to another
    const startTaskIds = Array.from(start)
    startTaskIds.splice(source.index, 1)
    const newStart = {
      ...weeklySchedule,
      [source.droppableId]: startTaskIds,
    }

    const finishTaskIds = Array.from(finish)
    finishTaskIds.splice(destination.index, 0, draggableId)
    const newFinish = {
      ...newStart,
      [destination.droppableId]: finishTaskIds,
    }

    setWeeklySchedule(newFinish)
  }

  // Actividades de la semana
  const weeklyActivities = [
    { day: 'Lunes', subject: 'Matemáticas', topic: 'Suma y resta', time: '9:00 AM', completed: true },
    { day: 'Lunes', subject: 'Inglés', topic: 'Verb to be', time: '10:30 AM', completed: true },
    { day: 'Martes', subject: 'Ciencias', topic: 'El agua', time: '9:00 AM', completed: false },
    { day: 'Martes', subject: 'Español', topic: 'Lectura comprensiva', time: '11:00 AM', completed: false },
    { day: 'Miércoles', subject: 'Sociales', topic: 'Mi comunidad', time: '9:00 AM', completed: false }
  ]

  const menuItems = [
    { id: 'inicio', icon: 'svg', lucideIcon: Home, label: 'Inicio' },
    { id: 'estudiantes', icon: 'svg', lucideIcon: Users, label: 'Estudiantes' },
    { id: 'planificacion', icon: 'lucide', lucideIcon: CalendarDays, label: 'Planificación' },
    { id: 'calendario', icon: 'lucide', lucideIcon: Calendar, label: 'Calendario' },
    { id: 'catalogo', icon: 'svg', lucideIcon: FolderOpen, label: 'Catálogo' },
    { id: 'portafolio', icon: 'lucide', lucideIcon: Briefcase, label: 'Portafolio' },
    { id: 'teams', icon: 'svg', lucideIcon: Users2, label: 'Tutoría' },
    { id: 'mensajeria', icon: 'svg', lucideIcon: MessageSquare, label: 'Mensajería' },
    { id: 'comunidad', icon: 'lucide', lucideIcon: Users, label: 'Comunidad' }
  ]

  const getSubjectColor = (subject) => {
    const colors = {
      'Español': 'bg-red-500',
      'Inglés': 'bg-blue-500',
      'Matemáticas': 'bg-green-500',
      'Ciencias': 'bg-purple-500',
      'Sociales': 'bg-orange-500'
    }
    return colors[subject] || 'bg-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
        {/* Botón MENÚ - SOLO móvil */}
        <button
          className="md:hidden inline-flex items-center gap-2 px-3 py-2 border border-white/50 rounded-md"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
          <span className="text-sm">Menú</span>
        </button>

          <img src={logo} alt="Genial Skills" className="h-8" />
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" className="bg-transparent text-white border-white/70 hover:bg-transparent hover:text-white hover:border-white/90 focus:ring-0">
            <Bell className="w-4 h-4 mr-2" />
            Ayuda
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">B</span>
            </div>
            <span>Brian</span>
          </div>
        </div>
      </header>

      {/* Drawer móvil */}
      {drawerOpen && (
        <>
          <div className="gs-Drawer__Overlay md:hidden" onClick={() => setDrawerOpen(false)} />
          <aside className={`gs-Drawer__Panel md:hidden ${drawerOpen ? 'is-open' : ''}`}>
            <nav className="p-3 space-y-1">
              {menuItems.map((item) => {
                const LucideIcon = item.lucideIcon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    data-menu={item.id}
                    onClick={() => { setActiveSection(item.id); setDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      active ? 'bg-yellow-700 text-white' : 'text-yellow-50 hover:bg-yellow-700 hover:text-white'
                    }`}
                  >
                    {item.icon === 'svg' ? (
                      <img 
                        src={
                          item.id === 'inicio' ? homeIcon :
                          item.id === 'estudiantes' ? studentsIcon :
                          item.id === 'mensajeria' ? messagesIcon :
                          item.id === 'teams' ? teamsIcon :
                          item.id === 'catalogo' ? catalogIcon :
                          item.id === 'calendario' ? calendarIcon :
                          item.id === 'planificacion' ? planningIcon :
                          item.id === 'portafolio' ? portfolioIcon :
                          item.id === 'comunidad' ? communityIcon : ''
                        } 
                        alt={item.label} 
                        className="w-5 h-5"
                      />
                    ) : (
                      <LucideIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </>
      )}


      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-32 min-h-screen" style={{backgroundColor: '#c0a267'}}>
          <nav className="p-4">
            {menuItems.map((item) => {
              const LucideIcon = item.lucideIcon
              return (
                <button
                  key={item.id}
                  data-menu={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex flex-col items-center justify-center px-2 py-3 mb-2 rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-yellow-700 text-white' 
                      : 'text-yellow-100 hover:bg-yellow-700 hover:text-white'
                  }`}
                >
                  {item.icon === 'svg' ? (
                    <img 
                      src={item.id === 'inicio' ? homeIcon : 
                           item.id === 'estudiantes' ? studentsIcon :
                           item.id === 'mensajeria' ? messagesIcon :
                           item.id === 'teams' ? teamsIcon :
                           item.id === 'catalogo' ? catalogIcon : ''} 
                      alt={item.label} 
                      className="mb-1" 
                      style={{width: '25px', height: '25px'}}
                    />
                  ) : (
                    <LucideIcon style={{width: '25px', height: '25px'}} className="mb-1" />
                  )}
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSection === 'inicio' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Bienvenido, Brian
                </h1>
                <p className="text-gray-600">
                  Aquí está el progreso de tus hijos esta semana
                </p>
              </div>

              {/* Student Cards */}
              <div id="cards-hijos" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {students.map((student) => (
                  <Card key={student.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center pb-4">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                        <img 
                          src={student.avatar} 
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <p className="text-sm text-gray-600">{student.grade}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(student.progress).map(([subject, progress]) => (
                          <div key={subject} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{subject}</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        ))}
                      </div>
                      
                      {/* Badges */}
                      <div className="mt-4 flex flex-wrap gap-1">
                        {student.badges.map((badge, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {badge}
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentDetail(true);
                        }}
                      >
                        Ver Detalle
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Alerts and Recommendations */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                    Alertas y Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <strong>María</strong> tiene dificultad con fracciones. Te sugerimos aplicar refuerzo en Avanza.
                        </p>
                        <Button size="sm" className="mt-2">
                          Asignar Refuerzo
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                      <Clock className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <strong>Juan</strong> lleva 5 días sin entrar a Ciencias. Revisa su plan.
                        </p>
                        <Button size="sm" variant="outline" className="mt-2">
                          Revisar Plan
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <strong>Juan</strong> ha sacado en dos ocasiones 70 en la lección de suma de fracciones. Le recomendamos esta lección básica de fracciones.
                        </p>
                        <Button size="sm" className="mt-2">
                          Asignar Lección
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Calendar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Agenda Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {weeklyActivities.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${activity.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{activity.topic}</p>
                                <p className="text-xs text-gray-600">{activity.subject} - {activity.day}</p>
                              </div>
                              <span className="text-xs text-gray-500">{activity.time}</span>
                            </div>
                          </div>
                          {activity.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Study Time Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Tiempo de Estudio (Últimos 7 días)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium text-gray-600">Estudiante</th>
                            <th className="text-left py-2 font-medium text-gray-600">Materia</th>
                            <th className="text-left py-2 font-medium text-gray-600">Horas</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">María González</td>
                            <td className="py-2">Matemáticas</td>
                            <td className="py-2">5h 30m</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Juan Rodríguez</td>
                            <td className="py-2">Inglés</td>
                            <td className="py-2">4h 15m</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Sofía Martínez</td>
                            <td className="py-2">Ciencias</td>
                            <td className="py-2">3h 00m</td>
                          </tr>
                          <tr>
                            <td className="py-2">María González</td>
                            <td className="py-2">Español</td>
                            <td className="py-2">6h 00m</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Calendario Rápido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">Aquí puedes ver un resumen de tu calendario.</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {/* Mini Calendar */}
                      <div className="text-center mb-3">
                        <div className="text-sm font-semibold text-gray-700">Septiembre 2025</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {/* Days of week */}
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                          <div key={index} className="text-center font-semibold text-gray-500 py-1">
                            {day}
                          </div>
                        ))}
                        {/* Calendar days */}
                        {Array.from({ length: 35 }, (_, i) => {
                          const day = i - 6 + 1; // Start from Sunday
                          const isCurrentMonth = day > 0 && day <= 30;
                          const isToday = day === 11; // Today is 11th
                          const hasEvent = [12, 15, 18, 22].includes(day); // Days with events
                          
                          return (
                            <div
                              key={i}
                              className={`text-center py-1 rounded ${
                                !isCurrentMonth 
                                  ? 'text-gray-300' 
                                  : isToday 
                                    ? 'bg-blue-500 text-white font-semibold' 
                                    : hasEvent 
                                      ? 'bg-orange-100 text-orange-700 font-medium' 
                                      : 'text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {isCurrentMonth ? day : ''}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        <div className="flex items-center justify-center space-x-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded mr-1"></div>
                            <span>Hoy</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-orange-400 rounded mr-1"></div>
                            <span>Eventos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button className="h-16 flex flex-col items-center justify-center space-y-2">
                      <BookOpen className="w-6 h-6" />
                      <span>Aplicar Planificación</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
                      <Target className="w-6 h-6" />
                      <span>Asignar Quiz</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-2">
                      <Star className="w-6 h-6" />
                      <span>Crear Recompensa</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex flex-col items-center justify-center space-y-2 bg-red-50 hover:bg-red-100 border-red-200"
                      onClick={generatePDF}
                    >
                      <FileText className="w-6 h-6 text-red-600" />
                      <span className="text-red-600">Exportar PDF</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Catálogo Section */}
          {activeSection === 'catalogo' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Catálogo de lecciones</h1>
                <Button variant="outline" size="sm" className="text-gray-600">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Mostrar catálogo
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                  <CatalogFilters onFiltersChange={(filters) => console.log('Filters changed:', filters)} />
                </div>

                {/* Lessons Grid */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Sample Lessons */}
                    {[
                      {
                        title: 'Suma de Fracciones',
                        subject: 'Matemáticas',
                        grade: '3.º Grado',
                        duration: '25 min',
                        difficulty: 'Básico',
                        color: 'bg-green-500'
                      },
                      {
                        title: 'El Ciclo del Agua',
                        subject: 'Ciencias',
                        grade: '2.º Grado',
                        duration: '30 min',
                        difficulty: 'Intermedio',
                        color: 'bg-purple-500'
                      },
                      {
                        title: 'Verb to Be',
                        subject: 'English',
                        grade: '4.º Grado',
                        duration: '20 min',
                        difficulty: 'Básico',
                        color: 'bg-blue-500'
                      },
                      {
                        title: 'Lectura Comprensiva',
                        subject: 'Español',
                        grade: '1.º Grado',
                        duration: '35 min',
                        difficulty: 'Básico',
                        color: 'bg-red-500'
                      },
                      {
                        title: 'Mi Comunidad',
                        subject: 'Estudios Sociales',
                        grade: '2.º Grado',
                        duration: '40 min',
                        difficulty: 'Intermedio',
                        color: 'bg-orange-500'
                      },
                      {
                        title: 'Fracciones Básicas',
                        subject: 'Matemáticas',
                        grade: '2.º Grado',
                        duration: '30 min',
                        difficulty: 'Básico',
                        color: 'bg-green-500'
                      }
                    ].map((lesson, index) => (
                      <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="w-full h-24 rounded-lg mb-3 overflow-hidden">
                            <img 
                              src="/catalog-default.jpg" 
                              alt="Lesson Image" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardTitle className="text-lg">{lesson.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {lesson.subject}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {lesson.grade}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Duración:</span>
                              <span>{lesson.duration}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Dificultad:</span>
                              <span>{lesson.difficulty}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Button className="w-full" size="sm">
                              Asignar Lección
                            </Button>
                            <Button variant="outline" className="w-full" size="sm">
                              Vista Previa
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Community Section */}
          {activeSection === 'comunidad' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Comunidad y Apoyo
                </h1>
                <p className="text-gray-600">
                  Conecta con otros padres homeschoolers y accede a recursos de apoyo
                </p>
              </div>

              {/* Community Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Forum/Chat */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span>Foro de Padres</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Conecta con otros padres homeschoolers, comparte experiencias y resuelve dudas.
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-500">Temas recientes:</div>
                      <div className="text-sm">• Estrategias para matemáticas en 2do grado</div>
                      <div className="text-sm">• Recursos de ciencias para experimentos</div>
                      <div className="text-sm">• Planificación de horarios efectivos</div>
                    </div>
                    <Button className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Acceder al Foro
                    </Button>
                  </CardContent>
                </Card>

                {/* Extra Resources */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span>Recursos Extra</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Guías pedagógicas, estrategias de enseñanza y tips educativos.
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-500">Disponibles:</div>
                      <div className="text-sm">• Guía de estrategias pedagógicas</div>
                      <div className="text-sm">• Tips para motivar el aprendizaje</div>
                      <div className="text-sm">• Métodos de evaluación efectivos</div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Ver Recursos
                    </Button>
                  </CardContent>
                </Card>

                {/* Support */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-orange-600" />
                      <span>Soporte Técnico</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Obtén ayuda directa del equipo de Genial Skills vía ticket o chat.
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-500">Opciones de contacto:</div>
                      <div className="text-sm">• Chat en vivo (Lun-Vie 8AM-6PM)</div>
                      <div className="text-sm">• Sistema de tickets 24/7</div>
                      <div className="text-sm">• Base de conocimientos</div>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Iniciar Chat
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Bell className="w-4 h-4 mr-2" />
                        Crear Ticket
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Community Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">1,247</div>
                    <div className="text-sm text-gray-600">Padres Activos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">89</div>
                    <div className="text-sm text-gray-600">Discusiones Hoy</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">156</div>
                    <div className="text-sm text-gray-600">Recursos Compartidos</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">4.8/5</div>
                    <div className="text-sm text-gray-600">Satisfacción</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Calendar Section */}
          {activeSection === 'calendario' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario Académico</h1>
                  <p className="text-gray-600">Gestiona las lecciones asignadas a tus estudiantes</p>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={calendarView === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCalendarView('month')}
                  >
                    Mes
                  </Button>
                  <Button 
                    variant={calendarView === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCalendarView('week')}
                  >
                    Semana
                  </Button>
                </div>
              </div>

              {/* Filters and Legend */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                {/* Student Filters */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Estudiantes:</span>
                  {calendarStudents.map(student => (
                    <label key={student.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studentFilters[student.id]}
                        onChange={(e) => setStudentFilters(prev => ({
                          ...prev,
                          [student.id]: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: student.color }}
                      ></div>
                      <span className="text-sm">{student.name}</span>
                    </label>
                  ))}
                </div>

                {/* Subject Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Materia:</span>
                  <select 
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">Todas</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Matemáticas">Matemáticas</option>
                    <option value="Ciencias">Ciencias</option>
                    <option value="Español">Español</option>
                    <option value="Estudios Sociales">Estudios Sociales</option>
                  </select>
                </div>
              </div>

              {/* Calendar Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Septiembre 2025</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 border-2 border-gray-400 rounded"></div>
                        <span>Asignado</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                        <span>En progreso</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-400 rounded opacity-60"></div>
                        <span>Completado</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {calendarView === 'month' ? (
                    <div className="grid grid-cols-7 gap-1">
                      {/* Days of week header */}
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="p-2 text-center font-semibold text-gray-600 border-b">
                          {day}
                        </div>
                      ))}
                      
                      {/* Calendar days */}
                      {Array.from({ length: 35 }, (_, i) => {
                        const day = i + 1;
                        const isCurrentMonth = day <= 30;
                        const dayEvents = calendarEvents.filter(event => {
                          const eventDate = new Date(event.start);
                          const eventDay = eventDate.getDate();
                          const isVisible = studentFilters[event.studentId] && 
                                          (subjectFilter === 'all' || event.subject === subjectFilter);
                          return eventDay === day && isVisible;
                        });
                        
                        return (
                          <div key={i} className="min-h-[100px] p-1 border border-gray-200">
                            {isCurrentMonth && (
                              <>
                                <div className="text-sm font-medium text-gray-700 mb-1">{day}</div>
                                <div className="space-y-1">
                                  {dayEvents.map(event => {
                                    const student = calendarStudents.find(s => s.id === event.studentId);
                                    const startTime = new Date(event.start).toLocaleTimeString('es-PR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    });
                                    
                                    return (
                                      <div
                                        key={event.id}
                                        className={`text-xs p-1 rounded cursor-pointer transition-all hover:shadow-md ${
                                          event.status === 'completed' ? 'opacity-60' : ''
                                        } ${
                                          event.status === 'in_progress' ? 'border-l-4 border-yellow-400' : ''
                                        }`}
                                        style={{ 
                                          backgroundColor: student?.color + '20',
                                          borderColor: event.status === 'assigned' ? student?.color : undefined,
                                          borderWidth: event.status === 'assigned' ? '2px' : undefined
                                        }}
                                        onClick={() => {
                                          setSelectedEvent(event);
                                          setShowEventModal(true);
                                        }}
                                        title={`${event.title} - ${student?.name} - ${event.subject}`}
                                      >
                                        <div className="flex items-center space-x-1">
                                          <span>{event.icon}</span>
                                          <span className="truncate">{event.title}</span>
                                          {event.status === 'completed' && <span>✓</span>}
                                        </div>
                                        <div className="text-gray-600">{startTime}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Week View */
                    <div className="space-y-4">
                      <div className="text-center font-semibold text-gray-700">
                        Semana del 15 - 21 de Septiembre, 2025
                      </div>
                      <div className="grid grid-cols-8 gap-2">
                        <div className="font-semibold text-gray-600">Hora</div>
                        {['Lun 15', 'Mar 16', 'Mié 17', 'Jue 18', 'Vie 19', 'Sáb 20', 'Dom 21'].map(day => (
                          <div key={day} className="text-center font-semibold text-gray-600 p-2 border-b">
                            {day}
                          </div>
                        ))}
                        
                        {/* Time slots */}
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour = i + 8; // 8 AM to 7 PM
                          return (
                            <React.Fragment key={hour}>
                              <div className="text-sm text-gray-500 p-2">
                                {hour}:00
                              </div>
                              {Array.from({ length: 7 }, (_, dayIndex) => {
                                const dayDate = 15 + dayIndex;
                                const dayEvents = calendarEvents.filter(event => {
                                  const eventDate = new Date(event.start);
                                  const eventDay = eventDate.getDate();
                                  const eventHour = eventDate.getHours();
                                  const isVisible = studentFilters[event.studentId] && 
                                                  (subjectFilter === 'all' || event.subject === subjectFilter);
                                  return eventDay === dayDate && eventHour === hour && isVisible;
                                });
                                
                                return (
                                  <div key={dayIndex} className="min-h-[60px] p-1 border border-gray-100">
                                    {dayEvents.map(event => {
                                      const student = calendarStudents.find(s => s.id === event.studentId);
                                      return (
                                        <div
                                          key={event.id}
                                          className={`text-xs p-2 rounded cursor-pointer transition-all hover:shadow-md ${
                                            event.status === 'completed' ? 'opacity-60' : ''
                                          } ${
                                            event.status === 'in_progress' ? 'border-l-4 border-yellow-400' : ''
                                          }`}
                                          style={{ 
                                            backgroundColor: student?.color + '20',
                                            borderColor: event.status === 'assigned' ? student?.color : undefined,
                                            borderWidth: event.status === 'assigned' ? '2px' : undefined
                                          }}
                                          onClick={() => {
                                            setSelectedEvent(event);
                                            setShowEventModal(true);
                                          }}
                                        >
                                          <div className="flex items-center space-x-1">
                                            <span>{event.icon}</span>
                                            <span className="truncate">{event.title}</span>
                                            {event.status === 'completed' && <span>✓</span>}
                                          </div>
                                          <div className="text-gray-600">{student?.name}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Modal */}
              {showEventModal && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">Detalles de la Lección</h3>
                      <button 
                        onClick={() => setShowEventModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Student */}
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: calendarStudents.find(s => s.id === selectedEvent.studentId)?.color }}
                        ></div>
                        <span className="font-medium">
                          {calendarStudents.find(s => s.id === selectedEvent.studentId)?.name}
                        </span>
                      </div>
                      
                      {/* Subject and Title */}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{selectedEvent.icon}</span>
                          <span className="font-medium">{selectedEvent.subject}</span>
                        </div>
                        <h4 className="text-lg font-semibold">{selectedEvent.title}</h4>
                      </div>
                      
                      {/* Objective */}
                      <div>
                        <span className="text-sm text-gray-600">Objetivo:</span>
                        <p className="text-sm">{selectedEvent.objective}</p>
                      </div>
                      
                      {/* Date and Duration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Fecha/Hora:</span>
                          <p className="text-sm">
                            {new Date(selectedEvent.start).toLocaleDateString('es-PR')} <br />
                            {new Date(selectedEvent.start).toLocaleTimeString('es-PR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Duración:</span>
                          <p className="text-sm">
                            {Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / (1000 * 60))} min
                          </p>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div>
                        <span className="text-sm text-gray-600">Estado:</span>
                        <select 
                          value={selectedEvent.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setCalendarEvents(prev => prev.map(event => 
                              event.id === selectedEvent.id 
                                ? { ...event, status: newStatus }
                                : event
                            ));
                            setSelectedEvent({ ...selectedEvent, status: newStatus });
                          }}
                          className="ml-2 text-sm border rounded px-2 py-1"
                        >
                          <option value="assigned">Asignado</option>
                          <option value="in_progress">En progreso</option>
                          <option value="completed">Completado</option>
                        </select>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-4">
                        <Button variant="outline" className="flex-1" disabled>
                          Ver Recursos
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Reprogramar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Planning Section */}
          {activeSection === 'planificacion' && !showCustomPlanning && !showCatalogPlans && !showOptionB && !showAssignmentCreation && (
            <div className="space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Gestión Académica
                </h1>
                <p className="text-gray-600">
                  Planifica y organiza el aprendizaje de tus estudiantes
                </p>
              </div>

              {/* Planning Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Pre-made Planning */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span>Planificación Pre-hecha</span>
                      <Badge variant="secondary">Recomendada</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Currículos diseñados por especialistas en educación, alineados al DEPR y estándares internacionales.
                    </p>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded"></div>
                        <span className="text-sm">📑 Currículos sugeridos por académicos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded"></div>
                        <span className="text-sm">🖊️ Totalmente editable y personalizable</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded"></div>
                        <span className="text-sm">🎯 Guías pedagógicas incluidas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded"></div>
                        <span className="text-sm">🔄 Actualizaciones automáticas</span>
                      </div>
                    </div>
                    

                    
                    <Button className="w-full" onClick={() => setShowCatalogPlans(true)}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Explorar Planes Sugeridos
                    </Button>
                  </CardContent>
                </Card>

                {/* Personalized Planning */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-green-600" />
                      <span>Planificación Personalizada</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Crea tu propio plan educativo desde cero o combina con planificaciones pre-hechas.
                    </p>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded"></div>
                        <span className="text-sm">🎛️ Interfaz "arrastrar y soltar"</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded"></div>
                        <span className="text-sm">📅 Integración con calendario</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded"></div>
                        <span className="text-sm">🔗 Combina planes propios y sugeridos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded"></div>
                        <span className="text-sm">💡 Flexibilidad total</span>
                      </div>
                    </div>
                    

                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => setShowCustomPlanning(true)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Crear Plan Personalizado
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Evaluation and Feedback Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>📝 Evaluación y Retroalimentación</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Crear Asignaciones</h4>
                    <p className="text-sm text-gray-600">
                      Diseña tareas y proyectos personalizados para tus estudiantes.
                    </p>
                    <div className="space-y-2">
                      <Button size="sm" className="w-full" onClick={() => setShowAssignmentCreation(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Asignación
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        Plantillas de Tareas
                      </Button>
                    </div>
                  </div>
                  
                  {/* Evaluation Summary */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-4">Resumen de Evaluaciones</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">12</div>
                          <div className="text-sm text-gray-600">Asignaciones Activas</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">8</div>
                          <div className="text-sm text-gray-600">Completadas</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">24</div>
                          <div className="text-sm text-gray-600">Observaciones</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">6</div>
                          <div className="text-sm text-gray-600">Rúbricas Usadas</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Custom Planning Interface */}
          {activeSection === 'planificacion' && showCustomPlanning && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Planificación personalizada</h1>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowCustomPlanning(false)}
                  >
                    ← Atrás
                  </Button>
                  <Button className="bg-gradient-to-r from-green-500 to-blue-400 text-white">
                    Aplicar planificación pre‑hecha
                  </Button>
                  <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setShowOptionB(true)}>
                    Opción B
                  </Button>
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-dashed border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>Nota:</strong> Los planes se cierran al llegar la fecha límite del período académico. Las tareas no completadas antes del cierre recibirán 0. Después del cierre, nadie podrá editar. Para puntuaciones, ir a entregables.
                </p>
              </div>

              {/* Metadata */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex flex-wrap gap-6 text-gray-700 text-sm">
                  <span><strong>Plan semanal</strong>: 11–17 septiembre 2025</span>
                  <span><strong>Grupo</strong>: Familia González</span>
                  <span><strong>Materia y grado</strong>: Estudios Sociales (2.º)</span>
                </div>
                <div className="flex flex-wrap gap-6 text-gray-700 text-sm mt-2">
                  <span><strong>Periodo académico</strong>: 05 sep 2023 – 31 may 2030</span>
                  <span><strong>Año académico</strong>: 29 ago 2023 – 31 may 2030</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-6 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Planificación (Cotejo)</h3>
                        <button 
                          className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'checklist' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => setCustomPlanningSection('checklist')}
                        >
                          Cotejo general
                        </button>
                      </div>

                      <div>
                        <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Contenido Genial</h3>
                        <div className="space-y-1">
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'lessons' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('lessons')}
                          >
                            Lecciones
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'forums' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('forums')}
                          >
                            Foros
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'assignments' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('assignments')}
                          >
                            Asignaciones
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Contenido libre</h3>
                        <div className="space-y-1">
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'freeLessons' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('freeLessons')}
                          >
                            Lecciones
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'cross' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('cross')}
                          >
                            Integración con otras materias
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'innovation' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('innovation')}
                          >
                            Iniciativa o proyecto innovador
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'assessment' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('assessment')}
                          >
                            Evaluación y avalúos
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'differentiation' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('differentiation')}
                          >
                            Instrucción Diferenciada
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'materials' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('materials')}
                          >
                            Materiales
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'accommodations' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('accommodations')}
                          >
                            Acomodos razonables
                          </button>
                          <button 
                            className={`w-full text-left p-2 rounded text-sm ${customPlanningSection === 'reflection' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => setCustomPlanningSection('reflection')}
                          >
                            Reflexión de praxis
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    {/* Breadcrumb */}
                    <nav className="text-sm text-gray-500 mb-4">
                      <span>Contenido Genial</span> / <span>Lecciones</span>
                    </nav>

                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Lecciones</h2>
                      <div className="flex gap-3">
                        <select className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 text-sm">
                          <option value="">Todos los estudiantes</option>
                          <option value="maria">María</option>
                          <option value="juan">Juan</option>
                          <option value="sofia">Sofía</option>
                        </select>
                        <select className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 text-sm">
                          <option value="">Todos los estados</option>
                          <option value="draft">Borrador</option>
                          <option value="assigned">Asignado</option>
                          <option value="closed">Cerrado</option>
                        </select>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => setShowPlanningModal(true)}
                        >
                          ➕ Crear nueva
                        </Button>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <p className="text-gray-600">Añada elementos a su planificación</p>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                            <th className="pb-3">Título</th>
                            <th className="pb-3">Tipo</th>
                            <th className="pb-3">Estudiante</th>
                            <th className="pb-3">Fecha inicio</th>
                            <th className="pb-3">Fecha fin</th>
                            <th className="pb-3">Cuenta para nota</th>
                            <th className="pb-3">Disponibilidad</th>
                            <th className="pb-3">Estado</th>
                            <th className="pb-3"></th>
                          </tr>
                        </thead>
                        <tbody className="space-y-2">
                          {/* Empty state */}
                          <tr>
                            <td colSpan="9" className="pt-8">
                              <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-500 mb-4">No tiene elementos agregados en esta sección.</p>
                                <Button 
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => setShowPlanningModal(true)}
                                >
                                  ➕ Crear nueva
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Planning Modal */}
          {showPlanningModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Nuevo elemento</h3>
                  <button 
                    onClick={() => setShowPlanningModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* First row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Tipo</label>
                      <select className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2">
                        <option value="lesson">Lección</option>
                        <option value="forum">Foro</option>
                        <option value="assignment">Asignación</option>
                        <option value="freeLesson">Lección (Contenido libre)</option>
                        <option value="cross">Integración con otras materias</option>
                        <option value="innovation">Iniciativa/Proyecto innovador</option>
                        <option value="assessment">Evaluación/Avalúo</option>
                        <option value="differentiation">Instrucción Diferenciada</option>
                        <option value="materials">Materiales</option>
                        <option value="accommodations">Acomodos razonables</option>
                        <option value="reflection">Reflexión de praxis</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Estudiante</label>
                      <select className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2">
                        <option value="maria">María</option>
                        <option value="juan">Juan</option>
                        <option value="sofia">Sofía</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Cuenta para nota</label>
                      <select className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2">
                        <option value="no">No</option>
                        <option value="yes">Sí</option>
                      </select>
                    </div>
                  </div>

                  {/* Second row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Título</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Lectura guiada: cuento corto"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Estado</label>
                      <select className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2">
                        <option value="assigned">Asignado</option>
                        <option value="draft">Borrador</option>
                        <option value="closed">Cerrado</option>
                      </select>
                    </div>
                  </div>

                  {/* Third row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Fecha inicio</label>
                      <input 
                        type="datetime-local"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Fecha fin</label>
                      <input 
                        type="datetime-local"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Disponibilidad</label>
                      <select className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2">
                        <option value="scheduled">Programada</option>
                        <option value="always">Siempre</option>
                        <option value="hidden">Oculta</option>
                      </select>
                    </div>
                  </div>

                  {/* Text areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Objetivo / Propósito</label>
                      <textarea 
                        placeholder="Describe el objetivo de aprendizaje"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 h-20 resize-none"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Evaluación y avalúos (rúbrica / autoquiz / evidencia)</label>
                      <textarea 
                        placeholder="Ej. Quiz automático de 5 ítems; rúbrica 1-4; entrega de foto"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 h-20 resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Instrucción Diferenciada</label>
                      <textarea 
                        placeholder="Adaptaciones de instrucción para niveles/estilos"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 h-20 resize-none"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Acomodos razonables</label>
                      <textarea 
                        placeholder="Tiempo extendido, lectura en voz alta, letra ampliada, etc."
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 h-20 resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Materiales</label>
                      <textarea 
                        placeholder="Lista de materiales/recursos"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 h-20 resize-none"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Integración con otras materias</label>
                      <textarea 
                        placeholder="Vincula con Inglés/Matemáticas/Ciencias/Sociales"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 h-20 resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Iniciativa o proyecto innovador</label>
                      <textarea 
                        placeholder="Proyecto transversal o de impacto"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 h-20 resize-none"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Reflexión de praxis (del padre)</label>
                      <textarea 
                        placeholder="Qué funcionó, qué ajustar para la próxima semana"
                        className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2 h-20 resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Enlaces / Recursos (separados por coma)</label>
                    <input 
                      type="text" 
                      placeholder="https://..., https://..."
                      className="w-full bg-white border border-gray-300 text-gray-700 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowPlanningModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button className="bg-gradient-to-r from-green-500 to-blue-400 text-white">
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Portafolio Section */}
          {activeSection === 'portafolio' && (
            <main className="flex-1 p-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Portafolio del Estudiante</h2>
                <p className="text-gray-600">Genera un portafolio para tu hijo con todas las lecciones, proyectos y evaluaciones.</p>
                
                {/* Progress Area */}
                <ProgressArea />
                
                {/* Reporte Mensual de Progreso Card */}
                <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
                  <CardHeader className="grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                    <CardTitle className="leading-none font-semibold flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Reporte Mensual de Progreso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 space-y-4">
                    <p className="text-sm text-gray-700">Ideal para cumplir con requisitos de homeschool.</p>
                    <div className="flex gap-2">
                      <Button 
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2"
                        onClick={generatePDF}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </Button>
                      <Button 
                        variant="outline"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                      >
                        Exportar Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Evidencias y Proyectos Card */}
                <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
                  <CardHeader className="grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                    <CardTitle className="leading-none font-semibold flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Evidencias y Proyectos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6">
                    <p className="text-sm text-gray-700">Aquí se mostrarán las evidencias y proyectos del estudiante.</p>
                    <Button 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 mt-4"
                    >
                      Subir Evidencia
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </main>
          )}

          {/* Tutoria LMS Section */}
          {activeSection === 'teams' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Tutoría Virtual
                </h1>
                <p className="text-gray-600">
                  Conecta con tutores especializados para apoyo académico personalizado
                </p>
              </div>

              {/* Main Video Call Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Video Display Area */}
                <div className="lg:col-span-2 bg-gray-900 rounded-lg relative overflow-hidden">
                  {/* Video Header */}
                  <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
                    <div className="bg-black bg-opacity-50 rounded-lg px-3 py-2 text-white text-sm">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                        En vivo con Prof. Ana Martínez
                      </span>
                    </div>
                    <div className="bg-black bg-opacity-50 rounded-lg px-3 py-2 text-white text-sm">
                      45:23
                    </div>
                  </div>

                  {/* Main Video */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Users className="w-16 h-16" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Prof. Ana Martínez</h3>
                      <p className="text-blue-200">Especialista en Matemáticas</p>
                    </div>
                  </div>

                  {/* Student Video (Picture-in-Picture) */}
                  <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-white overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Video Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors">
                      <MessageSquare className="w-6 h-6" />
                    </button>
                    <button className="w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors">
                      <Users className="w-6 h-6" />
                    </button>
                    <button className="w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors">
                      <Play className="w-6 h-6" />
                    </button>
                    <button className="w-12 h-12 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors">
                      <Settings className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Chat Panel */}
                <div className="bg-white border rounded-lg flex flex-col">
                  {/* Chat Header */}
                  <div className="border-b p-4">
                    <h3 className="font-semibold text-gray-900">Chat de Sesión</h3>
                    <p className="text-sm text-gray-600">2 participantes</p>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        A
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-sm">¡Hola María! ¿Estás lista para repasar las fracciones?</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Prof. Ana • 2:30 PM</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 flex-row-reverse">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        M
                      </div>
                      <div className="flex-1">
                        <div className="bg-blue-500 text-white rounded-lg p-3">
                          <p className="text-sm">¡Sí! Tengo algunas dudas sobre la suma de fracciones</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">María • 2:31 PM</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        A
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-sm">Perfecto. Vamos a empezar con un ejemplo sencillo. ¿Puedes compartir tu pantalla?</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Prof. Ana • 2:32 PM</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">Prof. Ana compartió: "Ejercicios_Fracciones.pdf"</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="Escribe un mensaje..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                        <Plus className="w-4 h-4 mr-1" />
                        Archivo
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                        <Palette className="w-4 h-4 mr-1" />
                        Imagen
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Info and Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Session Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Detalles de la Sesión
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Materia</p>
                      <p className="text-sm text-gray-600">Matemáticas - Fracciones</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Estudiante</p>
                      <p className="text-sm text-gray-600">María González (2.º Grado)</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Duración</p>
                      <p className="text-sm text-gray-600">60 minutos</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Costo</p>
                      <p className="text-sm text-green-600 font-semibold">$25.00</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Tutor Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      Perfil del Tutor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        AM
                      </div>
                      <div>
                        <p className="font-medium">Prof. Ana Martínez</p>
                        <p className="text-sm text-gray-600">Especialista en Matemáticas</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">4.9 (127 reseñas)</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">5 años de experiencia • Certificada en Educación Primaria</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Acciones Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Compartir Pantalla
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Grabar Sesión
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar Próxima
                    </Button>
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Finalizar Sesión
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Available Tutors */}
              <Card>
                <CardHeader>
                  <CardTitle>Tutores Disponibles</CardTitle>
                  <p className="text-sm text-gray-600">Conecta con otros tutores especializados</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: "Dr. Carlos Rivera", subject: "Ciencias", rating: 4.8, price: "$30", available: true },
                      { name: "Lic. Sofia Morales", subject: "Inglés", rating: 4.9, price: "$25", available: true },
                      { name: "Prof. Luis Vega", subject: "Historia", rating: 4.7, price: "$20", available: false }
                    ].map((tutor, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {tutor.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{tutor.name}</p>
                              <p className="text-xs text-gray-600">{tutor.subject}</p>
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${tutor.available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600">{tutor.rating}</span>
                          </div>
                          <span className="text-sm font-semibold text-green-600">{tutor.price}/hr</span>
                        </div>
                        <Button 
                          className="w-full mt-3" 
                          size="sm" 
                          variant={tutor.available ? "default" : "outline"}
                          disabled={!tutor.available}
                        >
                          {tutor.available ? "Conectar" : "No disponible"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other sections placeholder */}
          {activeSection !== 'inicio' && activeSection !== 'catalogo' && activeSection !== 'comunidad' && activeSection !== 'calendario' && activeSection !== 'planificacion' && activeSection !== 'portafolio' && activeSection !== 'teams' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {menuItems.find(item => item.id === activeSection)?.label}
              </h2>
              <p className="text-gray-600">
                Esta sección está en desarrollo. El mock se enfoca en la pantalla principal del dashboard.
              </p>
            </div>
          )}

          {/* Catalog Plans Screen */}
          {activeSection === 'planificacion' && showCatalogPlans && (
            <div className="space-y-6">
              <Button onClick={() => setShowCatalogPlans(false)} className="mb-4">
                ← Volver a Planificación
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Catálogo de Planes Pre-hechos</h2>
              <p className="text-gray-600">Explora planes educativos diseñados por expertos para diferentes grados y materias.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalogPlans.map((plan) => (
                  <Card key={plan.plan_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{plan.subject}</span>
                        <span>Grado {plan.grade}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Duración:</span> {plan.duration_weeks} semanas
                        </div>
                        <div>
                          <span className="font-medium">Autor:</span> {plan.author}
                        </div>
                        <div>
                          <span className="font-medium">Estándares:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {plan.standards.map((standard, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {standard}
                              </span>
                            ))}
                          </div>
                        </div>
                        {plan.context_pr && (
                          <div className="flex items-center text-green-600 text-sm">
                            <span className="mr-1">🇵🇷</span>
                            Contextualizado para Puerto Rico
                          </div>
                        )}
                        <div className="pt-3">
                          <h4 className="font-medium mb-2">Primera semana:</h4>
                          {plan.weeks[0]?.sessions.map((session, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded text-sm mb-2">
                              <div className="font-medium">{session.title}</div>
                              <div className="text-gray-600">{session.objective}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {session.tags.map((tag, tagIdx) => (
                                  <span key={tagIdx} className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button className="flex-1">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Ver Plan Completo
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowAssignModal(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Asignar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Option B Screen */}
          {activeSection === 'planificacion' && showOptionB && (
            <div className="space-y-6">
              <Button onClick={() => setShowOptionB(false)} className="mb-4">
                ← Volver a Opciones de Planificación
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Planificación Personalizada</h2>
              <p className="text-gray-600">Crea tu propio currículo arrastrando y soltando lecciones en el calendario.</p>
              
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Lesson Bank */}
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Banco de Lecciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Droppable droppableId="lesson-bank">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-2 min-h-[100px] p-2 border rounded-md ${
                              snapshot.isDraggingOver ? 'bg-blue-100' : 'bg-gray-50'
                            }`}
                          >
                            {weeklySchedule['lesson-bank'].map((lessonId, index) => {
                              const lesson = lessons.find(l => l.id === lessonId)
                              return (
                                <Draggable key={lessonId} draggableId={lessonId} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-2 bg-white border rounded-md shadow-sm text-sm cursor-move ${
                                        snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                      }`}
                                      style={provided.draggableProps.style}
                                    >
                                      {lesson?.content}
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>

                  {/* Weekly Calendar */}
                  <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                      <Card key={day}>
                        <CardHeader>
                          <CardTitle className="text-center text-base">{day}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Droppable droppableId={day}>
                            {(provided, snapshot) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`space-y-2 min-h-[150px] p-2 border rounded-md ${
                                  snapshot.isDraggingOver ? 'bg-green-100' : 'bg-blue-50'
                                }`}
                              >
                                {weeklySchedule[day].length === 0 && !snapshot.isDraggingOver && (
                                  <p className="text-center text-gray-400 text-xs mt-4">Arrastra lecciones aquí</p>
                                )}
                                {weeklySchedule[day].map((lessonId, index) => {
                                  const lesson = lessons.find(l => l.id === lessonId)
                                  return (
                                    <Draggable key={lessonId} draggableId={lessonId} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-2 bg-white border rounded-md shadow-sm text-sm cursor-move ${
                                            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                          }`}
                                          style={provided.draggableProps.style}
                                        >
                                          {lesson?.content}
                                        </div>
                                      )}
                                    </Draggable>
                                  )
                                })}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </DragDropContext>

              {/* Add New Lesson */}
              <Card>
                <CardHeader>
                  <CardTitle>Añadir Nueva Lección</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                      className="border rounded-md px-3 py-2 text-sm" 
                      placeholder="Título de la Lección"
                    />
                    <select className="border rounded-md px-3 py-2 text-sm">
                      <option value="">Materia</option>
                      <option value="matematicas">Matemáticas</option>
                      <option value="ingles">Inglés</option>
                      <option value="ciencias">Ciencias</option>
                      <option value="espanol">Español</option>
                    </select>
                    <input 
                      className="border rounded-md px-3 py-2 text-sm" 
                      placeholder="Duración (ej. 45 min)"
                    />
                    <Button className="md:col-span-3">
                      Añadir Lección al Banco
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assignment Creation Screen */}
          {activeSection === 'planificacion' && showAssignmentCreation && (
            <div className="space-y-6">
              <Button onClick={() => setShowAssignmentCreation(false)} className="mb-4">
                ← Volver a Planificación
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Evaluación y Retroalimentación</h2>
              <p className="text-gray-600">Gestiona asignaciones, registra observaciones y utiliza rúbricas sugeridas.</p>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Nueva Asignación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Título de la Asignación</label>
                    <input 
                      className="w-full border rounded-md px-3 py-2 text-sm" 
                      placeholder="Ej: Proyecto de Ciencias: El Ciclo del Agua"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción (Opcional)</label>
                    <textarea 
                      className="w-full border rounded-md px-3 py-2 text-sm min-h-16" 
                      placeholder="Detalles de la asignación..."
                    />
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Asignación
                  </Button>
                </CardContent>
              </Card>

              {/* Observaciones y Rúbricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Observaciones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Registra observaciones del progreso y comportamiento de tus estudiantes.
                    </p>
                    <textarea 
                      placeholder="Escribe una observación..."
                      className="w-full text-sm border rounded p-2 h-20 resize-none"
                    />
                    <Button size="sm" className="w-full">
                      Guardar Observación
                    </Button>
                  </CardContent>
                </Card>

                {/* Rúbricas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rúbricas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Utiliza rúbricas prediseñadas para evaluar proyectos.
                    </p>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Rúbrica de Escritura
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        Rúbrica de Arte
                      </Button>
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        Rúbrica de Presentaciones
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mt-8">Asignaciones Existentes</h3>
                <p className="text-gray-600">No hay asignaciones creadas aún.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Asignar Plan: {selectedPlan.title}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Seleccionar Estudiante:</label>
                <select className="w-full border rounded-md px-3 py-2">
                  <option value="">Selecciona un estudiante</option>
                  <option value="maria">María González</option>
                  <option value="juan">Juan Pérez</option>
                  <option value="sofia">Sofía Rodríguez</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Inicio:</label>
                <input 
                  type="date" 
                  className="w-full border rounded-md px-3 py-2"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-600">
                  <strong>Duración:</strong> {selectedPlan.duration_weeks} semanas<br/>
                  <strong>Materia:</strong> {selectedPlan.subject}<br/>
                  <strong>Autor:</strong> {selectedPlan.author}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPlan(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  // Here you would handle the assignment logic
                  alert(`Plan "${selectedPlan.title}" asignado exitosamente!`);
                  setShowAssignModal(false);
                  setSelectedPlan(null);
                }}
              >
                Asignar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudentDetail && selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent}
          onClose={() => {
            setShowStudentDetail(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Onboarding System */}
      {showWizard && <NewOnboardingWizard onFinish={completeWizard} />}
      {showTour && <DashboardTour onComplete={completeTour} />}
      {showWeeklyInsights && <WeeklyInsightsCard onDismiss={dismissWeeklyInsights} />}
    </div>
  )
}

export default App

