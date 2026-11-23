import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { DocumentStatus, ProcuracaoStatus, SemaphoreStatus } from '../types/domain';
import { SEMAPHORE_LABELS, SEMAPHORE_SHORT } from '../engine/qualification';

export const SemaphoreIndicator: React.FC<{
  status: SemaphoreStatus;
  verbose?: boolean;
}> = ({ status, verbose = false }) => {
  const styles: Record<SemaphoreStatus, { text: string; icon: React.ReactNode }> = {
    verde: {
      text: 'text-[#15803D]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    amarelo: {
      text: 'text-[#B45309]',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    vermelho: {
      text: 'text-[#B91C1C]',
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    cinza: {
      text: 'text-slate-600',
      icon: <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${styles[status].text}`}>
      {styles[status].icon}
      <span>{verbose ? SEMAPHORE_LABELS[status] : SEMAPHORE_SHORT[status]}</span>
    </span>
  );
};

export const DocumentStatusText: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const map: Record<DocumentStatus, { cls: string; icon: React.ReactNode }> = {
    Solicitado: { cls: 'text-slate-600', icon: <Clock className="w-3.5 h-3.5 shrink-0" /> },
    Recebido: { cls: 'text-[#0F2744]', icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> },
    Aprovado: { cls: 'text-[#15803D]', icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> },
    'A corrigir': { cls: 'text-[#B91C1C]', icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> },
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${map[status].cls}`}>
      {map[status].icon}
      <span>{status}</span>
    </span>
  );
};

export const ProcuracaoStatusText: React.FC<{ status: ProcuracaoStatus }> = ({ status }) => {
  const map: Record<ProcuracaoStatus, { cls: string; icon: React.ReactNode }> = {
    'Não iniciada': { cls: 'text-slate-500', icon: <Clock className="w-3.5 h-3.5 shrink-0" /> },
    'Pendente de assinatura': { cls: 'text-[#B45309]', icon: <Clock className="w-3.5 h-3.5 shrink-0" /> },
    'Assinada e validada': { cls: 'text-[#15803D]', icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> },
    Vencida: { cls: 'text-[#B91C1C]', icon: <XCircle className="w-3.5 h-3.5 shrink-0" /> },
    Revogada: { cls: 'text-[#B91C1C]', icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> },
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${map[status].cls}`}>
      {map[status].icon}
      <span>{status}</span>
    </span>
  );
};
