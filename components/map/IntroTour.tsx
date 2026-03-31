"use client";

import introJs from "intro.js";
import { useEffect } from "react";

export function startTour() {
  const tour = introJs();
  tour.setOptions({
    steps: [
      {
        intro: "¡Bienvenido a MapApp! 👋<br/><br/>Esta guía te ayudará a conocer las funciones principales de la aplicación.",
      },
      {
        element: '[data-step="1"]',
        intro: "Busca cualquier dirección o lugar en Barranquilla para centrar el mapa.",
        position: 'bottom'
      },
      {
        element: '[data-step="2"]',
        intro: "Este es el mapa interactivo. Puedes ver eventos activos y a otros usuarios en tiempo real.",
        position: 'right'
      },
      {
        element: '[data-step="3"]',
        intro: "Usa este botón para crear tu propio evento. También puedes hacer <b>clic derecho</b> sobre el mapa.",
        position: 'left'
      },
      {
        element: '[data-step="4"]',
        intro: "Aquí puedes ver si estás conectado al servidor de eventos en tiempo real.",
        position: 'bottom'
      },
      {
        element: '[data-step="5"]',
        intro: "En tu perfil puedes ver los eventos que has creado y personalizar tu cuenta.",
        position: 'bottom'
      },
      {
        element: '[data-step="6"]',
        intro: "Si alguna vez te pierdes, siempre puedes volver a iniciar esta guía aquí.",
        position: 'bottom'
      },
      {
        element: '.maplibregl-ctrl-geolocate',
        intro: "Haz clic en este botón para centrar el mapa en tu ubicación actual.",
        position: 'left'
      }
    ],
    nextLabel: "Siguiente",
    prevLabel: "Anterior",
    doneLabel: "Finalizar",
    dontShowAgain: true,
    showProgress: true,
    showBullets: true,
    exitOnOverlayClick: true,
    scrollToElement: true,
    overlayOpacity: 0.8,
  });

  tour.start();
}

export default function IntroTour() {
  // This component doesn't render anything, it just provides the logic
  // and could potentially auto-start for new users in the future.
  useEffect(() => {
    // Check localStorage to auto-start once
    const hasSeenTour = localStorage.getItem("has-seen-tour");
    if (!hasSeenTour) {
      // Small delay to ensure map and other components are fully rendered
      const timer = setTimeout(() => {
        startTour();
        localStorage.setItem("has-seen-tour", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
