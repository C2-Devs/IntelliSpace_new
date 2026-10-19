import React from 'react';
import { navigateTo } from '../../utils/navigation.js';

export default function CTAOverlay() {
  return (
    <div className="overlay-inner center-col">
      <div className="eyebrow">ENTER INTELLISPACE</div>
      <h2 className="headline-lg cta-headline">Your room is waiting.</h2>
      <button onClick={() => navigateTo('/register')} className="btn-primary">
        Enter IntelliSpace
      </button>
    </div>
  );
}
