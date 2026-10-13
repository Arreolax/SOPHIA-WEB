"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [resultado, setResultado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const probarConexion = async () => {
    setCargando(true);
    setResultado(null);
    try {
      const respuesta = await fetch("/api/test");
      const datos = await respuesta.json();
      setResultado(`${datos.estado} ${datos.mensaje ? '- ' + datos.mensaje : ''}`);
    } catch (error) {
      setResultado("Error 🔴 - No se pudo conectar con la API local.");
    }
    setCargando(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-800">SOPHIA Web</span>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/login"
            className="text-slate-600 hover:text-blue-600 font-medium py-2 px-4 rounded-xl transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link 
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">

          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤖</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            SOPHIA Web
          </h1>
          <p className="text-slate-500 mb-8">
            Portal centralizado de soporte técnico y base de conocimientos.
          </p>

          <button
            onClick={probarConexion}
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {cargando ? "Conectando..." : "Probar Base de Datos"}
          </button>

          {resultado && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-medium animate-pulse transition-colors ${
              resultado.includes('Exitosa') 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {resultado}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}