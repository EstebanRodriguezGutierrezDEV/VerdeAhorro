<div align="center">

# 💚 VerdeAhorro

**Tu planificador de gastos y ahorro personal — sin bancos, sin tarjetas, sin complicaciones.**

[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide-Icons-F56565?logo=feather&logoColor=white)](https://lucide.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

<br/>

<img src="https://img.shields.io/badge/Estado-En%20Desarrollo-059669?style=for-the-badge" alt="En desarrollo"/>

</div>

---

## 📖 Descripción

**VerdeAhorro** es una aplicación web de gestión financiera personal que te permite organizar tus gastos mensuales, aplicar la **regla 50/30/20** a tu presupuesto y definir metas de ahorro claras — todo sin vincular cuentas bancarias ni tarjetas.

Ideal para quien quiere tomar el control de sus finanzas de forma simple, visual y privada.

---

## ✨ Características Principales

| Funcionalidad | Descripción |
|:---|:---|
| 📊 **Regla 50/30/20** | Distribución automática de tu ingreso: 50% gastos fijos, 30% ocio, 20% ahorro |
| 💰 **Registro de Gastos** | Añade gastos por categoría con actualización instantánea del presupuesto |
| 🎯 **Meta de Ahorro** | Define tu objetivo financiero y sigue tu progreso con barra visual |
| 💑 **Modo Pareja** | Activa/desactiva gastos compartidos con reparto 50/50 automático |
| 🔐 **Autenticación** | Registro e inicio de sesión seguro con Supabase Auth |
| 📱 **Responsive** | Diseño adaptado a móvil, tablet y escritorio |
| 🧮 **Calculadora Interactiva** | Simulador de distribución de ingresos en la landing page |
| 🎉 **Animaciones** | Confetti al alcanzar logros + micro-animaciones premium |

---

## 🛠️ Stack Tecnológico

```
Frontend        →  HTML5 + Vanilla CSS + JavaScript (ES Modules)
Bundler         →  Vite 8 (Multi-Page Application)
Backend / Auth  →  Supabase (PostgreSQL + Auth)
Iconos          →  Lucide Icons
Fuentes         →  Plus Jakarta Sans + Inter (Google Fonts)
Animaciones     →  Canvas Confetti
```

---

## 📁 Estructura del Proyecto

```
Proyecto-Ahorros/
├── index.html            # Landing page (inicio, features, FAQ, auth modal)
├── dashboard.html        # Panel privado del usuario (gastos, metas, pareja)
├── vite.config.js        # Configuración Vite MPA (multi-página)
├── package.json
├── .env                  # Variables de entorno (Supabase keys) — NO se sube a Git
├── .gitignore
├── public/               # Assets estáticos
└── src/
    ├── main.js           # Lógica de la landing page + auth modal
    ├── dashboard.js      # Lógica del dashboard (gastos, totales, modo pareja)
    ├── api.js            # Funciones CRUD con Supabase (auth + profiles + expenses)
    ├── supabase.js       # Cliente Supabase inicializado
    ├── style.css         # Sistema de diseño completo (tokens, componentes, responsive)
    └── assets/           # Recursos adicionales
```

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- [pnpm](https://pnpm.io/) (o npm/yarn)
- Una cuenta en [Supabase](https://supabase.com/) (plan gratuito)

### 1. Clonar el repositorio

```bash
git clone https://github.com/EstebanRodriguezGutierrezDEV/VerdeAhorro
cd VerdeAhorro
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Ejecutar en desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`

### 4. Build de producción

```bash
pnpm build
pnpm preview
```

---

## 🎨 Sistema de Diseño

VerdeAhorro utiliza un sistema de diseño propio basado en **tokens CSS** con una paleta **blanca y verde esmeralda**:

| Token | Valor | Uso |
|:---|:---|:---|
| `--primary-emerald` | `#059669` | Color primario, botones, enlaces |
| `--emerald-accent` | `#10B981` | Acentos, gradientes, iconos |
| `--text-dark` | `#0F172A` | Títulos y textos principales |
| `--bg-primary` | `#FFFFFF` | Fondo principal |
| `--bg-secondary` | `#F8FAFC` | Fondo de tarjetas y secciones |

**Efectos visuales incluidos:**
- Glassmorphism (`backdrop-filter: blur`)
- Gradientes emerald en botones y tarjetas
- Focus rings con resplandor verde
- Micro-animaciones en hover y transiciones
- Confetti al completar logros

---

## 📱 Páginas de la Aplicación

### 🏠 Landing Page (`index.html`)

- Hero section con tarjeta visual interactiva
- Simulador de distribución de ingresos (slider)
- Sección de funcionalidades con cards
- Modo Pareja explicativo
- Calculadora de ahorro personalizada
- Sección de privacidad y seguridad
- FAQ con acordeones interactivos
- Modal de registro / inicio de sesión

### 📊 Dashboard (`dashboard.html`)

- Navbar con logo, perfil de usuario, modo pareja y cerrar sesión
- 4 tarjetas resumen: Ingreso, Gastos, Meta, Pareja
- Barra de distribución 50/30/20 visual
- Formulario de registro de gastos con iconos integrados
- Historial de gastos con eliminación
- Panel lateral de modo pareja (código de invitación)
- Reto del Preahorro

---

## 🔒 Privacidad

VerdeAhorro **no accede a tu banco ni a tus tarjetas**. Toda la información es introducida manualmente por el usuario. Los datos se almacenan de forma segura en Supabase con Row Level Security (RLS) activado, de modo que cada usuario solo puede acceder a sus propios datos.

---

## 🗺️ Roadmap

- [x] Landing page con diseño premium
- [x] Sistema de autenticación (registro + login)
- [x] Dashboard con resumen financiero
- [x] Registro y eliminación de gastos
- [x] Regla 50/30/20 con barra visual
- [x] Modo pareja (toggle + gastos compartidos)
- [ ] Gráficos mensuales de evolución de gastos
- [ ] Exportar datos a CSV
- [ ] Notificaciones de exceso de presupuesto
- [ ] PWA (instalable en móvil)
- [ ] Dark mode


<div align="center">

Hecho con 💚 por **Esteban** · [VerdeAhorro](https://github.com/EstebanRodriguezGutierrezDEV/VerdeAhorro)

</div>
