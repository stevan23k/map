# Mapp 🌍

Bienvenido a **Mapp**, una plataforma interactiva orientada a la experiencia de usuario y visualización geomática, construida para ser la experiencia de navegación en línea más rápida e intuitiva posible. Este documento inicial te ayudará a conocer Mapp, a entender bajo qué tecnologías está fundamentado y a cómo desplegar la aplicación en tu entorno local.

---

## 🚀 Sobre el Proyecto (Explicación)

**Mapp** es una web focalizada en la exploración geográfica interactiva. Fue diseñada con la premisa de ser resistente a las fallas comunes de la web, combinando múltiples proveedores de rutas y sistemas reactivos de estado, para asegurar que los usuarios nunca pierdan funcionalidad (incluso cuando alguna API externa falleciendo). Su objetivo central es la visualización dinámica de eventos en vivo y la navegación precisa mediante geolocalización.

---

## ✨ Características Principales Construidas (Referencia)

El proyecto incluye las siguientes funcionalidades ya operativas:

1. **Geocodificación Híbrida Inteligente:** Un motor de búsqueda global que prioriza resultados en función de tu campo de visión actual en el mapa. Emplea _Photon (OSM)_ como mecanismo principal con caídas a otras APIs, garantizando direcciones exactas y estandarizando acercamientos precisos.
2. **Sistema de Enrutamiento Inquebrantable:** Múltiples generadores de ruta para auto, bicicletas o a pie. Mapp consulta primero la API pública de **OSRM**, hace un _graceful fallback_ a la **API de Mapbox** si el servidor principal no responde a tiempo, e incluso contiene su propia ruta generada matemáticamente offline usando algoritmos *haversine* de distancia si no hay conexión en absoluto.
3. **Eventos en Tiempo Real (WebSockets):** Soporte reactivo en tiempo real con _Socket.io_. Recibe, actualiza y visualiza datos de eventos creados por la comunidad instantáneamente en el mapa usando marcadores rápidos. La aplicación posee indicadores de ping de conexión para resucitar el protocolo manualmente dando clic en "Desconectado" siempre que la infraestructura falle.
4. **Modo Oscuro Integrado y Persistente:** Modificación profunda de todo el componente gráfico. Mapp implementa una transición armónica de UI a Modo Oscuro basada puramente en el Sistema Operativo, incluyendo las paletas personalizadas, los popups invasivos y las firmas de copyright del mapa. Elementos visuales usando texturas *glassmorfismo* e Indigo moderno.
5. **Autoguía y Recorridos (Intro.js):** Tutorial paso a paso automatizado e interactivo para sumergir a los nuevos usuarios sin fricción sobre las utilidades del mapa.

---

## 🛠 Stack Tecnológico

Tecnologías activas en el código de producción de este repositorio:

*   **Framework Base:** [Next.js 16](https://nextjs.org/) (incluyendo Turbopack).
*   **Gestor de Estados:** [Zustand](https://zustand-demo.pmnd.rs/) (Persistencia modular por caché y localStorage).
*   **UI y Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) + Integración Lucide Icons.
*   **Geomática y Mapas:** [MapLibre GL JS](https://maplibre.org/) (Motor agnóstico y ultrarrápido).
*   **Tiempo Real:** [Socket.io Client](https://socket.io/) para WebSockets persistentes de la UI.

---

## 🏁 Cómo Iniciar en Desarrollo (How-to)

Esta sección te guía paso a paso para ejecutar **Mapp** localmente durante tu evaluación periodica.

### Requisitos Previos
Debes contar con `Node.js` (u otro manejador de runtime como Bun) que soporte NextJS contemporáneo instalado localmente. 

### Instalación en Local

1. Clona este repositorio o descarga la arquitectura de desarrollo local.
2. Abre la terminal en el directorio raíz del proyecto geospacial y ejecuta:

```bash
npm install
# O si prefieres usar otro gestor: bun install / yarn install
```

3. **Inyecta las Variables de Entorno (`.env`)**:
Crea un archivo llamado `.env` o `.env.local` en tu raíz y asegúrate de proveer las integraciones mínimas para funcionar en plenitud:

```env
# Tokens de mapas (Para fallbacks obligatorios de ruteo)
NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_aqui

# Integración Server 
NEXT_PUBLIC_SOCKET_URL=url_de_tu_servidor_websocket
NEXT_PUBLIC_API_URL=http://localhost:4000
```

4. Dispara el entorno de desarrollo:

```bash
npm run dev
# o
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador preferido. ¡Con ello, el mapa de Barranquilla (y del resto del mundo) estará cargado y vivo en tu pantalla!
