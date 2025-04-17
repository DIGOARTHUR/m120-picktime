'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Registro = {
  cliques: number;
  tempoTotal: number;
  turno?: string;
  dataRegistro: string;
};

type RegistrosPorData = Record<string, Record<string, Registro>>;

export default function RelatorioPage() {
  const [registrosPorData, setRegistrosPorData] = useState<RegistrosPorData>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('registrosPickTime');
      if (saved) {
        setRegistrosPorData(JSON.parse(saved));
      }
    }
  }, []);

  const formatarTempoParaMinutos = (segundos: number): string => {
    const minutosTotais = Math.floor(segundos / 60);
    return `${minutosTotais} min`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Relatório de Tempos - PickTime</h1>
        <Link href="/picktime" className="text-blue-600 hover:text-blue-800">
          ← Voltar para Picktime
        </Link>
      </div>

      {Object.keys(registrosPorData).length === 0 ? (
        <div className="bg-white rounded-md shadow p-6 text-gray-600">
          Nenhum registro encontrado. Comece a registrar tempos na página inicial.
        </div>
      ) : (
        Object.entries(registrosPorData)
          .sort(([dataA], [dataB]) => new Date(dataA).getTime() - new Date(dataB).getTime())
          .map(([data, registrosDoDia]) => (
            <div key={data} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Data: {data}</h2>
              {Object.values(registrosDoDia)
                .reduce((acc, registro) => {
                  if (!acc.includes(registro.turno!)) {
                    acc.push(registro.turno!);
                  }
                  return acc;
                }, [] as string[])
                .sort((a, b) => {
                  const order = ['1º Turno', '2º Turno', '3º Turno'];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(turno => {
                  // Filtrar e ordenar os registros por postoId dentro de cada turno
                  const registrosOrdenados = Object.entries(registrosDoDia)
                    .filter(([, registro]) => registro.turno === turno)
                    .sort(([postoIdA], [postoIdB]) => {
                      const numeroA = parseInt(postoIdA.substring(1), 10);
                      const numeroB = parseInt(postoIdB.substring(1), 10);
                      return numeroA - numeroB;
                    });

                  return (
                    <div key={turno} className="mb-4">
                      <h3 className="font-medium text-gray-600">
                        Turno: {turno} ({
                          turno === '1º Turno' ? '08h - 16h' :
                          turno === '2º Turno' ? '16h - 00h' :
                          '00h - 08h'
                        })
                      </h3>
                      <table className="min-w-full divide-y divide-gray-200 bg-white rounded-md shadow overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Posto ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cliques
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tempo Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {registrosOrdenados.map(([postoId, registro]) => (
                            <tr key={postoId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{postoId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {registro.cliques}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatarTempoParaMinutos(registro.tempoTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          ))
      )}
    </div>
  );
}