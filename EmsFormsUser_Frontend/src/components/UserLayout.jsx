import React, { useState, useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import Sidebar from './Sidebar';
import NavBar from './NavBar';

export default function UserLayout({ children, showSidebar = true }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    background: {
      color: { value: '#000000' },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: { enable: true, mode: 'push' },
        onHover: { enable: true, mode: 'repulse' },
        resize: true,
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 200, duration: 0.4 },
      },
    },
    particles: {
      color: { value: '#38bdf8' },
      links: { color: '#0284c7', distance: 150, enable: true, opacity: 0.25, width: 1 },
      move: { direction: 'none', enable: true, outModes: { default: 'bounce' }, speed: 1 },
      number: { density: { enable: true, area: 800 }, value: 70 },
      opacity: { value: 0.4 },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col lg:flex-row relative overflow-x-hidden">
      <Particles
        id="tsparticles-layout"
        init={particlesInit}
        options={particlesOptions}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Desktop Fixed Left Sidebar */}
      {showSidebar && (
        <aside className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 w-64 border-r border-slate-800/80 bg-black/95 backdrop-blur-md">
          <Sidebar />
        </aside>
      )}

      {/* Mobile Slide-Over Sidebar Drawer */}
      {showSidebar && mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-black shadow-2xl">
            <Sidebar mobile onClose={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 w-full min-h-screen z-10 ${showSidebar ? 'lg:pl-64' : ''}`}>
        <NavBar
          showSidebarToggle={showSidebar}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          mobileMenuOpen={mobileMenuOpen}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
