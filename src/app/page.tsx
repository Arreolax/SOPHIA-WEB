"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Headset,
  MonitorCog,
  Clock,
  Bot,
  Activity,
  ListChecks,
  Wrench,
  Scale,
} from "lucide-react";

import { FallingLeavesWrapper } from "./components/FallingLeavesWrapper";

export default function Home() {

  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] text-slate-900 font-sans relative overflow-x-hidden flex flex-col">
      {/* Efectos de luz difuminada de fondo */}
      <div className="absolute top-[10%] left-[-10%] w-125 h-125 rounded-full bg-[#323454]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[-10%] w-150 h-150 rounded-full bg-indigo-200/30 blur-[140px] pointer-events-none" />

      {/* Animación de hojas del código anterior */}
      <FallingLeavesWrapper
        className="fixed inset-0 pointer-events-none z-0"
        shapes={["maple", "birch", "oak", "oval"]}
        count={50}
        speed={2}
        wind={-5}
        size={100}
      />

      {/* Barra de navegación superior */}
      <header className="fixed w-full bg-white/85 backdrop-blur-md border-b border-slate-100  top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#1E233A]">SOPHIA Web</span>
          </div>

          {/* Únicos botones de navegación: Iniciar Sesión y Registrarse */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-[#323454] px-3 py-2 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="text-xs sm:text-sm font-semibold text-white bg-[#323454] hover:bg-[#181928] px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-28 sm:pt-32 z-10 flex flex-col items-center">
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/70 text-[#232946] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#232946]" />
          <span>SOPHIA • IT OPERATIONS & INTELLIGENCE ECOSYSTEM</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-center tracking-tight text-[#1E233A] leading-tight mb-2">
          SOPHIA WEB
        </h1>

        {/* Tarjeta descriptiva central (con línea azul arriba) */}
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_10px_35px_rgba(35,41,70,0.04)] border border-slate-100 overflow-hidden mb-10">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#323454] via-[#454873] to-[#323454]" />
          <div className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#232946] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
              Una aplicación que proporciona un portal para dos tipos de usuarios —{" "}
              <strong className="font-semibold text-slate-800">
                Técnicos/Administradores
              </strong>{" "}
              y <strong className="font-semibold text-slate-800">Usuarios</strong> —
              con autenticación respaldada por Supabase. La plataforma incluye
              tableros separados para solicitantes y personal de soporte, un flujo
              integral de registro, gestión de sesiones seguras mediante cookies y
              un conjunto de rutas API optimizadas.
            </p>
          </div>
        </div>

        {/* Grid de dos columnas: Rectángulos informativos (no cliqueables y con línea azul arriba) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Rectángulo 1: Portal de Usuarios */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_10px_35px_rgba(35,41,70,0.04)] border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[240px]">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#323454] via-[#454873] to-[#323454]" />
            <div className="p-7 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#232946] flex items-center justify-center mb-5">
                  <Headset className="w-5 h-5" />
                </div>

                <h2 className="text-lg font-bold text-[#1E233A] mb-2">
                  Portal de Usuarios
                </h2>

                <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed mb-6">
                  Crea tickets de soporte, consulta el estado de tus solicitudes
                  en tiempo real y recibe asistencia inmediata con el agente de IA.
                </p>
              </div>

              {/* Etiquetas inferiores */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-[11px] font-medium">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Autoservicio 24/7
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-[11px] font-medium">
                  <Bot className="w-3 h-3 text-slate-500" />
                  Asistente IA
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-[11px] font-medium">
                  <Activity className="w-3 h-3 text-slate-500" />
                  Seguimiento en vivo
                </span>
              </div>
            </div>
          </div>

          {/* Rectángulo 2: Consola de Técnicos & Admin */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_10px_35px_rgba(35,41,70,0.04)] border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[240px]">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#323454] via-[#454873] to-[#323454]" />
            <div className="p-7 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#232946] text-white flex items-center justify-center mb-5">
                  <MonitorCog className="w-5 h-5" />
                </div>

                <h2 className="text-lg font-bold text-[#1E233A] mb-2">
                  Consola de Técnicos & Admin
                </h2>

                <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed mb-6">
                  Gestión y resolución de incidentes IT, asistencia técnica
                  potenciada por IA, runbooks interactivos y balance de cargas
                  para supervisores.
                </p>
              </div>

              {/* Etiquetas inferiores */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-[11px] font-medium">
                  <ListChecks className="w-3 h-3 text-slate-500" />
                  Cola de Tickets L1/L3
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-[11px] font-medium">
                  <Wrench className="w-3 h-3 text-slate-500" />
                  AI Copilot ITIL
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-[11px] font-medium">
                  <Scale className="w-3 h-3 text-slate-500" />
                  Balance de Cargas
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}