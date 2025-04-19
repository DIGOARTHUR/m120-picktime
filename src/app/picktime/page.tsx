'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoMdArrowRoundForward } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";

type Posto = {
  id: string;
  nome: string;
};

type RegistroAntigo = Omit<Registro, 'turno'> & { turno?: string };
type Registro = {
  cliques: number;
  tempoTotal: number;
  startTime?: number | null;
  turno: string;
  dataRegistro: string;
  ativo: boolean;
};

type RegistrosPorData = Record<string, Record<string, Record<string, Registro>>>;

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
  const [reorganizacaoFeita, setReorganizacaoFeita] = useState<boolean>(false);

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
    return (hour === 7 && minutes >= 55) ||
           (hour === 15 && minutes >= 55) ||
           (hour === 23 && minutes >= 55);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !reorganizacaoFeita) {
      const saved = localStorage.getItem('registrosPickTime');
      if (saved) {
        try {
          const dadosAntigos = JSON.parse(saved);
          const novosDados: RegistrosPorData = {}; // Alterado para const
          let precisaAtualizar = false;

          for (const data in dadosAntigos) {
            if (dadosAntigos.hasOwnProperty(data)) {
              if (typeof dadosAntigos[data] === 'object' && !Array.isArray(dadosAntigos[data])) {
                novosDados[data] = {};
                for (const postoId in dadosAntigos[data]) {
                  if (dadosAntigos[data].hasOwnProperty(postoId)) {
                    const registroAntigo = dadosAntigos[data][postoId] as RegistroAntigo;
                    const turno = registroAntigo.turno || getTurno(); // Se turno não existir, usa o turno atual
                    if (!novosDados[data][turno]) {
                      novosDados[data][turno] = {};
                    }
                    novosDados[data][turno][postoId] = {
                      cliques: registroAntigo.cliques || 0,
                      tempoTotal: registroAntigo.tempoTotal || 0,
                      startTime: registroAntigo.startTime || null,
                      turno: turno,
                      dataRegistro: registroAntigo.dataRegistro || data,
                      ativo: false,
                    };
                    if (!precisaAtualizar && JSON.stringify(dadosAntigos) !== JSON.stringify(novosDados)) {
                      precisaAtualizar = true;
                    }
                  } else if (typeof dadosAntigos[data] === 'object' && Array.isArray(Object.values(dadosAntigos[data])[0])) {
                    console.warn('Estrutura de dados muito antiga detectada e não migrada automaticamente.');
                    setReorganizacaoFeita(true);
                    return;
                  }
                }
              } else if (typeof dadosAntigos[data] === 'object' && Array.isArray(Object.values(dadosAntigos[data])[0])) {
                console.warn('Estrutura de dados antiga (array por dia) detectada e não migrada automaticamente.');
                setReorganizacaoFeita(true);
                return;
              } else {
                novosDados[data] = dadosAntigos[data];
              }
            }
          }

          if (precisaAtualizar) {
            localStorage.setItem('registrosPickTime', JSON.stringify(novosDados));
            setRegistros(novosDados);
            console.log('Estrutura do localStorage reorganizada.');
          } else {
            setRegistros(dadosAntigos as RegistrosPorData);
            console.log('Estrutura do localStorage já está atualizada.');
          }
        } catch (error) {
          console.error('Erro ao tentar reorganizar a estrutura do localStorage:', error);
        } finally {
          setReorganizacaoFeita(true);
        }
      } else {
        setReorganizacaoFeita(true);
      }
    }
  }, [reorganizacaoFeita]);

  useEffect(() => {
    if (typeof window !== 'undefined' && reorganizacaoFeita) {
      localStorage.setItem('registrosPickTime', JSON.stringify(registros));
      if (postoAtivo) {
        localStorage.setItem('postoAtivoPickTime', postoAtivo);
        localStorage.setItem('startTimePickTime', String(startTime || Date.now()));
      } else {
        localStorage.removeItem('postoAtivoPickTime');
        localStorage.removeItem('startTimePickTime');
      }
    }
  }, [registros, postoAtivo, startTime, reorganizacaoFeita]);

  useEffect(() => {
    const checkTurnoChange = () => {
      const turnoAtual = getTurno();
      const lastKnownTurno = localStorage.getItem('lastKnownTurnoPickTime');
      const isFinalTurno = isFinalDoTurno();

      if (isFinalTurno || (turnoAtual !== lastKnownTurno && !isFinalTurno)) {
        if (postoAtivo && startTime) {
          const dataAtual = getDataAtual();
          const turnoAnterior = getTurno();
          const tempoFinal = Math.floor((Date.now() - startTime) / 1000) + tempoDecorrido;

          setRegistros(prev => {
            const dataRegistros = prev[dataAtual] || {};
            const turnoRegistros = dataRegistros[turnoAnterior] || {};
            return {
              ...prev,
              [dataAtual]: {
                ...dataRegistros,
                [turnoAnterior]: {
                  ...turnoRegistros,
                  [postoAtivo]: {
                    cliques: (turnoRegistros[postoAtivo]?.cliques || 0),
                    tempoTotal: tempoFinal,
                    turno: turnoAnterior,
                    dataRegistro: dataAtual,
                    startTime: null,
                    ativo: false
                  }
                }
              }
            };
          });
        }

        setPostoAtivo(null);
        setStartTime(null);
        setTempoDecorrido(0);
        localStorage.removeItem('postoAtivoPickTime');
        localStorage.removeItem('startTimePickTime');

        localStorage.setItem('lastKnownTurnoPickTime', turnoAtual);
      }
    };

    checkTurnoChange();
    const intervalId = setInterval(checkTurnoChange, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [postoAtivo, startTime, tempoDecorrido]); // Adicionadas as dependências faltantes

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (postoAtivo && startTime) {
      const tick = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTempoDecorrido(elapsed);
        localStorage.setItem('startTimePickTime', String(now - (elapsed * 1000)));
      };
      tick();
      interval = setInterval(tick, 1000);
    } else {
      setTempoDecorrido(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [postoAtivo, startTime]);

  const handlePostoClick = (postoId: string) => {
    const turnoAtual = getTurno();
    const dataAtual = getDataAtual();

    setRegistros(prev => {
      const dataRegistros = prev[dataAtual] || {};
      const turnoRegistros = dataRegistros[turnoAtual] || {};
      const registroExistente = turnoRegistros[postoId] || { cliques: 0, tempoTotal: 0, ativo: false };
      const novoRegistros = { ...prev };

      if (postoAtivo && postoAtivo !== postoId) {
        const tempoAcumuladoAnterior = tempoDecorrido + (turnoRegistros[postoAtivo]?.tempoTotal || 0);
        novoRegistros[dataAtual] = {
          ...dataRegistros,
          [turnoAtual]: {
            ...turnoRegistros,
            [postoAtivo]: {
              ...turnoRegistros[postoAtivo],
              tempoTotal: tempoAcumuladoAnterior,
              startTime: null,
              ativo: false
            }
          }
        };
      }

      if (postoAtivo === postoId) {
        const tempoFinal = tempoDecorrido + registroExistente.tempoTotal;
        novoRegistros[dataAtual] = {
          ...dataRegistros,
          [turnoAtual]: {
            ...turnoRegistros,
            [postoId]: {
              ...registroExistente,
              tempoTotal: tempoFinal,
              startTime: null,
              ativo: false
            }
          }
        };
        setPostoAtivo(null);
        setStartTime(null);
        setTempoDecorrido(0);
        localStorage.removeItem('postoAtivoPickTime');
        localStorage.removeItem('startTimePickTime');
        return novoRegistros;
      }

      if (postoAtivo !== postoId) {
        const novoStartTime = Date.now();
        setPostoAtivo(postoId);
        setStartTime(novoStartTime);
        setTempoDecorrido(0);
        localStorage.setItem('postoAtivoPickTime', postoId);
        localStorage.setItem('startTimePickTime', String(novoStartTime));

        novoRegistros[dataAtual] = {
          ...novoRegistros[dataAtual] || {},
          [turnoAtual]: {
            ...novoRegistros[dataAtual]?.[turnoAtual] || {},
            [postoId]: {
              cliques: registroExistente.ativo ? registroExistente.cliques : registroExistente.cliques + 1,
              tempoTotal: registroExistente.tempoTotal || 0,
              startTime: novoStartTime,
              turno: turnoAtual,
              dataRegistro: dataAtual,
              ativo: true
            }
          }
        };
      }

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
      <h1 className="text-xl font-bold px-2">M120 - MONTAGEM</h1>
      <div className="flex justify-between items-center mb-4 p-6 bg-[#144E7C] rounded-lg">
        <div>
          <h1 className="text-xl font-bold text-amber-50">Registo Paradas</h1>
          <p className="text-amber-50 text-sm">Turno atual: {getTurno()}</p>
        </div>
        <Link href="/relatorio" className="flex justify-center items-center gap-2 text-amber-50 hover:text-blue-800 text-sm">
          Ver Relatório <IoMdArrowRoundForward />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 auto-rows-min">
        {postos.map((posto) => {
          const isAtivo = postoAtivo === posto.id;
          const registroAtual = registros[getDataAtual()]?.[getTurno()]?.[posto.id] || {
            cliques: 0,
            tempoTotal: 0,
            ativo: false
          };

          return (
            <div
              key={posto.id}
              className={`rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out ${isAtivo
                ? 'ring-2 ring-yellow-400 bg-yellow-50 row-span-2 scale-[1.01]'
                : 'hover:scale-[1.01]'
              }`}
            >
              <button
                onClick={() => handlePostoClick(posto.id)}
                className={`p-3 text-left w-full transition-colors duration-300 ${isAtivo ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-gray-800 text-sm">#{posto.id}</h2>
                    <p className="text-gray-600 text-xs">{posto.nome}</p>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    Nº Paradas:<br />{registroAtual.cliques}
                  </div>
                </div>

                {isAtivo && (
                  <div className="transition-all duration-300 ease-in-out mt-2 pt-2 border-t border-yellow-200 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-yellow-700">AFINAÇÕES PRO</span>
                    <span className="font-mono text-xs bg-yellow-100 px-2 py-1 rounded text-yellow-800">
                      {formatarTempo(tempoParaExibir)}
                    </span>
                  </div>
                )}
              </button>

              <div className="px-3 py-1 bg-gray-50 text-[10px] text-gray-500">
                Tempo total: {formatarTempo(registroAtual.tempoTotal)}
              </div>
            </div>
          );
        })}
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