import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cloud, Wand2, Shield, Cpu, RefreshCw, BarChart2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-grid-pattern">
      {/* Background radial glow */}
      <div className="absolute left-1/2 top-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent-purple/10 blur-[120px]"></div>
      
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 px-4 py-1.5 text-xs font-semibold text-accent-cyan shadow-[0_0_15px_rgba(0,240,255,0.05)]">
            <Cpu className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            Next-Gen Remote Sensing & GenAI
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            <span className="block mb-2">Reclaim Satellite Imagery from</span>
            <span className="bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink bg-clip-text text-transparent text-glow-cyan">
              Atmospheric Obstruction
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            CloudClear AI leverages PyTorch U-Net segmentation models and generative diffusion inpainting networks to seamlessly strip clouds from satellite tiles and reconstruct the hidden terrain underneath.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              to="/dashboard"
              className="relative group rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple p-[1px] shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_35px_rgba(0,240,255,0.4)] transition-all"
            >
              <div className="rounded-[11px] bg-dark-900 px-6 py-3 font-semibold text-white group-hover:bg-transparent transition-colors flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Launch AI Console
              </div>
            </Link>
            <Link
              to="/about"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Learn the Science
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Advanced System Features</h2>
          <p className="mt-2 text-slate-400">Robust tools engineered for high-resolution cloud removal pipelines.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Feature 1 */}
          <motion.div variants={itemVariants} className="glass-panel glass-card-glow rounded-2xl p-6 relative overflow-hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
              <Cloud className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Automated Segmentation</h3>
            <p className="text-slate-400 text-sm">
              Our U-Net deep learning architecture detects clouds with pixel-level precision, generating accurate region masks instantly.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVariants} className="glass-panel glass-card-glow rounded-2xl p-6 relative overflow-hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-purple/10 text-accent-purple">
              <Wand2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Generative Inpainting</h3>
            <p className="text-slate-400 text-sm">
              Stable Diffusion Inpainting fills hidden patches, matching the surrounding landscape, water bodies, or urban layouts.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVariants} className="glass-panel glass-card-glow rounded-2xl p-6 relative overflow-hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-pink/10 text-accent-pink">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">High Fidelity Merging</h3>
            <p className="text-slate-400 text-sm">
              Integrate reconstructed regions with unaffected terrain using bilateral filters, preserving 100% of non-cloudy pixels.
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div variants={itemVariants} className="glass-panel glass-card-glow rounded-2xl p-6 relative overflow-hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Real-time Processing</h3>
            <p className="text-slate-400 text-sm">
              Dynamic feedback loops monitor segmentation stages, showing progress bars and detailed metrics instantly.
            </p>
          </motion.div>

          {/* Feature 5 */}
          <motion.div variants={itemVariants} className="glass-panel glass-card-glow rounded-2xl p-6 relative overflow-hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-purple/10 text-accent-purple">
              <BarChart2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics Console</h3>
            <p className="text-slate-400 text-sm">
              Displays statistics including cloud coverage percentage, resolution, processing latency, and visual before/after sliders.
            </p>
          </motion.div>

          {/* Feature 6 */}
          <motion.div variants={itemVariants} className="glass-panel glass-card-glow rounded-2xl p-6 relative overflow-hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-pink/10 text-accent-pink">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hybrid AI Backends</h3>
            <p className="text-slate-400 text-sm">
              Supports full PyTorch/GPU execution for production, and high-performance CV algorithms for fast fallback environments.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Pipeline Diagram Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white font-sans">The CloudClear Pipeline</h2>
          <p className="mt-2 text-slate-400">Step-by-step imagery recovery workflow</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white mb-2">1</div>
            <span className="font-semibold text-white">Satellite Input</span>
            <span className="text-xs text-slate-400">Cloudy Multi-Spectral</span>
          </div>

          <div className="hidden md:block text-slate-500">▶</div>

          <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center font-bold text-accent-cyan mb-2">2</div>
            <span className="font-semibold text-white">U-Net Segmentation</span>
            <span className="text-xs text-slate-400">Locating cloud areas</span>
          </div>

          <div className="hidden md:block text-slate-500">▶</div>

          <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center font-bold text-accent-purple mb-2">3</div>
            <span className="font-semibold text-white">Generative Inpainting</span>
            <span className="text-xs text-slate-400">Reconstructing ground</span>
          </div>

          <div className="hidden md:block text-slate-500">▶</div>

          <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-accent-pink/10 border border-accent-pink/30 flex items-center justify-center font-bold text-accent-pink mb-2">4</div>
            <span className="font-semibold text-white">Seamless Blend</span>
            <span className="text-xs text-slate-400">Final recovered image</span>
          </div>
        </div>
      </section>
    </div>
  );
};
