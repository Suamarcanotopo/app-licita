import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { GESTORES, GESTOR_MAP } from '../../data/seedData';

export const TasksAgendaView: React.FC = () => {
  const {
    state,
    tasksOverdueOnly,
    setTasksOverdueOnly,
    toggleTaskDone,
    setSelectedLeadId,
    setRoute,
  } = useApp();

  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const filteredTasks = state.tasks.filter((t) => {
    if (state.activeProjectId !== 'all' && t.projectId !== state.activeProjectId) return false;
    if (ownerFilter !== 'all' && t.owner !== ownerFilter) return false;
    if (tasksOverdueOnly && (!t.overdue || t.done)) return false;
    return true;
  });

  const filteredMeetings = state.meetings.filter(
    (m) => state.activeProjectId === 'all' || m.projectId === state.activeProjectId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F2744]">Minha agenda e tarefas</h1>
          <p className="text-sm text-slate-600 mt-1">
            Tarefas operacionais de primeira abordagem (Márcio), triagens jurídicas e reuniões com participantes vinculados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-[#E2E8F0] rounded-md text-slate-800"
            aria-label="Filtrar por responsável"
          >
            <option value="all">Todos os gestores</option>
            {GESTORES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setTasksOverdueOnly(!tasksOverdueOnly)}
            className={`h-9 px-3 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
              tasksOverdueOnly
                ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                : 'bg-white text-slate-700 border-[#E2E8F0] hover:border-[#0F2744]'
            }`}
          >
            {tasksOverdueOnly ? 'Mostrando apenas vencidas' : 'Filtrar vencidas'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tasks List */}
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-lg">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Fila de tarefas ({filteredTasks.length})
            </h2>
            <span className="text-xs text-slate-500">Clique para concluir ou abrir o registro</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <div className="p-6 text-xs text-slate-500">
                Nenhuma tarefa corresponde aos filtros ativos.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const proj = state.projects.find((p) => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    className="px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskDone(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-[#15803D] shrink-0"
                        aria-label={task.done ? 'Reabrir tarefa' : 'Concluir tarefa'}
                      >
                        {task.done ? (
                          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-medium ${
                            task.done ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                          <span>{task.category}</span>
                          <span>·</span>
                          <span>Responsável: {GESTOR_MAP[task.owner]?.nome}</span>
                          <span>·</span>
                          <span>{proj?.nome}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-mono tabular-nums ${
                          task.overdue && !task.done ? 'text-[#B91C1C] font-semibold' : 'text-slate-600'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.dueDate.split('-').reverse().join('/')}</span>
                      </span>
                      {task.overdue && !task.done && (
                        <span className="text-[11px] font-medium text-[#B91C1C]">Vencida</span>
                      )}
                      {task.leadId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeadId(task.leadId!);
                            setRoute('leads');
                          }}
                          className="text-xs font-medium text-[#0F2744] hover:underline"
                        >
                          Abrir lead
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Meetings Agenda */}
        <section className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-lg">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F2744]">
              Agenda de reuniões ({filteredMeetings.length})
            </h2>
            <button
              type="button"
              onClick={() => setRoute('meetings')}
              className="text-xs font-semibold text-[#0F2744] hover:underline"
            >
              Gerenciar todas
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredMeetings.map((m) => (
              <div key={m.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#0F2744] tabular-nums">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{m.dateTime}</span>
                  </span>
                  <span className="text-xs text-[#15803D] font-medium">{m.status}</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                <div className="text-xs text-slate-600 leading-relaxed">{m.agenda}</div>
                <div className="pt-1.5 flex items-center justify-between text-xs text-slate-500">
                  <span>{m.participants.map((p) => GESTOR_MAP[p]?.nome).join(' · ')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeadId(m.leadId);
                      setRoute('leads');
                    }}
                    className="font-medium text-[#0F2744] hover:underline"
                  >
                    Ver ficha
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
