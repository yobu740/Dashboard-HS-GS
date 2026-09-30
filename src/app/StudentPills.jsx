// Student switcher shown when the family has more than one student.
export default function StudentPills({ students, activeId, onChange }) {
  if (students.length < 2) return null
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {students.map(s => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
            s.id === activeId ? 'border-transparent text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          style={s.id === activeId ? { backgroundColor: s.color } : undefined}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-xs font-bold">{s.name.charAt(0)}</span>
          {s.name}
        </button>
      ))}
    </div>
  )
}
