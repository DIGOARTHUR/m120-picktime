import Link from 'next/link';
import { FaChartBar, FaHistory, FaClock } from 'react-icons/fa';

export default function HomePage() {
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-indigo-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Controle de Paragens</h1>
          <p className="text-indigo-100 mt-1">Selecione uma opção</p>
        </div>

        {/* Botões */}
        <div className="p-6 space-y-4">
        <Link
            href="/picktime"
            className="flex items-center justify-between p-4 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                <FaClock className="text-xl" />
              </div>
              <span className="font-medium text-gray-800">PickTime</span>
            </div>
            <span className="text-purple-600">→</span>
          </Link>
          <Link
            href="/relatorio"
            className="flex items-center justify-between p-4 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                <FaChartBar className="text-xl" />
              </div>
              <span className="font-medium text-gray-800">Relatório</span>
            </div>
            <span className="text-blue-600">→</span>
          </Link>

          <Link
            href="/logs"
            className="flex items-center justify-between p-4 rounded-lg bg-green-50 hover:bg-green-100 border border-green-100 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-green-100 text-green-600 group-hover:bg-green-200">
                <FaHistory className="text-xl" />
              </div>
              <span className="font-medium text-gray-800">Logs</span>
            </div>
            <span className="text-green-600">→</span>
          </Link>

       
        </div>

        {/* Rodapé */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-sm text-gray-500">Sistema de controle v1.0</p>
        </div>
      </div>
    </div>
  );
}