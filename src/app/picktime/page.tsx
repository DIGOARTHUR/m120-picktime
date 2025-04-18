'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoMdArrowRoundForward } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";


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
    if (hour >= 8 && hour < 16) return '08h-16h';
    if (hour >= 16 && hour < 24) return '16h-00h';
    return '00h-08h';
  };

  const getDataAtual = (): string => {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    return `${ano}-${mes}-${dia}`;
  };

  const isFinalDoTurno = (): boolean => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    return (
      (hour === 7 && minutes >= 55) ||
      (hour === 15 && minutes >= 55) ||
      (hour === 23 && minutes >= 55)
    );
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

    if (postoAtivo && startTime) {
      const tick = () => {
        setTempoDecorrido(Math.floor((Date.now() - startTime) / 1000));
      };
      tick();
      intervalo = setInterval(tick, 1000);
    } else {
      setTempoDecorrido(0);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [postoAtivo, startTime]);

  useEffect(() => {
    const checkTurnoChange = () => {
      const turnoAtual = getTurno();
      const lastKnownTurno = localStorage.getItem('lastKnownTurno');
      const isFinalTurno = isFinalDoTurno();

      if (isFinalTurno || (turnoAtual !== lastKnownTurno && !isFinalTurno)) {
        // Finaliza o registro atual se houver
        if (postoAtivo && startTime) {
          const dataAtual = getDataAtual();
          const tempoFinal = Math.floor((Date.now() - startTime) / 1000);

          setRegistros(prev => {
            const dataRegistros = prev[dataAtual] || {};
            const tempoTotalFinal = tempoFinal + (dataRegistros[postoAtivo]?.tempoTotal || 0);

            return {
              ...prev,
              [dataAtual]: {
                ...dataRegistros,
                [postoAtivo]: {
                  cliques: (dataRegistros[postoAtivo]?.cliques || 0) + 1,
                  tempoTotal: tempoTotalFinal,
                  turno: turnoAtual,
                  dataRegistro: dataAtual,
                  startTime: null,
                },
              },
            };
          });
        }

        // Reseta apenas as variáveis temporárias
        setPostoAtivo(null);
        setStartTime(null);
        setTempoDecorrido(0);

        if (!isFinalTurno) {
          localStorage.setItem('lastKnownTurno', turnoAtual);
        }
      }
    };

    checkTurnoChange();
    const intervalId = setInterval(checkTurnoChange, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [postoAtivo, startTime]);

  const handlePostoClick = (postoId: string) => {
    const turnoAtual = getTurno();
    const dataAtual = getDataAtual();

    setRegistros(prev => {
      const dataRegistros = prev[dataAtual] || {};
      const novoRegistros = { ...prev };

      // Se já havia um posto ativo, salva o tempo acumulado
      if (postoAtivo) {
        const tempoAcumulado = tempoDecorrido + (dataRegistros[postoAtivo]?.tempoTotal || 0);

        novoRegistros[dataAtual] = {
          ...dataRegistros,
          [postoAtivo]: {
            cliques: (dataRegistros[postoAtivo]?.cliques || 0) + 1,
            tempoTotal: tempoAcumulado,
            turno: dataRegistros[postoAtivo]?.turno || turnoAtual,
            dataRegistro: dataAtual,
            startTime: null
          }
        };
      }

      // Se clicando no mesmo botão, apenas para a contagem
      if (postoAtivo === postoId) {
        setPostoAtivo(null);
        setStartTime(null);
        setTempoDecorrido(0);
        return novoRegistros;
      }

      // Ativa o novo posto
      const novoStartTime = Date.now();
      setPostoAtivo(postoId);
      setStartTime(novoStartTime);
      setTempoDecorrido(0);

      // Incrementa o clique no novo posto
      novoRegistros[dataAtual] = {
        ...novoRegistros[dataAtual] || {},
        [postoId]: {
          cliques: ((novoRegistros[dataAtual]?.[postoId]?.cliques) || 0) + 1,
          tempoTotal: novoRegistros[dataAtual]?.[postoId]?.tempoTotal || 0,
          startTime: novoStartTime,
          turno: turnoAtual,
          dataRegistro: dataAtual
        }
      };

      return novoRegistros;
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

  const tempoParaExibir = postoAtivo && startTime ? tempoDecorrido : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-screen-sm mx-auto">
     
      <h1 className="text-xl font-bold px-2">M120 - MONTAGEM </h1>
      <div className="flex justify-between items-center mb-4 p-6 bg-[#144E7C] rounded-lg">
        
        <div>
          <h1 className="text-xl font-bold text-amber-50">Registo Paradas </h1>
          <p className="text-amber-50 text-sm">Turno atual: {getTurno()}</p>
        </div>
        <Link href="/relatorio" className="flex justify-center items-center gap-2 text-amber-50 hover:text-blue-800 text-sm">
          Ver Relatório <IoMdArrowRoundForward />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 auto-rows-min">
        {postos.map((posto) => (
          <div
            key={posto.id}
            className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out ${postoAtivo === posto.id
              ? 'ring-2 ring-yellow-400 bg-yellow-50 row-span-2 scale-[1.01]'
              : 'hover:scale-[1.01]'
              }`}
          >
            <button
              onClick={() => handlePostoClick(posto.id)}
              className={`p-3 text-left w-full transition-colors duration-300 ${postoAtivo === posto.id ? 'bg-yellow-50' : 'hover:bg-gray-50'
                }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">#{posto.id}</h2>
                  <p className="text-gray-600 text-xs">{posto.nome}</p>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  Nº Paradas:<br />{registros[getDataAtual()]?.[posto.id]?.cliques || 0}
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
      <footer className="text-center text-xs text-gray-500 mt-14 mb-2">
        Made by{' '}
        <a
          href="https://www.linkedin.com/in/digoarthur/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-700 hover:underline"
        >
          <FaLinkedin className="text-blue-700" />
          digoarthur
        </a>
      </footer>
    </div>
  );
}