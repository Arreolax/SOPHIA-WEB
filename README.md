# SOPHIA Web

  <img src="https://img.shields.io/badge/En%20Desarrollo-%20?style=flat&label=Estado&labelColor=purple&color=red">
  <img src="https://img.shields.io/badge/Next.js-Framework-green?style=flat&labelColor=purple&logo=next.js&logoColor=white">
  <img src="https://img.shields.io/badge/PostgreSQL-DataBase-green?style=flat&labelColor=purple&logo=postgresql&logoColor=white">

<hr>

<h2>Desarrolladores</h2>
<ul>
  <li>
    <a href="https://github.com/GuadalupeVargas07" target="_blank">GuadalupeDuh</a> - Analista, Desarrolladora Frontend y Testing
    <img src="https://img.shields.io/badge/Diseñadora%20UI/UX-%20?style=flat&color=orange">
  </li>
  <li>
    <a href="https://github.com/Arreolax" target="_blank">Alejandro Arreola</a> - Desarrollador Backend, Arquitecturas e Integraciones <img src="https://img.shields.io/badge/Desarrollador%20Backend-%20?style=flat&color=purple">
  </li>
  <li>
    <a href="https://github.com/FerMich29" target="_blank">Fernanda Aguayo</a> - Diseñadora, Desarrolladora Frontend, y Testing <img src="https://img.shields.io/badge/Lider%20del%20Proyecto-%20?style=flat&color=black">
  </li>
  <li>
    <a href="https://github.com/Jaysons-s" target="_blank">JaysonS_s</a> - Diseñador DB y Desarrollador IA <img src="https://img.shields.io/badge/Desarrollador%20IA-%20?style=flat&color=yellow">
  </li>
</ul>

## Visión General

<span><strong>S</strong>upport</span>
<span><strong>OP</strong>erations</span>
<span><strong>H</strong>uman</span>
<span><strong>IA</strong></span>
o por sus iniciales <strong>SOPHIA</strong> es una aplicación que proporciona un portal para dos tipos de usuarios – **Técnicos/Administradores** y **Usuarios** – con autenticación respaldada por **Supabase**. La app incluye tableros separados para usuarios del portal y el personal de soporte, un flujo de registro, login/logout y un conjunto de rutas API que gestionan usuarios y cookies de sesión.

## Funcionalidades

- Enrutamiento basado en roles (`admin`, `tecnico`, `usuario`).
- Cookies HTTP‑only seguras para el token de acceso de Supabase y el rol encriptado.
- Rutas API para **registro**, **login**, **logout**, **me** y un endpoint de prueba.
- Componentes UI reutilizables como barra lateral, animación de hojas cayendo y contenedores de layout.
- Directorios `app` separados de Next.js para las secciones de portal y soporte.
- Linting y configuración de TypeScript integrados.

## Tecnologías

| Capa                       | Tecnología                           |
| -------------------------- | ------------------------------------ |
| Framework                  | Next.js 13 (router de app)           |
| Lenguaje                   | TypeScript & React                   |
| UI                         | Tailwind / módulos CSS (globals.css) |
| Auth & BD                  | Supabase (SDK cliente)               |
| Estilos                    | CSS, assets SVG                      |
| Herramientas de desarrollo | ESLint, Prettier                     |
| Deploy                     | ---         |