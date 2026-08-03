<div align="center">

# 💚 VerdeAhorro

**Tu planificador de gastos, ahorro personal y gestión de autonomía financiera — sin bancos, sin tarjetas, sin complicaciones.**

[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.5-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide-Icons-F56565?logo=feather&logoColor=white)](https://lucide.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

<br/>

<img src="https://img.shields.io/badge/Estado-Producción%20Lista-059669?style=for-the-badge" alt="Estado Producción Lista"/>

</div>

---

## 📖 Descripción

**VerdeAhorro** es una aplicación web de gestión financiera personal y de pareja que te permite organizar tus gastos mensuales, calcular la duración real de tus ahorros según tu situación laboral, aplicar la **regla 50/30/20** a tu presupuesto y definir metas de ahorro claras — todo sin vincular cuentas bancarias ni tarjetas.

Ideal para quien quiere tomar el control de sus finanzas de forma simple, visual, segura y totalmente privada.

---

## ✨ Características Principales

| Funcionalidad | Descripción |
|:---|:---|
| 📊 **Regla 50/30/20** | Distribución automática de tu ingreso: 50% gastos fijos, 30% ocio, 20% ahorro |
| 📈 **Gráficos Interactivos (Chart.js)** | Gráficos de donut por categoría y barras de reparto personal vs pareja en tiempo real |
| 🛡️ **Modo Colchón & Situación Laboral** | Calculadora de duración del dinero (Runway) y 3 planes adaptativos (*Empleado*, *Paro con Subsidio*, *Sin Ingresos*) |
| 💑 **Modo Pareja 50/50** | Activa/desactiva gastos compartidos con código de invitación único (`VA-8492`) y reparto 50/50 |
| 🎯 **Reto del Preahorro (20%)** | Barra de progreso mensual de ahorro con cálculo de euros restantes por ingresar |
| 🔔 **Modales de Confirmación & Configuración** | Pop-ups flotantes para activar/desactivar modos y editar tu situación financiera |
| 💾 **Doble Persistencia** | Sincronización automática con Supabase DB y respaldo instantáneo en `localStorage` |
| 🔒 **Seguridad Avanzada (10 capas)** | Desinfección XSS, limitación de frecuencia (rate-limiting), validación estricta y protección de sesión |
| 📱 **Diseño Adaptativo & Glassmorphism** | Cabecera transparente fija idéntica a la landing page y layouts que se auto-ajustan |

---

## 🛠️ Stack Tecnológico

```
Frontend        →  HTML5 + Vanilla CSS + JavaScript (ES Modules)
Visualización   →  Chart.js 4.5
Bundler         →  Vite 8 (Multi-Page Application)
Backend / DB    →  Supabase (PostgreSQL + Auth)
Seguridad       →  Módulo Custom de Seguridad (XSS, Rate-Limiting, Password Policy)
Iconos          →  Lucide Icons
Fuentes         →  Plus Jakarta Sans + Inter (Google Fonts)
Animaciones     →  Canvas Confetti
```

---

## 📁 Estructura del Proyecto

```
Proyecto-Ahorros/
├── index.html            # Landing page (hero, simulador, features, FAQ, auth modal)
├── dashboard.html        # Panel privado (resumen, gráficos, modo colchón, modo pareja)
├── vite.config.js        # Configuración Vite MPA (multi-página)
├── package.json
├── README.md             # Documentación del proyecto
├── .env                  # Variables de entorno (Supabase credentials) — ignóralo en Git
└── src/
    ├── main.js           # Lógica landing page, simulador y autenticación
    ├── dashboard.js      # Lógica dashboard, gráficos Chart.js, cálculo colchón y modos
    ├── api.js            # Cliente Supabase API (Auth + Profiles + Expenses + Active Modes)
    ├── security.js       # Módulo de seguridad (XSS, Rate-Limiting, Session, Obfuscation)
    ├── supabase.js       # Inicialización de Supabase client
    └── style.css         # Sistema de diseño (tokens CSS, glassmorphism, modales, responsive)
```

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- [pnpm](https://pnpm.io/) (o npm/yarn)
- Una cuenta en [Supabase](https://supabase.com/)

### 1. Clonar el repositorio

```bash
git clone https://github.com/EstebanRodriguezGutierrezDEV/VerdeAhorro
cd VerdeAhorro
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Ejecutar en desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`

### 5. Build de producción

```bash
pnpm build
pnpm preview
```

---

## 🎨 Sistema de Diseño

VerdeAhorro utiliza un sistema de diseño basado en **tokens CSS** con una paleta **blanca y verde esmeralda**:

| Token | Valor | Uso |
|:---|:---|:---|
| `--primary-emerald` | `#059669` | Color primario, botones, enlaces |
| `--emerald-accent` | `#10B981` | Acentos, gradientes, barras de progreso |
| `--text-dark` | `#0F172A` | Títulos y textos principales de alto contraste |
| `--bg-primary` | `#FFFFFF` | Fondo principal de tarjetas |
| `--bg-secondary` | `#F8FAFC` | Fondo secundario de páginas |

**Efectos visuales incluidos:**
- Glassmorphism (`backdrop-filter: blur(12px)`)
- Cabecera fija compartida entre la Landing Page y el Dashboard
- Modales emergentes flotantes centrado con fondo desenfocado
- Gráficos Donut y Barras responsivos de Chart.js
- Lluvia de Confetti al alcanzar metas o activar modos

---

## 📱 Páginas de la Aplicación

### 🏠 Landing Page (`index.html`)

- Cabecera transparente fija con logo e inicio de sesión
- Hero section con tarjeta visual interactiva
- Simulador interactivo de distribución de ingresos (slider)
- Sección de funcionalidades explicativas
- Modo Pareja y Calculadora de ahorro personalizada
- FAQ con acordeones interactivos
- Modal de registro e inicio de sesión seguro

### 📊 Dashboard (`dashboard.html`)

- Cabecera fija con logotipo, conmutadores de modo (**Modo Colchón 🛡️** y **Modo Pareja 💑**), perfil y cierre de sesión
- **Gestión de Ahorro & Situación Laboral (Modo Colchón)**:
  - 3 planes adaptativos (*Empleado*, *Paro con Subsidio*, *Sin Ingresos*)
  - Calculadora en tiempo real de meses de autonomía (Runway)
  - Botón de edición de datos en Pop-up modal
- **Cuadrícula de Tarjetas Resumen**: Ingreso, Gastos, Meta y Pareja
- **Gráficos Interactivos (Chart.js)**:
  - Donut: Gastos Fijos vs Ocio vs Meta de Ahorro
  - Barras: Gastos Personales vs Reparto 50/50 Pareja
- **Formulario de Registro de Gastos**: Botones separados para *Gasto Personal* y *Gasto Pareja 💑*
- **Panel de Vinculación en Pareja**: Código de invitación único (`VA-8492`) y formulario de enlace
- **Reto del Preahorro**: Barra de progreso del 20% y contador de euros restantes por depositar

---

## 🔒 Privacidad y Seguridad

VerdeAhorro **no accede a tu banco ni a tus tarjetas**. Toda la información es introducida manualmente por el usuario.

- **Protección de Datos**: Supabase PostgreSQL con Row Level Security (RLS) activado.
- **Seguridad en Frontend (`src/security.js`)**:
  - Desinfección HTML y sanitización estricta contra ataques XSS.
  - Limitador de intentos (rate-limiting) en formularios de acceso.
  - Validación de contraseña fuerte.
  - Ofuscación de errores y gestión de sesión segura.

---

## 🗺️ Roadmap Completado

- [x] Landing page con diseño premium
- [x] Sistema de autenticación seguro (registro + login)
- [x] Dashboard interactivo con tarjetas financieras
- [x] Registro y eliminación de gastos con persistencia doble
- [x] Regla 50/30/20 con gráficos Chart.js en tiempo real
- [x] Modo Pareja (toggle + código de invitación + gastos compartidos)
- [x] Modo Colchón (gestión de autonomía financiera + 3 planes laborales)
- [x] Modales de confirmación y configuración emergentes flotantes
- [x] Módulo de seguridad integral (XSS, Rate-Limiting, Password Policy)
- [x] Documentación y README completo para producción


<div align="center">

Hecho con 💚 por **Esteban** · [VerdeAhorro](https://github.com/EstebanRodriguezGutierrezDEV/VerdeAhorro)

</div>
