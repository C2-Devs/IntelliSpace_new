import React from 'react';
import { navigateTo } from '../../utils/navigation.js';

export default function HeroOverlay() {
  return (
    <div className="overlay-inner hero-inner">
      <div className="max-w-hero">
        <div className="eyebrow">INTELLIGENT 3D INTERIOR DESIGN</div>
        <h1 className="headline-xl">
          Your Space.
          <br />
          Reimagined.
        </h1>
        <p className="body-text max-w-md">
          Design your space in 3D, customize every detail, and discover intelligent
          recommendations built around your room, style and budget.
        </p>
        <div className="cta-row">
          <button onClick={() => navigateTo('/register')} className="btn-primary">
            Enter IntelliSpace
          </button>
          <button className="btn-link">Explore the workspace</button>
        </div>
      </div>
      <div className="scroll-hint">Scroll</div>
    </div>
  );
}
