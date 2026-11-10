'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

// ─── Types ───
interface Particle { x: number; y: number; vx: number; vy: number; size: number; alpha: number; }
interface NetworkNode { x: number; y: number; angle: number; radius: number; speed: number; }
interface CodeFragment { text: string; x: number; y: number; alpha: number; floatOffset: number; floatSpeed: number; }
interface Sparkle { x: number; y: number; size: number; alpha: number; twinkleSpeed: number; phase: number; }

const CODE_TEXTS = ['<div>', 'function()', 'AI', 'Web', 'Build', 'const', 'async', '{...}', 'React', 'Next.js', 'Human', '</>', 'npm'];

export function AuthScene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const [isDark, setIsDark] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const particlesRef = useRef<Particle[]>([]);
  const nodesRef = useRef<NetworkNode[]>([]);
  const codeRef = useRef<CodeFragment[]>([]);
  const sparklesRef = useRef<Sparkle[]>([]);
  const timeRef = useRef(0);

  const initElements = useCallback((w: number, h: number, isMobile: boolean) => {
    const pCount = isMobile ? 30 : 60, nCount = isMobile ? 10 : 20, sCount = isMobile ? 40 : 120;
    const cx = w / 2, cy = h / 2;

    particlesRef.current = Array.from({ length: pCount }, () => {
      const angle = Math.random() * Math.PI * 2, dist = 200 + Math.random() * 300;
      return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, vx: 0, vy: 0, size: 1 + Math.random() * 2, alpha: 0.3 + Math.random() * 0.4 };
    });

    nodesRef.current = Array.from({ length: nCount }, () => ({
      x: 0, y: 0, angle: Math.random() * Math.PI * 2, radius: 100 + Math.random() * 120, speed: 0.0003 + Math.random() * 0.0008
    }));

    codeRef.current = CODE_TEXTS.map(text => ({
      text, x: Math.random() * w, y: Math.random() * h, alpha: 0.04 + Math.random() * 0.06, floatOffset: Math.random() * Math.PI * 2, floatSpeed: 0.5 + Math.random() * 0.5
    }));

    sparklesRef.current = Array.from({ length: sCount }, () => ({
      x: Math.random() * w, y: Math.random() * h, size: 0.5 + Math.random() * 1.5, alpha: 0.1 + Math.random() * 0.2, twinkleSpeed: 0.02 + Math.random() * 0.03, phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const mqHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', mqHandler);
    return () => { obs.disconnect(); mq.removeEventListener('change', mqHandler); };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      initElements(w, h, w < 768);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX / w;
      mouseRef.current.targetY = e.clientY / h;
    };
    window.addEventListener('mousemove', onMouseMove);

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const mx = mouseRef.current, dark = isDark;
      mx.x += (mx.targetX - mx.x) * 0.04;
      mx.y += (mx.targetY - mx.y) * 0.04;
      const parallaxX = (mx.x - 0.5) * 30, parallaxY = (mx.y - 0.5) * 20;
      const cx = w / 2 + parallaxX, cy = h / 2 + parallaxY;

      ctx.clearRect(0, 0, w, h);

      // Orb gradient
      const orbRadius = 80 + Math.sin(t * 0.5) * 8;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbRadius);
      grad.addColorStop(0, dark ? 'rgba(106, 140, 255, 0.6)' : 'rgba(129, 140, 248, 0.5)');
      grad.addColorStop(0.5, dark ? 'rgba(74, 108, 247, 0.3)' : 'rgba(99, 102, 241, 0.25)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2); ctx.fill();

      // Orb ring
      ctx.strokeStyle = dark ? 'rgba(106, 140, 255, 0.15)' : 'rgba(129, 140, 248, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, orbRadius + 10 + Math.sin(t * 0.3) * 5, 0, Math.PI * 2); ctx.stroke();

      // Network nodes
      const nodes = nodesRef.current;
      nodes.forEach((n, i) => {
        n.angle += n.speed;
        n.x = cx + Math.cos(n.angle) * n.radius;
        n.y = cy + Math.sin(n.angle) * n.radius + Math.sin(t * 0.3 + i) * 8;
      });
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,46,0.6)';
      nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, Math.PI * 2); ctx.fill(); });

      // Node connections
      ctx.strokeStyle = dark ? 'rgba(106, 140, 255, 0.08)' : 'rgba(129, 140, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < 25000) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      }

      // Particles streaming to center
      const particles = particlesRef.current;
      ctx.fillStyle = dark ? 'rgba(106, 140, 255, 0.6)' : 'rgba(129, 140, 248, 0.5)';
      particles.forEach(p => {
        const dx = cx - p.x, dy = cy - p.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        p.vx = (dx / dist) * 0.8; p.vy = (dy / dist) * 0.8;
        p.x += p.vx; p.y += p.vy;
        if (dist < orbRadius - 10) {
          const angle = Math.random() * Math.PI * 2, d = 200 + Math.random() * 300;
          p.x = cx + Math.cos(angle) * d; p.y = cy + Math.sin(angle) * d;
        }
        ctx.globalAlpha = p.alpha; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Code fragments
      ctx.font = '12px monospace';
      codeRef.current.forEach(c => {
        const yOff = Math.sin(t * c.floatSpeed + c.floatOffset) * 10;
        ctx.fillStyle = dark ? `rgba(255,255,255,${c.alpha})` : `rgba(15,23,42,${c.alpha})`;
        ctx.fillText(c.text, c.x + parallaxX * 0.3, c.y + yOff + parallaxY * 0.3);
      });

      // Sparkles
      sparklesRef.current.forEach(s => {
        const twinkle = 0.5 + Math.sin(t * s.twinkleSpeed * 60 + s.phase) * 0.5;
        ctx.fillStyle = dark ? `rgba(255,255,255,${s.alpha * twinkle})` : `rgba(100,116,139,${s.alpha * twinkle})`;
        ctx.beginPath(); ctx.arc(s.x + parallaxX * 0.1, s.y + parallaxY * 0.1, s.size, 0, Math.PI * 2); ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [reducedMotion, isDark, initElements]);

  if (reducedMotion) {
    return <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />;
  }

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

