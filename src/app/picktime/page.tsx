'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Posto = {
  id: string;
  nome: string;
};

type Registro = {
  cliques: number;
  tempoTotal: number;
  startTime?: number | null;
  turno?: string;
  dataRegistro: string;
};

type RegistrosPorData = Record<string, Record<string, Registro>>;

export default function PickTimePage() {
  const postos: Posto[] = [
    { id: 'P3', nome: 'Borracha' },
    { id: 'P4', nome: 'Vedante Conector' },
    { id: 'P5', nome: 'Continuidade' },
    { id: 'P6', nome: 'Reposicionamento Peça' },
    { id: 'P7', nome: 'Aparafusadora' },
    { id: 'P8', nome: 'Teste do Vácuo' },
    { id: 'P9', nome: 'Impressora 1' },
    { id: 'P10', nome: 'Impressora 2' },
    { id: 'P11', nome: 'Câmara Etiqueta' },
  ];

  const [postoAtivo, setPostoAtivo] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('postoAtivoPickTime') || null;
    }
    return null;
  });

  const [tempoDecorrido, setTempoDecorrido] = useState<number>(0);
  const [registros, setRegistros] = useState<RegistrosPorData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('registrosPickTime');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [startTime, setStartTime] = useState<number | null>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('startTimePickTime')) {
      return parseInt(localStorage.getItem('startTimePickTime')!, 10);
    }
    return null;
  });

  const getTurno = (): string => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 16) return '1º Turno';
    if (hour >= 16 && hour < 24) return '2º Turno';
    return '3º Turno';
  };

  const getDataAtual = (): string => {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    return `${ano}-${mes}-${dia}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('registrosPickTime', JSON.stringify(registros));
    }
  }, [registros]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (postoAtivo) {
        localStorage.setItem('postoAtivoPickTime', postoAtivo);
        localStorage.setItem('startTimePickTime', String(startTime || Date.now()));
      } else {
        localStorage.removeItem('postoAtivoPickTime');
        localStorage.removeItem('startTimePickTime');
      }
    }
  }, [postoAtivo, startTime]);

  useEffect(() => {
    let intervalo: NodeJS.Timeout | null = null;

    if (postoAtivo) {
      const start = startTime || Date.now();
      setStartTime(start);
      const tick = () => {
        setTempoDecorrido(Math.floor((Date.now() - start) / 1000));
      };
      tick();
      intervalo = setInterval(tick, 1000);
    } else {
      setTempoDecorrido(0);
      setStartTime(null);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [postoAtivo, startTime]);

  useEffect(() => {
    const checkTurnoChange = () => {
      const currentTurno = getTurno();
      const lastKnownTurno = localStorage.getItem('lastKnownTurno');

      if (currentTurno !== lastKnownTurno) {
        setPostoAtivo(null);
        setTempoDecorrido(0);
        setStartTime(null);
        localStorage.removeItem('postoAtivoPickTime');
        localStorage.removeItem('startTimePickTime');
        localStorage.setItem('lastKnownTurno', currentTurno);
      }
    };

    checkTurnoChange();
    const intervalId = setInterval(checkTurnoChange, 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handlePostoClick = (postoId: string) => {
    const turnoAtual = getTurno();
    const dataAtual = getDataAtual();

    setRegistros(prev => {
      const dataRegistros = prev[dataAtual] || {};

      if (postoAtivo === postoId) {
        // Para o cronômetro e soma ao tempo total
        const finalTime = tempoDecorrido + (dataRegistros[postoId]?.tempoTotal || 0);
        const updatedRegistro = {
          ...dataRegistros[postoId],
          cliques: dataRegistros[postoId]?.cliques || 0, // Não incrementa o clique ao parar
          tempoTotal: finalTime,
          turno: dataRegistros[postoId]?.turno || turnoAtual,
          dataRegistro: dataAtual,
          startTime: null, // Zera o startTime para parar a contagem
        };
        setPostoAtivo(null); // Desativa o posto
        setTempoDecorrido(0); // Zera o tempo decorrido na tela
        setStartTime(null); // Garante que startTime seja null
        return {
          ...prev,
          [dataAtual]: { ...dataRegistros, [postoId]: updatedRegistro },
        };
      } else {
        // Ativa novo posto e inicia a contagem, incrementando o clique
        const novoPostoAtivo = postoId;
        const novoStartTime = Date.now();

        let updatedPrev = { ...prev };
        if (postoAtivo) {
          const currentTimeAnterior = tempoDecorrido + (dataRegistros[postoAtivo]?.tempoTotal || 0);
          const updatedRegistroAnterior = {
            ...dataRegistros[postoAtivo],
            cliques: (dataRegistros[postoAtivo]?.cliques || 0),
            tempoTotal: currentTimeAnterior,
            turno: dataRegistros[postoAtivo]?.turno || turnoAtual,
            dataRegistro: dataAtual,
            startTime: null,
          };
          updatedPrev = {
            ...prev,
            [dataAtual]: { ...dataRegistros, [postoAtivo]: updatedRegistroAnterior },
          };
        }

        const newRegistro = {
          cliques: (dataRegistros[novoPostoAtivo]?.cliques || 0) + 1, // Incrementa o clique ao iniciar
          tempoTotal: dataRegistros[novoPostoAtivo]?.tempoTotal || 0,
          startTime: novoStartTime,
          turno: turnoAtual,
          dataRegistro: dataAtual,
        };
        setPostoAtivo(novoPostoAtivo);
        setTempoDecorrido(0);
        setStartTime(novoStartTime);
        return {
          ...updatedPrev,
          [dataAtual]: { ...dataRegistros, [novoPostoAtivo]: newRegistro },
        };
      }
    });
  };

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return [
      horas.toString().padStart(2, '0'),
      minutos.toString().padStart(2, '0'),
      segs.toString().padStart(2, '0'),
    ].join(':');
  };

  const tempoParaExibir = postoAtivo && startTime ? Math.floor((Date.now() - startTime) / 1000) : tempoDecorrido;

  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-screen-sm mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Controle de Tempos - PickTime</h1>
        <Link href="/relatorio" className="text-blue-600 hover:text-blue-800 text-sm">
          Ver Relatório →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 auto-rows-[minmax(0,_1fr)]">
        {postos.map((posto) => (
          <div
            key={posto.id}
            className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
              postoAtivo === posto.id ? 'ring-2 ring-yellow-400 bg-yellow-50 row-span-2' : ''
            }`}
          >
            <button
              onClick={() => handlePostoClick(posto.id)}
              className={`p-3 text-left w-full transition-colors duration-300 ${
                postoAtivo === posto.id ? 'bg-yellow-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">#{posto.id}</h2>
                  <p className="text-gray-600 text-xs">{posto.nome}</p>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  Cliques:<br />{registros[getDataAtual()]?.[posto.id]?.cliques || 0}
                </div>
              </div>

              {postoAtivo === posto.id && (
                <div className="transition-all duration-300 ease-in-out mt-2 pt-2 border-t border-yellow-200 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-yellow-700">AFINAÇÕES PRO</span>
                  <span className="font-mono text-xs bg-yellow-100 px-2 py-1 rounded text-yellow-800">
                    {formatarTempo(tempoParaExibir)}
                  </span>
                </div>
              )}
            </button>

            <div className="px-3 py-1 bg-gray-50 text-[10px] text-gray-500">
              Tempo total: {formatarTempo(registros[getDataAtual()]?.[posto.id]?.tempoTotal || 0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}