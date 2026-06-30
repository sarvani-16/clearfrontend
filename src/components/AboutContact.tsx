import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Send, Mail, Building, Globe, CheckCircle2 } from 'lucide-react';

export const AboutContact: React.FC<{ defaultTab?: 'about' | 'contact' }> = ({ 
  defaultTab = 'about' 
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'contact'>(defaultTab);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-grid-pattern px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial glow */}
      <div className="absolute right-10 top-10 -z-10 h-[300px] w-[300px] rounded-full bg-accent-cyan/5 blur-[80px]"></div>
      <div className="absolute left-10 bottom-10 -z-10 h-[300px] w-[300px] rounded-full bg-accent-purple/5 blur-[80px]"></div>

      <div className="mx-auto max-w-4xl">
        {/* Tab Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-xl bg-dark-800 p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('about')}
              className={`rounded-lg px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === 'about'
                  ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              About the Project
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`rounded-lg px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === 'contact'
                  ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Get In Touch
            </button>
          </div>
        </div>

        {/* Tab 1: About the Project */}
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            {/* Scientific context */}
            <div className="glass-panel rounded-2xl p-8 space-y-6">
              <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                Overview & Science
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Earth observation data is heavily limited by atmospheric conditions. Clouds cover approximately <strong>55-67%</strong> of the planet's surface at any given moment, posing a massive obstacle for environmental monitoring, agriculture tracking, disaster management, and security mapping.
              </p>
              <p className="text-slate-300 leading-relaxed">
                <strong>CloudClear AI</strong> was designed to overcome this visual limitation. By employing a multi-stage computer vision and deep learning pipeline, we automate the discovery of obscured regions and synthesize underlying landforms based on historical ground patterns and geographic context.
              </p>
            </div>

            {/* Neural architecture cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass-panel rounded-2xl p-6 border-l-4 border-accent-cyan">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
                  <Cpu className="h-5 w-5 text-accent-cyan" />
                  U-Net Cloud Segmentation
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  A convolutional neural network (CNN) structure optimized for pixel-level semantic classification. U-Net's contractive path extracts high-level spectral context while its symmetric expanding path recovers spatial layout, creating sharp, exact cloud boundaries.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-6 border-l-4 border-accent-purple">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
                  <Cpu className="h-5 w-5 text-accent-purple" />
                  Stable Diffusion Inpainting
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  A latent text-to-image diffusion model. Given the original image, a precise cloud mask, and structural prompts, the model initializes noise in the masked zone and iteratively denoises the latent vectors, synthesizing land features that match the surroundings.
                </p>
              </div>
            </div>

            {/* Tech details */}
            <div className="glass-panel rounded-2xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-white">System Technologies</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-dark-800 p-4 text-center border border-white/5">
                  <span className="block text-lg font-bold text-accent-cyan">React + TS</span>
                  <span className="text-xs text-slate-400">Frontend UI</span>
                </div>
                <div className="rounded-xl bg-dark-800 p-4 text-center border border-white/5">
                  <span className="block text-lg font-bold text-accent-purple">FastAPI</span>
                  <span className="text-xs text-slate-400">Backend Routing</span>
                </div>
                <div className="rounded-xl bg-dark-800 p-4 text-center border border-white/5">
                  <span className="block text-lg font-bold text-accent-pink">PyTorch + CV2</span>
                  <span className="text-xs text-slate-400">Inference Core</span>
                </div>
                <div className="rounded-xl bg-dark-800 p-4 text-center border border-white/5">
                  <span className="block text-lg font-bold text-accent-cyan">Postgres</span>
                  <span className="text-xs text-slate-400">Historical DB</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Contact Form */}
        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-8 md:grid-cols-12"
          >
            {/* Info */}
            <div className="glass-panel rounded-2xl p-6 space-y-6 md:col-span-5 h-fit">
              <h3 className="text-xl font-bold text-white">Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-accent-cyan mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Office Location</h4>
                    <p className="text-xs text-slate-400">GenAI & Earth Research Lab</p>
                    <p className="text-xs text-slate-400">Techno Park Campus, Bangalore, India</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-accent-purple mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Email Address</h4>
                    <p className="text-xs text-slate-400">research@cloudclear.ai</p>
                    <p className="text-xs text-slate-400">support@cloudclear.ai</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-accent-pink mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Github Org</h4>
                    <p className="text-xs text-slate-400">github.com/cloudclear-ai</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="glass-panel rounded-2xl p-8 md:col-span-7 relative">
              <h3 className="text-2xl font-bold text-white mb-6">Send Message</h3>

              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center space-y-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Message Transmitted!</h4>
                  <p className="text-sm text-slate-400 max-w-xs">
                    Your message has been processed successfully. Our science officers will respond shortly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-white/10 bg-dark-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-cyan focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="jane@example.com"
                      className="w-full rounded-xl border border-white/10 bg-dark-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-cyan focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Model deployment queries"
                      className="w-full rounded-xl border border-white/10 bg-dark-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-cyan focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Message Body
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      placeholder="Hi, I would like to integrate your model..."
                      className="w-full rounded-xl border border-white/10 bg-dark-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-cyan focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple py-3 font-semibold text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all"
                  >
                    <Send className="h-4 w-4" />
                    Transmit Signal
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
