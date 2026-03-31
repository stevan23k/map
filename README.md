# Mapp

Plataforma interactiva de visualización geoespacial y navegación, diseñada como la experiencia de mapas en línea más rápida e intuitiva.

---

## Visión General

**Mapp** es una aplicación web enfocada en la exploración geográfica interactiva. Combina múltiples proveedores de rutas, sistemas reactivos de estado y tolerancia a fallos para garantizar que los usuarios nunca pierdan funcionalidad, incluso cuando APIs externas fallen.

### Objetivos Principales

- Visualización dinámica de eventos en tiempo real
- Navegación precisa mediante geolocalización
- Resiliencia ante fallos de servicios externos
- Experiencia de usuario fluida y moderna

---

## Stack Tecnológico

### Frontend

| Tecnología | Propósito |
|------------|-----------|
| **Next.js 16** | Framework React con Turbopack para desarrollo ultrarrápido |
| **React 19** | Librería UI con Server Components y Actions |
| **Tailwind CSS v4** | Sistema de diseño utilitario con CSS nativo (sin PostCSS) |

### Estado y Datos

| Tecnología | Propósito |
|------------|-----------|
| **Zustand 5** | Gestión de estado global con persistencia en localStorage |
| **Socket.io Client** | Comunicación WebSocket para eventos en tiempo real |

### Geomática

| Tecnología | Propósito |
|------------|-----------|
| **MapLibre GL JS** | Motor de mapas open-source, fork de Mapbox GL JS |

### UI y Componentes

| Tecnología | Propósito |
|------------|-----------|
| **shadcn/ui (Base UI)** | Componentes accesibles basados en Radix UI |
| **Lucide React** | Iconografía consistente |
| **Intro.js** | Sistema de tutoriales interactivos guiados |
| **Glassmorphism** | Estética visual con efectos de translucidez |

---

## Arquitectura

```
app/
├── layout.tsx          # Layout raíz con providers
├── page.tsx            # Página principal del mapa
├── globals.css         # Estilos globales y tema
└── api/                # API Routes de Next.js

components/
├── ui/                 # Componentes base shadcn/ui
├── map/                # Componentes específicos del mapa
│   ├── MapContainer.tsx
│   ├── MapControls.tsx
│   └── EventMarkers.tsx
├── search/
│   └── SearchBar.tsx   # Geocodificación híbrida
├── routing/
│   └── RouteLayer.tsx  # Visualización de rutas
└── realtime/
    └── EventFeed.tsx   # Panel de eventos en tiempo real

context/
├── MapContext.tsx       # Contexto del mapa
└── SocketContext.tsx    # Provider de Socket.io

store/
├── mapStore.ts         # Estado del mapa (centro, zoom, estilo)
├── searchStore.ts      # Estado de búsqueda
├── routeStore.ts       # Estado de rutas activas
└── eventStore.ts       # Eventos y notificaciones

lib/
├── map/                # Utilidades de mapas
│   ├── geocoding.ts    # Photon OSM + fallbacks
│   ├── routing.ts      # OSRM + Mapbox + Haversine offline
│   └── markers.ts      # Gestión de marcadores
├── socket/
│   └── socket.ts       # Configuración de Socket.io
└── utils.ts            # Utilidades generales (cn, formatters)
```

---

## Características Técnicas

### 1. Geocodificación Híbrida Inteligente

Sistema de búsqueda con priorización de resultados según el viewport actual:

```
Photon (OSM) → Mapbox Geocoding → Nominatim (fallback)
```

- Búsqueda que prioriza resultados dentro del área visible del mapa
- Estandarización de direcciones
- Sugerencias en tiempo real

### 2. Sistema de Enrutamiento Resiliente

Triple capa de fallback para garantizar rutas siempre disponibles:

```
OSRM (público) → Mapbox Directions API → Haversine (offline)
```

| Capa | Velocidad | Calidad |离线 |
|------|-----------|---------|-----|
| OSRM | Rápida | Excelente | No |
| Mapbox | Media | Alta | No |
| Haversine | Instantánea | Básica (línea recta) | Sí |

### 3. Eventos en Tiempo Real

Comunicación bidireccional mediante Socket.io:

- Eventos creados por la comunidad en tiempo real
- Reconexión automática con indicador visual de estado
- Reconexión manual clickeando el indicador "Desconectado"

### 4. Tema Oscuro Persistente

Implementación nativa del tema oscuro:

- Detección automática basada en `prefers-color-scheme`
- Transición suave entre temas
- Aplicación a todos los elementos: mapa, popups, controles, UI

### 5. Tutorial Interactivo (Intro.js)

Sistema de autoguía paso a paso:

- Detección de primera visita
- Tutoriales por secciones del mapa
- Progreso guardado en localStorage

---

## Variables de Entorno

```env
# Proveedor principal de mapas (estilos)
NEXT_PUBLIC_MAPLIBRE_STYLE=https://tiles.example.com/style.json

# Fallback de enrutamiento (obligatorio)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

# Tiempo real
NEXT_PUBLIC_SOCKET_URL=wss://tu-servidor.com

# API backend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Desarrollo

### Requisitos

- Node.js 20+ o Bun
- npm / yarn / pnpm / bun

### Instalación

```bash
npm install
```

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con Turbopack |
| `npm run build` | Genera build de producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta ESLint |

### Despliegue Local

```bash
npm run dev
# Abre http://localhost:3000
```

---

## Licencia

MIT
