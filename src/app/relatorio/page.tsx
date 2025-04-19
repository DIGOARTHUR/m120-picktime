'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoMdArrowRoundBack } from "react-icons/io";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MdFilterListOff } from "react-icons/md";
import { BsFilter } from "react-icons/bs";
import { FaLinkedin } from "react-icons/fa";

type Registro = {
  cliques: number;
  tempoTotal: number;
  turno?: string;
  dataRegistro: string;
};

type RegistrosPorData = Record<string, Record<string, Record<string, Registro>>>;

export default function RelatorioPage() {
  const [registrosPorData, setRegistrosPorData] = useState<RegistrosPorData>({});
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [dadosFiltrados, setDadosFiltrados] = useState<Record<string, Record<string, Record<string, Registro>>>>({});
  const [mostrarFiltro, setMostrarFiltro] = useState(false);

  const getDataAtual = () => {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    return `${ano}-${mes}-${dia}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('registrosPickTime');
      if (saved) {
        const dados = JSON.parse(saved);
        setRegistrosPorData(dados);
        const dataAtual = getDataAtual();
        const dadosDoDia = dados[dataAtual] ? { [dataAtual]: dados[dataAtual] } : {};
        setDadosFiltrados(dadosDoDia);
      }
    }
  }, []);

  useEffect(() => {
    if (dataSelecionada) {
      const dataFormatada = formatarDataParaChave(dataSelecionada);
      const dadosDoDia = registrosPorData[dataFormatada] ? { [dataFormatada]: registrosPorData[dataFormatada] } : {};
      setDadosFiltrados(dadosDoDia);
    } else {
      const dataAtual = getDataAtual();
      const dadosDoDia = registrosPorData[dataAtual] ? { [dataAtual]: registrosPorData[dataAtual] } : {};
      setDadosFiltrados(dadosDoDia);
    }
  }, [dataSelecionada, registrosPorData]);

  const formatarDataParaChave = (data: Date): string => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${ano}-${mes}-${dia}`;
  };

  const formatarTempoParaMinutos = (segundos: number): string => {
    const minutosTotais = Math.floor(segundos / 60);
    return `${minutosTotais} min`;
  };

  const limparFiltro = () => {
    setDataSelecionada(null);
    setMostrarFiltro(false);
  };

  const handleDateChange = (date: Date | null) => {
    setDataSelecionada(date);
  };

  const toggleFiltro = () => {
    setMostrarFiltro(!mostrarFiltro);
  };

  const usandoFiltro = dataSelecionada !== null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold px-2">M120 - MONTAGEM</h1>
      <div className="flex justify-between items-center mb-6 p-6 bg-[#144E7C] rounded-lg h-[96px]">
        <h1 className="text-xl font-bold text-amber-50">Relatório de Paradas</h1>
        <div className="flex gap-4">
          <Link href="/picktime" className="flex items-center gap-2 text-amber-50 hover:text-blue-200 text-sm transition-colors">
            <IoMdArrowRoundBack /> Ver Registos
          </Link>
        </div>
      </div>
      <button
        onClick={toggleFiltro}
        className="flex items-center gap-2 text-amber-50 hover:text-blue-200 text-sm transition-colors"
      >
        {mostrarFiltro ? <MdFilterListOff size={30} className="text-black" /> : <BsFilter size={30} className="text-black" />}
      </button>
      {mostrarFiltro && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecione uma data:
              </label>
              <div className="flex gap-2">
                <DatePicker
                  selected={dataSelecionada}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecione uma data"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm"
                  isClearable
                />
                {usandoFiltro && (
                  <button
                    onClick={limparFiltro}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm whitespace-nowrap transition-colors"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        {usandoFiltro ? (
          <p>Mostrando dados para: {dataSelecionada?.toLocaleDateString('pt-BR')}</p>
        ) : (
          <p>Mostrando dados de hoje: {new Date().toLocaleDateString('pt-BR')}</p>
        )}
      </div>

      {Object.keys(dadosFiltrados).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
          {usandoFiltro
            ? `Nenhum registro encontrado para ${dataSelecionada?.toLocaleDateString('pt-BR')}`
            : 'Nenhum registro encontrado para hoje. Registre suas primeiras paradas na página principal.'}
        </div>
      ) : (
        Object.entries(dadosFiltrados)
          .sort(([dataA], [dataB]) => new Date(dataB).getTime() - new Date(dataA).getTime())
          .map(([data, turnosDoDia]) => (
            <div key={data} className="mb-8 bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  {new Date(data).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
              </div>

              {Object.entries(turnosDoDia)
                .sort(([turnoA], [turnoB]) => {
                  const ordemTurnos = ['08h-16h', '16h-00h', '00h-08h'];
                  return ordemTurnos.indexOf(turnoA) - ordemTurnos.indexOf(turnoB);
                })
                .map(([turno, registrosDoTurno]) => (
                  <div key={turno} className="mb-0">
                    <div className="px-4 py-3 bg-gray-100 border-b">
                      <h3 className="font-medium text-gray-700">
                        Turno: {turno}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Posto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Paradas
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Tempo Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.entries(registrosDoTurno)
                            .sort(([postoA], [postoB]) => parseInt(postoA.substring(1)) - parseInt(postoB.substring(1)))
                            .map(([postoId, registro], index) => (
                              <tr
                                key={postoId}
                                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}
                              >
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  #{postoId}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {registro.cliques}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {formatarTempoParaMinutos(registro.tempoTotal)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          ))
      )}
      <footer className="text-center text-xs text-gray-500 mt-6 mb-2">
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