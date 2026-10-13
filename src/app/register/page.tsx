"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [nameValue, setNameValue] = useState("");
  const [lastnameValue, setLastnameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [capsWarning, setCapsWarning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setErrorMessage("");
    setNameValue("");
    setLastnameValue("");
    setEmailValue("");
    setPasswordValue("");
  }, []);

  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setErrorMessage(
        "Sesión no válida o expirada. Por favor regístrate o inicia sesión.",
      );
    }
  }, [searchParams]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setCapsWarning(true);
    } else {
      setCapsWarning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true); 
    setIsSuccess(false);

    try {
      const respuesta = await fetch("/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: nameValue, 
          lastname: lastnameValue, 
          email: emailValue, 
          password: passwordValue 
        }),
      });

      if (respuesta.ok) {
        setIsLoading(false); 
        setIsSuccess(true); 

        setTimeout(() => {
          router.push("/portal/dashboard");
          router.refresh();
        }, 800);
      } else {
        setIsLoading(false); 
        const errorData = await respuesta.json();
        setErrorMessage(
          errorData.mensaje || errorData.message || "Error en el registro.",
        );
      }
    } catch (error) {
      setIsLoading(false); 
      setErrorMessage("Ocurrió un error al intentar conectarse al servidor.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden">
      <div
        className="absolute top-0 left-0 w-1/2 h-full bg-[#323454]"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)" }}
      ></div>
      <div
        className="absolute top-0 right-0 w-1/2 h-full bg-[#323454]"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)" }}
      ></div>

      <div className="relative bg-[#323454] w-10/12 md:w-[425px] p-8 shadow-md text-center m-0">
        <div className="relative bg-white w-full md:w-[360px] p-8 shadow-md text-center mx-auto">
          <div className="flex justify-center mb-6 relative w-full h-24">
            <Image
              src="/images/300x150.png"
              alt="Logo"
              fill
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-contain"
              priority
            />
          </div>

          <form id="registerForm" className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex gap-4 w-full">
              <div className="flex items-center border-b border-gray-500 pb-2 focus-within:border-[#323454] transition w-1/2">
                <i className="fa fa-id-card text-black mr-3"></i>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="Nombre"
                  className="bg-transparent outline-none w-full text-black"
                  required
                  disabled={isLoading || isSuccess}
                />
              </div>

              <div className="flex items-center border-b border-gray-500 pb-2 focus-within:border-[#323454] transition w-1/2">
                <i className="fa fa-id-card text-black mr-3"></i>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={lastnameValue}
                  onChange={(e) => setLastnameValue(e.target.value)}
                  placeholder="Apellido"
                  className="bg-transparent outline-none w-full text-black"
                  required
                  disabled={isLoading || isSuccess}
                />
              </div>
            </div>

            <div className="flex items-center border-b border-gray-500 pb-2 focus-within:border-[#323454] transition">
              <i className="fa fa-user text-black mr-3"></i>
              <input
                type="email"
                id="email"
                name="email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                placeholder="Email"
                className="bg-transparent outline-none w-full text-black"
                required
                disabled={isLoading || isSuccess}
              />
            </div>

            <div className="relative flex items-center border-b border-gray-500 pb-2 focus-within:border-[#323454] transition">
              <i className="fa fa-key text-black mr-3"></i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                placeholder="Contraseña"
                className="bg-transparent outline-none w-full pr-10 text-black"
                onKeyUp={handleKeyUp}
                required
                disabled={isLoading || isSuccess}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition"
                disabled={isLoading || isSuccess}
              >
                <i
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>

            {capsWarning && (
              <div className="text-xs text-yellow-600 flex items-center gap-1 mt-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Bloq Mayús activado</span>
              </div>
            )}

            {errorMessage && (
              <div className="bg-opacity-40 text-red-600 font-bold rounded p-2 bg-red-600/10">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`mt-6 inline-flex justify-center items-center rounded px-6 py-3 text-white font-medium transition w-full ${
                  isSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#323454] hover:bg-[#181928]"
                } ${(isLoading || isSuccess) ? "opacity-90 cursor-not-allowed" : ""}`}
              >
                {/* Renderizado condicional del contenido del botón */}
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Procesando...
                  </>
                ) : isSuccess ? (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    ¡Registrado!
                  </>
                ) : (
                  "REGISTRARSE"
                )}
              </button>

              <Link
                href="/login"
                className="text-sm text-gray-700 hover:underline mt-2"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          Cargando plataforma...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}