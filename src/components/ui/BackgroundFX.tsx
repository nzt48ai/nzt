import { useEffect, useRef } from 'react';

// Faint candlestick chart pattern as SVG
function ChartPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.03 }}
    >
      {/* Candlesticks scattered across */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = 40 + i * 58;
        const bodyTop = 120 + Math.sin(i * 0.8) * 60 + Math.cos(i * 1.3) * 30;
        const bodyH = 20 + Math.abs(Math.sin(i * 1.5)) * 35;
        const wickTop = bodyTop - 8 - Math.random() * 15;
        const wickBot = bodyTop + bodyH + 8 + Math.random() * 15;
        const bull = Math.sin(i * 2.1) > -0.2;
        return (
          <g key={i}>
            <line
              x1={x + 4}
              y1={wickTop}
              x2={x + 4}
              y2={wickBot}
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x={x}
              y={bodyTop}
              width={8}
              height={bodyH}
              fill={bull ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              rx="1"
            />
          </g>
        );
      })}
      {/* Faint moving average line */}
      <path
        d={`M 20 ${180} Q 200 ${130}, 400 ${160} T 800 ${140} T 1200 ${170}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
    </svg>
  );
}

// Soft animated glow fields
function GlowFields() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: '400px',
          height: '400px',
          top: '5%',
          left: '10%',
          background: 'hsl(var(--glow-primary) / 0.06)',
          animation: 'glowDrift1 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full blur-[100px]"
        style={{
          width: '350px',
          height: '350px',
          bottom: '15%',
          right: '5%',
          background: 'hsl(var(--glow-accent) / 0.05)',
          animation: 'glowDrift2 25s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full blur-[90px]"
        style={{
          width: '280px',
          height: '280px',
          top: '50%',
          left: '60%',
          background: 'hsl(var(--glow-pink) / 0.04)',
          animation: 'glowDrift3 22s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// Subtle floating particles via canvas
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;

    const particles: { x: number; y: number; r: number; vx: number; vy: number; o: number }[] = [];
    const COUNT = 35;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    const init = () => {
      resize();
      particles.length = 0;
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * cw,
          y: Math.random() * ch,
          r: 1 + Math.random() * 1.5,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.12,
          o: 0.08 + Math.random() * 0.12,
        });
      }
    };

    const draw = () => {
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      ctx.clearRect(0, 0, cw, ch);

      // Detect theme
      const isDark = document.documentElement.classList.contains('dark');
      const color = isDark ? '255,255,255' : '0,0,0';

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = cw + 10;
        if (p.x > cw + 10) p.x = -10;
        if (p.y < -10) p.y = ch + 10;
        if (p.y > ch + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.o})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    init();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
}

export default function BackgroundFX() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <ChartPattern />
      <GlowFields />
    </div>
  );
}
