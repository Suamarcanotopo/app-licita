import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useApp } from '../../store/AppContext';

export const OfficialSourcesView: React.FC = () => {
  const { state, globalSearch } = useApp();
  const [ufFilter, setUfFilter] = useState('Todas');
  const [sheetFilter, setSheetFilter] = useState('Todas');
  const [onlyNoEdital, setOnlyNoEdital] = useState(false);

  const ufs = Array.from(new Set(state.sources.map((s) => s.uf))).sort();

  const filtered = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return state.sources.filter((s) => {
      if (ufFilter !== 'Todas' && s.uf !== ufFilter) return false;
      if (sheetFilter !== 'Todas' && s.originSheet !== sheetFilter) return false;
      if (onlyNoEdital && s.hasConfirmedEdital) return false;
      if (q) {
        const hay = `${s.uf} ${s.municipio} ${s.ibgeCode} ${s.portalName} ${s.situacaoValidacao}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [state.sources, ufFilter, sheetFilter, onlyNoEdital, globalSearch]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F2744]">Fontes oficiais · Mapa Nacional 27 UFs</h1>
        <p className="text-sm text-slate-600 mt-1">
          Referência estruturada das guias BUSCADOR NACIONAL (5.571 municípios mapeados), MAPA 27 UFs, FONTES MUNICIPAIS e FONTES NACIONAIS. Um portal identificado sem edital confirmado permanece aqui sem virar oportunidade no Radar.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 flex flex-wrap items-center gap-3 text-xs">
        <select
          value={ufFilter}
          onChange={(e) => setUfFilter(e.target.value)}
          className="h-8 px-2.5 border border-[#E2E8F0] rounded-md bg-white"
        >
          <option value="Todas">Todas as UFs</option>
          {ufs.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>

        <select
          value={sheetFilter}
          onChange={(e) => setSheetFilter(e.target.value)}
          className="h-8 px-2.5 border border-[#E2E8F0] rounded-md bg-white"
        >
          <option value="Todas">Todas as guias de origem</option>
          <option value="BUSCADOR NACIONAL">BUSCADOR NACIONAL</option>
          <option value="FONTES MUNICIPAIS">FONTES MUNICIPAIS</option>
          <option value="FONTES NACIONAIS">FONTES NACIONAIS</option>
          <option value="MAPA 27 UFs">MAPA 27 UFs</option>
        </select>

        <label className="inline-flex items-center gap-1.5 text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyNoEdital}
            onChange={(e) => setOnlyNoEdital(e.target.checked)}
          />
          <span>Somente portais sem edital confirmado (fora do Radar)</span>
        </label>

        <span className="ml-auto font-mono text-slate-500 tabular-nums">
          {filtered.length} fonte(s) exibida(s) · Catálogo base: 5.571 municípios
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
              <th className="py-3 px-4 font-semibold">UF / Município / IBGE</th>
              <th className="py-3 px-4 font-semibold">Portal / Links oficiais</th>
              <th className="py-3 px-4 font-semibold">Guia de origem</th>
              <th className="py-3 px-4 font-semibold">Situação de verificação</th>
              <th className="py-3 px-4 font-semibold">Radar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((src) => (
              <tr key={src.id} className="hover:bg-slate-50">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">
                    {src.uf} · {src.municipio}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                    IBGE {src.ibgeCode} · {src.perfilTerritorial}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-[#0F2744]">{src.portalName}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      <span>{src.urlLicitacoes || src.urlPrefeitura}</span>
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                  {src.originSheet}
                  <div className="text-slate-400">Consulta: {src.dataConsulta}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="text-slate-800">{src.situacaoValidacao}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{src.statusHttpCatalogo}</div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {src.hasConfirmedEdital ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#15803D]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Edital confirmado</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Apenas fonte (sem edital)</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
