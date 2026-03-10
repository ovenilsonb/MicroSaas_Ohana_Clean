import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
}

export const ParticleNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const init = () => {
      resize();
      createParticles();
      animate();
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        createParticles(); // Recreate on resize for better distribution
      }
    };

    const createParticles = () => {
      particles = [];
      const numParticles = Math.min((canvas.width * canvas.height) / 10000, 100); // Responsive particle count
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 200 + 100, // Z-depth for 3D effect
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          vz: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
        });
      }
    };

    const drawLine = (p1: Particle, p2: Particle, distance: number) => {
      const maxDistance = 150;
      if (distance < maxDistance) {
        const opacity = (1 - distance / maxDistance) * (p1.z + p2.z) / 400; // Opacity depends on distance and z-depth
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`; // Tailwind blue-500
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Move
        p1.x += p1.vx;
        p1.y += p1.vy;
        p1.z += p1.vz;

        // Bounce off walls
        if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;
        if (p1.z < 100 || p1.z > 300) p1.vz *= -1;

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          drawLine(p1, p2, distance);
        }

        // Draw particle
        const scale = 300 / (300 + (p1.z - 200)); // Perspective scale
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 165, 250, ${p1.z / 300})`; // Tailwind blue-400, opacity by depth
        ctx.fill();
        
        // Optional: Add a subtle glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    init();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
};
