import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';

const CatalogFilters = ({ onFiltersChange }) => {
  const [expandedSections, setExpandedSections] = useState({
    materias: true,
    grados: false,
    dificultad: false,
    duracion: false
  });

  const [selectedFilters, setSelectedFilters] = useState({
    materias: [],
    grados: [],
    dificultad: [],
    duracion: []
  });

  const materias = [
    'English',
    'Español', 
    'Matemáticas',
    'Ciencias',
    'Estudios Sociales',
    'Bellas Artes',
    'Educación Física',
    'Salud Escolar',
    'Física',
    'Ciencia Ambiental',
    'Estadística',
    'Preparación al Cálculo',
    'Matemáticas Actualizadas',
    'América Latina: Transformaciones contemporáneas y su realidad actual',
    'Cooperativismo y tendencias de empresarismo',
    'Sociología: Una perspectiva para la vida',
    'Educación en procesos electorales y parlamentarios'
  ];

  const grados = [
    'Kinder',
    '1er Grado',
    '2do Grado', 
    '3er Grado',
    '4to Grado',
    '5to Grado',
    '6to Grado',
    '7mo Grado',
    '8vo Grado',
    '9no Grado',
    '10mo Grado',
    '11mo Grado',
    '12mo Grado'
  ];

  const dificultades = [
    'Básico',
    'Intermedio',
    'Avanzado'
  ];

  const duraciones = [
    '15-30 min',
    '30-45 min',
    '45-60 min',
    '60+ min'
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (category, value) => {
    const newFilters = { ...selectedFilters };
    
    if (newFilters[category].includes(value)) {
      newFilters[category] = newFilters[category].filter(item => item !== value);
    } else {
      newFilters[category] = [...newFilters[category], value];
    }
    
    setSelectedFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const FilterSection = ({ title, items, category, expanded }) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => toggleSection(category)}
        className="w-full flex items-center justify-between py-4 px-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}
      >
        <span className="font-medium text-gray-900">{title}</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      {expanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <label key={item} className="flex items-start space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedFilters[category].includes(item)}
                  onChange={() => handleFilterChange(category, item)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700 leading-tight" title={item}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const clearAllFilters = () => {
    const clearedFilters = {
      materias: [],
      grados: [],
      dificultad: [],
      duracion: []
    };
    setSelectedFilters(clearedFilters);
    onFiltersChange && onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(selectedFilters).reduce((total, filters) => total + filters.length, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-blue-900 text-lg">FILTROS</h3>
        {getActiveFiltersCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Limpiar ({getActiveFiltersCount()})
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <FilterSection
            title="Materias"
            items={materias}
            category="materias"
            expanded={expandedSections.materias}
          />
          
          <FilterSection
            title="Grados"
            items={grados}
            category="grados"
            expanded={expandedSections.grados}
          />
          
          <FilterSection
            title="Dificultad"
            items={dificultades}
            category="dificultad"
            expanded={expandedSections.dificultad}
          />
          
          <FilterSection
            title="Duración"
            items={duraciones}
            category="duracion"
            expanded={expandedSections.duracion}
          />
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      {getActiveFiltersCount() > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Filtros Activos:</h4>
            <div className="space-y-2">
              {Object.entries(selectedFilters).map(([category, filters]) => 
                filters.length > 0 && (
                  <div key={category} className="text-sm">
                    <span className="font-medium capitalize text-blue-800">{category}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {filters.map(filter => (
                        <span
                          key={filter}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {filter}
                          <button
                            onClick={() => handleFilterChange(category, filter)}
                            className="ml-1 hover:text-blue-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Fields */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="font-medium text-gray-900 mb-2">Código</p>
            <div className="form-group-fields" style={{ width: '100%', marginTop: '5px' }}>
              <input
                name="code"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa código de lección"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div>
            <p className="font-medium text-gray-900 mb-2">Texto</p>
            <div className="form-group-fields" style={{ width: '100%', marginTop: '5px' }}>
              <input
                name="content"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por contenido"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div className="flex flex-row gap-5 pt-2">
            <button
              className="flex items-center px-4 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              type="button"
            >
              <div className="flex items-center mr-2">
                <p className="font-medium text-sm capitalize">Buscar</p>
              </div>
              <svg
                className="w-4 h-4"
                focusable="false"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ color: 'rgb(69, 96, 131)' }}
              >
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
              </svg>
            </button>
            
            <button
              className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
              type="button"
              onClick={clearAllFilters}
            >
              <div className="font-semibold text-sm capitalize">
                <p>Limpiar filtros</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CatalogFilters;
