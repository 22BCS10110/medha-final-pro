import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Smartphone, Activity, ShieldCheck, HeartPulse } from 'lucide-react';

const Hero = ({ onOpenMobilePreview }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55, 0.85], [1, 1, 0]);
  const statsOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7], [1, 0.6, 0]);

  // Single rAF loop reads the latest scroll progress and writes video.currentTime.
  // No spring / no lerp — they only add latency. Final smoothness depends on the
  // video being encoded with frequent keyframes (see ffmpeg note in chat).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId = 0;
    let lastWritten = -1;

    const loop = () => {
      const d = video.duration;
      if (d && !isNaN(d)) {
        const p = scrollYProgress.get();
        const t = Math.max(0, Math.min(d - 0.001, p * d));
        if (Math.abs(t - lastWritten) > 1 / 60) {
          try {
            video.currentTime = t;
            lastWritten = t;
          } catch (_) {}
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [scrollYProgress, ready]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[200vh] md:h-[260vh]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-slate-950">
        <video
          ref={videoRef}
          src="/videos/hero.mp4"
          poster="/favicon.png"
          muted
          playsInline
          preload="auto"
          autoPlay={false}
          onLoadedData={() => setReady(true)}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Dark scrim for text legibility — keeps video vivid but text crisp */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/55 to-slate-950/40 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.55)_0%,transparent_70%)] pointer-events-none" />
        {/* Subtle brand tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/15 mix-blend-overlay pointer-events-none" />
        {/* Blurred bottom seam — masks the hard video cutoff into the next section */}
        <div
          className="absolute inset-x-0 bottom-0 h-56 backdrop-blur-md pointer-events-none"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 35%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 35%, transparent 100%)',
          }}
        />
        {/* Color fade into the next section's slate-50 background */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none" />

        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 mb-5 sm:mb-8 shadow-lg"
          >
            <Sparkles className="text-cyan-300" size={12} />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/90">
              Empowering the Future of Care
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white leading-[0.95] mb-5 sm:mb-8 max-w-5xl tracking-tight"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)' }}
          >
            Intelligence that <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-400 to-teal-300 bg-[length:200%_auto] animate-shimmer italic drop-shadow-[0_2px_20px_rgba(34,211,238,0.45)]">
              Travels With You.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base md:text-xl text-white/90 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed font-medium px-2"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
          >
            Medha harmonizes clinical expertise with advanced AI to deliver
            high-fidelity health insights. Built for hospitals that prioritize
            outcome over output.
          </motion.p>

          <motion.div
            style={{ opacity: textOpacity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-px h-8 bg-white/60"
            />
          </motion.div>
        </motion.div>

        <motion.div
          style={{ opacity: statsOpacity }}
          className="absolute bottom-0 inset-x-0 z-10 px-6 pb-8 pointer-events-none"
        >
          <div className="max-w-5xl mx-auto grid grid-cols-4 sm:flex sm:flex-wrap sm:justify-center gap-3 sm:gap-8 md:gap-16 py-4 sm:py-6 px-3 sm:px-0 border-t border-white/15 bg-slate-950/40 backdrop-blur-md rounded-t-2xl">
            {[
              { label: 'Clinics Partnered', value: '250+', icon: Activity },
              { label: 'Uptime', value: '99.9%', icon: ShieldCheck },
              { label: 'Insights', value: '1M+', icon: Sparkles },
              { label: 'Care Speed', value: '+40%', icon: HeartPulse },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 sm:gap-1">
                <span className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-white">
                  {stat.value}
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black text-white/70 text-center leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
