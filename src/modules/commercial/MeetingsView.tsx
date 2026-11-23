import React from 'react';
import { Calendar, Users } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTOR_MAP } from '../../data/seedData';

export const MeetingsView: React.FC = () => {
  const { state, setSelectedLeadId, setRoute } = useApp();

  const meetings = state.meetings.filter(
    (m) => state.activeProjectId === 'all' || m.projectId === state.activeProjectId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Reuniões</h1>
          <p className="text-sm text-slate-600 mt-1">
            Reuniões vinculadas aos leads com pauta, duração e participação de Márcio + José Ribamar e/ou José Ribamar Júnior.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRoute('leads')}
          className="h-9 px-3.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-md whitespace-nowrap self-start"
        >
          Agendar a partir de um lead
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-slate-100">
        {meetings.length === 0 ? (
          <div className="p-6 text-xs text-slate-500">Nenhuma reunião registrada para este filtro.</div>
        ) : (
          meetings.map((m) => {
            const proj = state.projects.find((p) => p.id === m.projectId);
            return (
              <div
                key={m.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#0F2744] tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{m.dateTime}</span>
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600">{proj?.nome}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500 tabular-nums">{m.durationMinutes} min</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-semibold text-[#15803D]">{m.status}</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">{m.title}</h2>
                  <p className="text-xs text-slate-600">{m.agenda}</p>
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      Participantes: {m.participants.map((p) => GESTOR_MAP[p]?.nome).join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeadId(m.leadId);
                      setRoute('leads');
                    }}
                    className="h-9 px-3.5 text-xs font-semibold text-[#0F2744] bg-white border border-[#CBD5E1] hover:border-[#0F2744] rounded-md whitespace-nowrap"
                  >
                    Abrir lead ({m.companyName.split(' ')[0]})
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
