import React, { useState } from 'react';
import { X, Award, TrendingUp, Clock, BookOpen, Target, AlertTriangle, CheckCircle, Plus, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const StudentDetailModal = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState('progreso');
  const [range, setRange] = useState("weekly");
  const [subjectFilter, setSubjectFilter] = useState("Todas");
  const [notes, setNotes] = useState([
    { id: "n1", text: "Se motiva con experimentos. Reforzar escritura en inglés.", timestamp: "2025-09-11T08:45:00-04:00" },
    { id: "n2", text: "Reducir tiempo de pantalla entre sesiones.", timestamp: "2025-09-05T18:20:00-04:00" },
  ]);
  const [noteText, setNoteText] = useState("");
  const [difficulties, setDifficulties] = useState([
    { id: "d1", skill: "Resta con llevadas", subject: "Matemáticas", accuracy: 42, lastTried: "2025-09-01T10:10:00-04:00", suggested: false },
    { id: "d2", skill: "Comprensión literal (inglés)", subject: "Inglés", accuracy: 55, lastTried: "2025-08-30T09:30:00-04:00", suggested: true },
  ]);

  // Sample data for charts
  const progressData = [
    { name: 'Lun', Matemáticas: 85, Inglés: 72, Ciencias: 90, Español: 88 },
    { name: 'Mar', Matemáticas: 88, Inglés: 75, Ciencias: 92, Español: 90 },
    { name: 'Mié', Matemáticas: 90, Inglés: 78, Ciencias: 88, Español: 85 },
    { name: 'Jue', Matemáticas: 92, Inglés: 80, Ciencias: 95, Español: 92 },
    { name: 'Vie', Matemáticas: 90, Inglés: 82, Ciencias: 93, Español: 88 },
  ];

  const timeData = [
    { subject: 'Matemáticas', hours: 5.5 },
    { subject: 'Inglés', hours: 4.2 },
    { subject: 'Ciencias', hours: 3.8 },
    { subject: 'Español', hours: 6.0 },
    { subject: 'Sociales', hours: 2.5 },
  ];

  const addNote = () => {
    if (noteText.trim()) {
      const newNote = {
        id: `n${Date.now()}`,
        text: noteText,
        timestamp: new Date().toISOString()
      };
      setNotes([newNote, ...notes]);
      setNoteText("");
    }
  };

  const tabs = [
    { id: 'progreso', label: 'Progreso', icon: TrendingUp },
    { id: 'tiempo', label: 'Tiempo de Estudio', icon: Clock },
    { id: 'dificultades', label: 'Dificultades', icon: AlertTriangle },
    { id: 'logros', label: 'Logros', icon: Award },
    { id: 'notas', label: 'Notas', icon: BookOpen },
    { id: 'plataforma', label: 'Plataforma Estudiante', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header with Dashboard Navigation */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 bg-opacity-90 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img 
                src={student.avatar} 
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Detalle de {student.name}
              </h2>
              <p className="text-gray-600">{student.grade}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Dashboard</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm text-gray-600">Estudiantes</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm font-medium text-blue-600">{student.name}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with Tabs */}
          <div className="w-64 bg-gray-50 bg-opacity-90 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Stats */}
            <div className="mt-6 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(Object.values(student.progress).reduce((a, b) => a + b, 0) / Object.values(student.progress).length)}%
                    </div>
                    <div className="text-sm text-gray-600">Promedio General</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {student.badges.length}
                    </div>
                    <div className="text-sm text-gray-600">Logros Obtenidos</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'progreso' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Progreso Académico</h3>
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="border rounded-md px-3 py-1"
                  >
                    <option value="weekly">Esta Semana</option>
                    <option value="monthly">Este Mes</option>
                    <option value="quarterly">Este Trimestre</option>
                  </select>
                </div>

                {/* Progress by Subject */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(student.progress).map(([subject, progress]) => (
                    <Card key={subject}>
                      <CardHeader>
                        <CardTitle className="text-lg">{subject}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-3" />
                          <div className="text-xs text-gray-500">
                            {progress >= 90 ? 'Excelente' : 
                             progress >= 80 ? 'Muy Bueno' :
                             progress >= 70 ? 'Bueno' : 'Necesita Mejora'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Progress Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Matemáticas" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="Inglés" stroke="#82ca9d" strokeWidth={2} />
                        <Line type="monotone" dataKey="Ciencias" stroke="#ffc658" strokeWidth={2} />
                        <Line type="monotone" dataKey="Español" stroke="#ff7300" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'tiempo' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Tiempo de Estudio</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Horas por Materia (Esta Semana)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="hours" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">22.0h</div>
                      <div className="text-sm text-gray-600">Total Esta Semana</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">4.4h</div>
                      <div className="text-sm text-gray-600">Promedio Diario</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">+15%</div>
                      <div className="text-sm text-gray-600">vs. Semana Anterior</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'dificultades' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Áreas de Dificultad</h3>
                
                <div className="space-y-4">
                  {difficulties.map((difficulty) => (
                    <Card key={difficulty.id} className={difficulty.suggested ? 'border-orange-200 bg-orange-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{difficulty.skill}</h4>
                              <Badge variant="secondary">{difficulty.subject}</Badge>
                              {difficulty.suggested && (
                                <Badge variant="destructive">Refuerzo Sugerido</Badge>
                              )}
                            </div>
                            <div className="mt-2 flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Precisión:</span>
                                <span className={`font-medium ${difficulty.accuracy < 60 ? 'text-red-600' : 'text-orange-600'}`}>
                                  {difficulty.accuracy}%
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Último intento:</span>
                                <span className="text-sm">
                                  {new Date(difficulty.lastTried).toLocaleDateString('es-PR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              Asignar Práctica
                            </Button>
                            {difficulty.suggested && (
                              <Button size="sm">
                                Aplicar Refuerzo
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'logros' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Logros y Reconocimientos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.badges.map((badge, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Award className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{badge}</h4>
                            <p className="text-sm text-gray-600">
                              Obtenido el {new Date().toLocaleDateString('es-PR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Progress towards next badge */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5" />
                      <span>Próximo Logro</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Maestro de Matemáticas</span>
                          <span>8/10 lecciones</span>
                        </div>
                        <Progress value={80} className="h-2" />
                        <p className="text-xs text-gray-600 mt-1">
                          Completa 2 lecciones más de matemáticas para obtener este logro
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notas' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Notas del Educador</h3>
                
                {/* Add Note */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Agregar Nota</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Escribe una nota sobre el progreso, comportamiento o recomendaciones..."
                        className="w-full p-3 border rounded-md resize-none"
                        rows={3}
                      />
                      <Button onClick={addNote} disabled={!noteText.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Nota
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes List */}
                <div className="space-y-4">
                  {notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <p className="text-gray-800 flex-1">{note.text}</p>
                          <span className="text-xs text-gray-500 ml-4">
                            {new Date(note.timestamp).toLocaleDateString('es-PR')} {' '}
                            {new Date(note.timestamp).toLocaleTimeString('es-PR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'plataforma' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Plataforma Estudiante</h3>
                
                {/* Botón para ir a la plataforma */}
                <div className="mb-6">
                  <Button 
                    onClick={() => window.open('https://privateschools-students.genialskillsweb.com/', '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Ir a plataforma del Estudiante
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Editar Información del Perfil */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Editar Información del Perfil</CardTitle>
                      <p className="text-sm text-gray-600">
                        Actualice la información, luego presione <em>Actualizar información</em>
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstname" className="block text-sm font-medium text-blue-700 mb-1">
                              * Nombre
                            </label>
                            <input
                              name="firstname"
                              id="firstname"
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              defaultValue="Genial"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastname" className="block text-sm font-medium text-blue-700 mb-1">
                              * Apellido
                            </label>
                            <input
                              name="lastname"
                              id="lastname"
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              defaultValue="Prueba"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-blue-700 mb-1">
                            * Correo electrónico
                          </label>
                          <input
                            name="email"
                            id="email"
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            defaultValue=""
                          />
                        </div>
                        <Button type="button" className="w-full bg-green-600 hover:bg-green-700 text-white">
                          Actualizar información
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Actualizar Contraseña */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Actualice la contraseña del perfil</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-blue-700 mb-1">
                              * Ingrese la contraseña
                            </label>
                            <input
                              name="password"
                              id="password"
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              defaultValue=""
                            />
                          </div>
                          <div>
                            <label htmlFor="retype_password" className="block text-sm font-medium text-blue-700 mb-1">
                              * Confirme la contraseña
                            </label>
                            <input
                              name="retype_password"
                              id="retype_password"
                              type="password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              defaultValue=""
                            />
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          disabled 
                          className="w-full bg-gray-400 text-white cursor-not-allowed"
                        >
                          Actualizar contraseña
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Última actualización: {new Date().toLocaleDateString('es-PR')}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button>
              Generar Reporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
