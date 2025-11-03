import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Shield, Zap, TrendingUp, Box, Users, 
  Activity, ShieldCheck, Layers, Sparkles
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useEffect, useMemo, useState } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isFeaturesSectionVisible, setIsFeaturesSectionVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer to pause animations when not visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === 'features') {
            setIsFeaturesSectionVisible(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.1 }
    );

    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      observer.observe(featuresSection);
    }

    return () => {
      if (featuresSection) {
        observer.unobserve(featuresSection);
      }
    };
  }, []);

  useEffect(() => {
    // Script is already loaded in HTML, just initialize
    const initUnicorn = () => {
      const UnicornStudio = (window as any).UnicornStudio;
      if (UnicornStudio) {
        try {
          UnicornStudio.init();
        } catch (error) {
          console.error('Error initializing UnicornStudio:', error);
        }
      }
    };

    // Check if already loaded
    if ((window as any).UnicornStudio) {
      initUnicorn();
    } else {
      // Wait for script to load (it's in HTML head)
      const checkLoaded = setInterval(() => {
        if ((window as any).UnicornStudio) {
          clearInterval(checkLoaded);
          initUnicorn();
        }
      }, 50);
      
      return () => clearInterval(checkLoaded);
    }
  }, []);

  const stats = useMemo(() => [
    { label: 'Total Value Locked', value: '$76M', change: '+12.5%', icon: TrendingUp },
    { label: 'Active Vaults', value: '600+', change: '+23.1%', icon: Box },
    { label: 'Total Users', value: '80K', change: '+8.3%', icon: Users },
    { label: 'Avg APY', value: '15.2%', change: '+2.1%', icon: Zap },
  ], []);

  const platformFeatures = useMemo(() => [
    { icon: Activity, tag: 'Monitoring', title: 'Live tracking', color: 'text-primary-500' },
    { icon: ShieldCheck, tag: 'Security', title: 'Audited contracts', color: 'text-primary-500' },
    { icon: Layers, tag: 'Strategy', title: 'Multi-protocol', color: 'text-primary-500' },
    { icon: Sparkles, tag: 'AI', title: 'Smart optimization', color: 'text-primary-500' },
  ], []);

  const featureImageMap: Record<string, string> = useMemo(() => ({
    'Live tracking': '/live-tracking.png',
    'Audited contracts': '/audited-contracts.png',
    'Multi-protocol': '/multi-protocol.png',
    'Smart optimization': '/smart-optimization.png',
  }), []);

  const trustedBy = useMemo(() => [
    'Soroban Labs', 'Stellar Foundation', 'DeFi Alliance', 
    'Meridian Protocol', 'Anchor Platform', 'YieldSpace'
  ], []);

  const testimonials = useMemo(() => [
    {
      name: 'Alex Kim',
      handle: '@alexk_defi',
      initial: 'AK',
      color: 'from-[#dce85d] to-[#a8c93a]',
      text: 'Syft made vault creation incredibly simple. Deployed my first strategy in under 10 minutes with zero coding.',
    },
    {
      name: 'Sarah Martinez',
      handle: '@sarahm_yields',
      initial: 'SM',
      color: 'from-[#74b97f] to-[#5a9268]',
      text: 'The AI optimization suggestions have increased my vault\'s APY by 3%. Absolutely game-changing platform.',
    },
    {
      name: 'James Park',
      handle: '@jpark_stellar',
      initial: 'JP',
      color: 'from-[#a8c93a] to-[#8ba631]',
      text: 'Security audits and non-custodial design give me complete peace of mind. This is how DeFi should work.',
    },
    {
      name: 'Lisa Chen',
      handle: '@lisac_crypto',
      initial: 'LC',
      color: 'from-[#dce85d] to-[#c8d750]',
      text: 'Managing multiple vaults has never been easier. The dashboard is clean and the analytics are powerful.',
    },
    {
      name: 'Marcus Rivera',
      handle: '@mrivera_dev',
      initial: 'MR',
      color: 'from-[#a8c93a] to-[#8ba631]',
      text: 'The visual builder is intuitive and powerful. Created complex strategies without touching a single line of code.',
    },
    {
      name: 'Emma Nguyen',
      handle: '@emman_blockchain',
      initial: 'EN',
      color: 'from-[#74b97f] to-[#5a9268]',
      text: 'Real-time monitoring and automated rebalancing keep my vaults optimized. Best Stellar DeFi tool I\'ve used.',
    },
  ], []);

  const steps = useMemo(() => [
    {
      step: '01',
      title: 'Connect Wallet',
      description: 'Connect your Freighter or Albedo wallet in seconds',
    },
    {
      step: '02',
      title: 'Build Strategy',
      description: 'Use visual blocks to design your yield strategy',
    },
    {
      step: '03',
      title: 'Deploy & Earn',
      description: 'Deploy your vault and start earning automatically',
    },
  ], []);

  const duplicatedTestimonials = useMemo(() => {
    const row1 = testimonials.slice(0, 3);
    const row2 = testimonials.slice(3);
    return { row1, row2 };
  }, [testimonials]);

  useEffect(() => {
    Object.values(featureImageMap).forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, [featureImageMap]);

  return (
    <div className="min-h-screen bg-app">
      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-app">
        {/* UnicornStudio Animated Background with loading fallback */}
        <div 
          data-us-project="4gq2Yrv2p0bIa0hdLPQx" 
          className="absolute inset-0 w-full h-full"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(220, 232, 93, 0.1) 0%, rgba(9, 10, 10, 0) 50%)',
          }}
        />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.3 }}
              className="text-5xl md:text-7xl font-bold mb-4 text-white tracking-tight leading-[0.95]"
            >
              Build Smarter Vaults on{' '}
              <span className="text-[#dce85d]">Stellar</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-lg md:text-xl text-[#a1a1aa] mb-8 max-w-2xl mx-auto"
            >
              Create, deploy, and manage automated yield strategies.
              No coding required. Maximum security. Optimal returns.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
            >
              {/* Constrain CTA width on small screens so it doesn't stretch full-width */}
              <div className="w-full sm:w-auto max-w-[360px] mx-auto">
                <Button
                  size="lg"
                  variant="shimmer"
                  rightIcon={<ArrowRight size={18} />}
                  onClick={() => navigate('/app/builder')}
                >
                  Start Building
                </Button>
              </div>
            </motion.div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label}>
                    <Card className="p-4 text-center bg-card hover:border-primary-500/30 transition-colors">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-primary-500" />
                        <div className="text-2xl font-bold text-neutral-50">
                          {stat.value}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400 mb-1">{stat.label}</div>
                      <div className="text-xs text-success-500 font-medium">
                        {stat.change}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="uppercase text-xs font-medium text-[#a1a1aa] tracking-wide">Trusted by teams at</p>
          </div>
          <div 
            className="overflow-hidden relative"
            style={{ 
              maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
            }}
          >
            <div className="flex gap-16 py-2 items-center animate-marquee">
              <div className="flex gap-16 shrink-0 items-center">
                {trustedBy.map((company, idx) => (
                  <span 
                    key={idx} 
                    className={`text-lg ${idx % 2 === 0 ? 'font-normal' : 'font-semibold'} tracking-tighter text-[#a1a1aa] hover:text-white transition whitespace-nowrap`}
                  >
                    {company}
                  </span>
                ))}
              </div>
              <div className="flex gap-16 shrink-0 items-center">
                {trustedBy.map((company, idx) => (
                  <span 
                    key={`dup-${idx}`} 
                    className={`text-lg ${idx % 2 === 0 ? 'font-normal' : 'font-semibold'} tracking-tighter text-[#a1a1aa] hover:text-white transition whitespace-nowrap`}
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced with Animated Integrations */}
      <section id="features" className="py-24 relative bg-[#090a0a] overflow-hidden">
        <div className="opacity-30 absolute top-0 right-0 bottom-0 left-0 will-change-[filter] transform-gpu">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#dce85d] rounded-full blur-[120px] md:blur-[120px] blur-[60px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#74b97f] rounded-full blur-[120px] md:blur-[120px] blur-[60px]"></div>
        </div>
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#dce85d]/10 px-3 py-1.5 text-xs text-[#dce85d] ring-1 ring-[#dce85d]/20 uppercase tracking-tight mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Features
            </span>
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-white tracking-tight">
              Everything You Need to{' '}
              <span className="text-[#dce85d]">Succeed</span>
            </h2>
            <p className="text-lg text-[#a1a1aa] max-w-2xl mx-auto">
              Powerful tools and integrations designed to maximize your yield strategies
            </p>
          </div>

          {/* Animated Integration Icons */}
          <div className="relative mx-auto mt-12 max-w-5xl mb-16">
            <div className="flex gap-8 sm:gap-12 mb-8 gap-x-8 gap-y-8 items-center justify-center">
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="inline-flex items-center justify-center glass-card transition-all duration-300 w-14 h-14 rounded-xl will-change-transform"
                style={{ 
                  animation: isFeaturesSectionVisible ? 'float 3s ease-in-out infinite' : 'none',
                  willChange: 'transform'
                }}
              >
                <Shield className="w-6 h-6 text-[#dce85d]" />
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-xl glass-card transition-all duration-300 will-change-transform"
                style={{ 
                  animation: isFeaturesSectionVisible ? 'float 3s ease-in-out infinite 0.2s' : 'none',
                  willChange: 'transform'
                }}
              >
                <Activity className="w-6 h-6 text-[#dce85d]" />
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-xl glass-card transition-all duration-300 will-change-transform"
                style={{ 
                  animation: isFeaturesSectionVisible ? 'float 3s ease-in-out infinite 0.4s' : 'none',
                  willChange: 'transform'
                }}
              >
                <Box className="w-6 h-6 text-[#dce85d]" />
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-xl glass-card transition-all duration-300 will-change-transform"
                style={{ 
                  animation: isFeaturesSectionVisible ? 'float 3s ease-in-out infinite 0.6s' : 'none',
                  willChange: 'transform'
                }}
              >
                <Layers className="w-6 h-6 text-[#dce85d]" />
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-xl glass-card transition-all duration-300 will-change-transform"
                style={{ 
                  animation: isFeaturesSectionVisible ? 'float 3s ease-in-out infinite 0.8s' : 'none',
                  willChange: 'transform'
                }}
              >
                <TrendingUp className="w-6 h-6 text-[#dce85d]" />
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-xl glass-card transition-all duration-300 will-change-transform"
                style={{ 
                  animation: isFeaturesSectionVisible ? 'float 3s ease-in-out infinite 1s' : 'none',
                  willChange: 'transform'
                }}
              >
                <Zap className="w-6 h-6 text-[#dce85d]" />
              </motion.span>
            </div>

            {/* Animated Connection Lines (SVG) */}
            <div className="relative h-72">
              <svg viewBox="0 0 900 360" className="absolute top-0 right-0 bottom-0 left-0 w-full h-[288px] max-w-[1008px] mx-auto will-change-transform transform-gpu" fill="none" strokeWidth="2">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  {/* Simplified filter for mobile */}
                  <filter id="glow-simple">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <circle cx="150" cy="30" r="5" fill="#dce85d" filter="url(#glow)" style={{ animation: 'pulse-glow 2s ease-in-out infinite', willChange: 'opacity' }} className="md:filter-[url(#glow)] filter-[url(#glow-simple)]"></circle>
                <circle cx="270" cy="30" r="5" fill="#dce85d" filter="url(#glow)" style={{ animation: 'pulse-glow 2s ease-in-out infinite 0.2s', willChange: 'opacity' }} className="md:filter-[url(#glow)] filter-[url(#glow-simple)]"></circle>
                <circle cx="390" cy="30" r="5" fill="#dce85d" filter="url(#glow)" style={{ animation: 'pulse-glow 2s ease-in-out infinite 0.4s', willChange: 'opacity' }} className="md:filter-[url(#glow)] filter-[url(#glow-simple)]"></circle>
                <circle cx="510" cy="30" r="5" fill="#dce85d" filter="url(#glow)" style={{ animation: 'pulse-glow 2s ease-in-out infinite 0.6s', willChange: 'opacity' }} className="md:filter-[url(#glow)] filter-[url(#glow-simple)]"></circle>
                <circle cx="630" cy="30" r="5" fill="#dce85d" filter="url(#glow)" style={{ animation: 'pulse-glow 2s ease-in-out infinite 0.8s', willChange: 'opacity' }} className="md:filter-[url(#glow)] filter-[url(#glow-simple)]"></circle>
                <circle cx="750" cy="30" r="5" fill="#dce85d" filter="url(#glow)" style={{ animation: 'pulse-glow 2s ease-in-out infinite 1s', willChange: 'opacity' }} className="md:filter-[url(#glow)] filter-[url(#glow-simple)]"></circle>

                {/* Optimized animated paths - faster duration and simpler easing on mobile */}
                <path d="M450 300 C 450 200, 300 120, 150 30" stroke="#dce85d" strokeWidth="2" strokeLinecap="round" fill="none" style={{ strokeDasharray: '600', strokeDashoffset: '600' }} opacity="0.6">
                  <animate attributeName="stroke-dashoffset" values="600;0;600" dur={isMobile ? "4s" : "3s"} begin="0s" repeatCount="indefinite" calcMode={isMobile ? "linear" : "spline"} keySplines={isMobile ? undefined : "0.42 0 0.58 1; 0.42 0 0.58 1"} />
                </path>
                <path d="M450 300 C 450 210, 360 130, 270 30" stroke="#dce85d" strokeWidth="2" strokeLinecap="round" fill="none" style={{ strokeDasharray: '520', strokeDashoffset: '520' }} opacity="0.6">
                  <animate attributeName="stroke-dashoffset" values="520;0;520" dur={isMobile ? "4s" : "3s"} begin="0.2s" repeatCount="indefinite" calcMode={isMobile ? "linear" : "spline"} keySplines={isMobile ? undefined : "0.42 0 0.58 1; 0.42 0 0.58 1"} />
                </path>
                <path d="M450 300 C 450 150, 420 80, 390 30" stroke="#dce85d" strokeWidth="2" strokeLinecap="round" fill="none" style={{ strokeDasharray: '450', strokeDashoffset: '450' }} opacity="0.6">
                  <animate attributeName="stroke-dashoffset" values="450;0;450" dur={isMobile ? "4s" : "3s"} begin="0.4s" repeatCount="indefinite" calcMode={isMobile ? "linear" : "spline"} keySplines={isMobile ? undefined : "0.42 0 0.58 1; 0.42 0 0.58 1"} />
                </path>
                <path d="M450 300 C 450 150, 480 80, 510 30" stroke="#dce85d" strokeWidth="2" strokeLinecap="round" fill="none" style={{ strokeDasharray: '450', strokeDashoffset: '450' }} opacity="0.6">
                  <animate attributeName="stroke-dashoffset" values="450;0;450" dur={isMobile ? "4s" : "3s"} begin="0.6s" repeatCount="indefinite" calcMode={isMobile ? "linear" : "spline"} keySplines={isMobile ? undefined : "0.42 0 0.58 1; 0.42 0 0.58 1"} />
                </path>
                <path d="M450 300 C 450 210, 540 130, 630 30" stroke="#dce85d" strokeWidth="2" strokeLinecap="round" fill="none" style={{ strokeDasharray: '520', strokeDashoffset: '520' }} opacity="0.6">
                  <animate attributeName="stroke-dashoffset" values="520;0;520" dur={isMobile ? "4s" : "3s"} begin="0.8s" repeatCount="indefinite" calcMode={isMobile ? "linear" : "spline"} keySplines={isMobile ? undefined : "0.42 0 0.58 1; 0.42 0 0.58 1"} />
                </path>
                <path d="M450 300 C 450 200, 600 120, 750 30" stroke="#dce85d" strokeWidth="2" strokeLinecap="round" fill="none" style={{ strokeDasharray: '600', strokeDashoffset: '600' }} opacity="0.6">
                  <animate attributeName="stroke-dashoffset" values="600;0;600" dur={isMobile ? "4s" : "3s"} begin="1s" repeatCount="indefinite" calcMode={isMobile ? "linear" : "spline"} keySplines={isMobile ? undefined : "0.42 0 0.58 1; 0.42 0 0.58 1"} />
                </path>
              </svg>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dce85d]/20 ring-2 ring-[#dce85d]/40" style={{ boxShadow: isMobile ? '0 0 15px rgba(220,232,93,0.4)' : '0 0 30px rgba(220,232,93,0.6), 0 0 60px rgba(220,232,93,0.3)' }}>
                  <Sparkles className="w-8 h-8 text-[#dce85d]" />
                </span>
              </div>
            </div>
          </div>

          {/* Feature Benefits */}
          <div className="mx-auto max-w-5xl mt-16">
            <div className="flex flex-wrap md:flex-nowrap text-sm gap-x-4 gap-y-4 items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card whitespace-nowrap">
                <ShieldCheck className="w-4 h-4 text-[#dce85d]" />
                <span className="text-neutral-50">Audited Smart Contracts</span>
              </div>
              <div className="hidden md:block w-16 h-px border-t border-dashed border-[#dce85d]/40 flex-shrink-0"></div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card whitespace-nowrap">
                <Activity className="w-4 h-4 text-[#dce85d]" />
                <span className="text-neutral-50">Real-time Monitoring</span>
              </div>
              <div className="hidden md:block w-16 h-px border-t border-dashed border-[#dce85d]/40 flex-shrink-0"></div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card whitespace-nowrap">
                <Layers className="w-4 h-4 text-[#dce85d]" />
                <span className="text-neutral-50">Multi-Protocol Support</span>
              </div>
              <div className="hidden md:block w-16 h-px border-t border-dashed border-[#dce85d]/40 flex-shrink-0"></div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card whitespace-nowrap">
                <Sparkles className="w-4 h-4 text-[#dce85d]" />
                <span className="text-neutral-50">AI-Powered Optimization</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className="py-16 relative bg-[#090a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="glass-card sm:p-10 transition-all duration-300 group rounded-3xl pt-6 pr-6 pb-6 pl-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 items-start">
              <div className="flex flex-col min-h-full justify-between">
                <div>
                  <span className="text-sm font-normal text-[#a1a1aa] inline-block transition-all duration-300 group-hover:text-[#dce85d]">Platform</span>
                  <h2 className="text-5xl sm:text-6xl lg:text-7xl leading-[0.9] text-white tracking-tighter mt-2 transition-all duration-500 group-hover:text-[#dce85d]">
                    A vault platform built for speed and precision.
                  </h2>
                  <div className="mt-8 relative">
                    <div className="flex flex-col gap-4 relative text-[#fafafa] pr-4 pl-4">
                      <div className="relative group/item">
                        <div className="absolute left-2 top-8 bottom-0 w-px bg-gradient-to-b from-[#dce85d] via-[#a8c93a] to-[#74b97f] transition-all duration-300 group-hover/item:w-0.5 group-hover/item:shadow-[0_0_8px_rgba(220,232,93,0.6)]"></div>
                        <div className="flex gap-4 items-start transition-all duration-300 hover:translate-x-2">
                          <div className="flex-shrink-0 w-4 h-4 z-10 relative bg-[#090a0a] border-[#dce85d] border-2 rounded-full mt-0.5 transition-all duration-300 group-hover/item:scale-125 group-hover/item:shadow-[0_0_12px_rgba(220,232,93,0.8)]">
                            <div className="w-1.5 h-1.5 absolute top-0.5 left-0.5 bg-[#dce85d] rounded-full transition-all duration-300 group-hover/item:animate-pulse"></div>
                          </div>
                          <div className="flex-1 pb-6">
                            <span className="text-sm font-medium text-[#dce85d] transition-all duration-300 group-hover/item:text-white">
                              Smart Strategy Builder
                            </span>
                            <p className="text-xs text-[#a1a1aa] mt-1 transition-all duration-300 group-hover/item:text-[#fafafa]">
                              Visual interface for complex yield strategies
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative group/item">
                        <div className="absolute left-2 top-8 bottom-0 w-px bg-gradient-to-b from-[#dce85d] via-[#a8c93a] to-[#74b97f] transition-all duration-300 group-hover/item:w-0.5 group-hover/item:shadow-[0_0_8px_rgba(168,201,58,0.6)]"></div>
                        <div className="flex gap-4 items-start transition-all duration-300 hover:translate-x-2">
                          <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-[#a8c93a] bg-[#090a0a] z-10 relative mt-0.5 transition-all duration-300 group-hover/item:scale-125 group-hover/item:shadow-[0_0_12px_rgba(168,201,58,0.8)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#a8c93a] absolute top-0.5 left-0.5 transition-all duration-300 group-hover/item:animate-pulse"></div>
                          </div>
                          <div className="flex-1 pb-6">
                            <span className="text-sm font-medium text-[#a8c93a] transition-all duration-300 group-hover/item:text-white">
                              Real-time Analytics
                            </span>
                            <p className="text-xs text-[#a1a1aa] mt-1 transition-all duration-300 group-hover/item:text-[#fafafa]">
                              Monitor performance across all positions
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative group/item">
                        <div className="flex items-start gap-4 transition-all duration-300 hover:translate-x-2">
                          <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-[#74b97f] bg-[#090a0a] z-10 relative mt-0.5 transition-all duration-300 group-hover/item:scale-125 group-hover/item:shadow-[0_0_12px_rgba(116,185,127,0.8)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#74b97f] absolute top-0.5 left-0.5 transition-all duration-300 group-hover/item:animate-pulse"></div>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-[#74b97f] transition-all duration-300 group-hover/item:text-white">
                              Gas Optimization
                            </span>
                            <p className="text-xs text-[#a1a1aa] mt-1 transition-all duration-300 group-hover/item:text-[#fafafa]">
                              Minimize fees with smart batching
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full mt-10">
                  <p className="text-sm font-medium text-white tracking-tight transition-all duration-300 group-hover:text-[#dce85d]">
                    Maximize every opportunity
                  </p>
                  <p className="text-sm text-[#a1a1aa] mt-1 max-w-sm transition-all duration-300 group-hover:text-[#fafafa]">
                    Advanced automation, risk management, and portfolio rebalancing that keeps your strategy optimized 24/7.
                  </p>
                  <button
                    onClick={() => navigate('/app/vaults')}
                    className="inline-flex items-center justify-center gap-2 h-10 hover:bg-[#e8f06d] transition-all duration-300 text-sm font-normal text-[#090a0a] bg-[#dce85d] rounded-full mt-4 px-4 hover:scale-105 hover:shadow-[0_0_20px_rgba(220,232,93,0.6)]"
                  >
                    Explore vaults
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#090a0a] transition-all duration-300 group-hover:animate-pulse"></span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 relative">
                {platformFeatures.map((feature, idx) => {
                  const Icon = feature.icon;
                  const bgImage = featureImageMap[feature.title];
                  return (
                    <div 
                      key={idx}
                      className={`relative overflow-hidden ${idx >= 2 ? 'aspect-[4/5]' : 'aspect-[4/3]'} bg-center bg-cover border border-white/[0.06] rounded-2xl group/card transition-all duration-500 hover:scale-[1.05] hover:border-[#dce85d]/30 hover:shadow-[0_0_30px_rgba(220,232,93,0.3)]`}
                      style={bgImage ? { backgroundImage: `url('${bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/60 group-hover/card:from-black/10 group-hover/card:to-black/50 transition-all duration-500"></div>
                      <div className="absolute top-3 left-3 transition-all duration-300 group-hover/card:scale-110">
                        <span className="inline-flex items-center gap-2 text-xs text-white/90 glass-card rounded-full py-1.5 px-1.5 transition-all duration-300 group-hover/card:bg-[#dce85d]/20">
                          <Icon className="w-3.5 h-3.5 transition-all duration-300 group-hover/card:text-[#dce85d]" />
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 transition-all duration-300 group-hover/card:scale-110">
                        <span className="inline-flex items-center gap-2 text-xs text-white/90 glass-card rounded-full py-1.5 px-3 transition-all duration-300 group-hover/card:bg-[#dce85d]/20 group-hover/card:text-white">
                          {feature.tag}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 transition-all duration-300 group-hover/card:bottom-4">
                        <p className="text-white text-lg font-medium tracking-tight leading-tight transition-all duration-300 group-hover/card:text-[#dce85d]">
                          {feature.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-[#161a1d] pt-24 pb-24 relative">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="md:text-6xl text-4xl font-bold text-white tracking-tight mb-4">
              Get Started in <span className="text-[#dce85d]">3 Steps</span>
            </h2>
            <p className="text-lg text-[#a1a1aa]">From zero to earning in minutes</p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {steps.map((step) => (
              <div key={step.step} className="glass-card rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-[#dce85d] flex items-center justify-center">
                      <span className="text-lg font-bold text-[#090a0a]">{step.step}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#a1a1aa]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/app/builder')}
              className="group isolate inline-flex cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(220,232,93,0.35)] rounded-full relative shadow-[0_8px_40px_rgba(220,232,93,0.25)]"
              style={{ 
                '--spread': '90deg',
                '--shimmer-color': 'rgba(255,255,255,0.6)',
                '--radius': '9999px',
                '--speed': '4s',
                '--cut': '1px',
                '--bg': 'rgba(220, 232, 93, 0.1)'
              } as React.CSSProperties}
            >
              <div className="absolute inset-0">
                <div className="absolute inset-[-200%] w-[400%] h-[400%] animate-[rotate-gradient_var(--speed)_linear_infinite]">
                  <div className="absolute inset-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]"></div>
                </div>
              </div>
              <div className="absolute rounded-full [background:var(--bg)] [inset:var(--cut)] backdrop-blur"></div>
              <div className="z-10 flex gap-3 sm:w-auto overflow-hidden text-base font-medium text-white w-full pt-3 pr-5 pb-3 pl-5 relative gap-x-3 gap-y-3 items-center" style={{ borderRadius: '9999px' }}>
                <div style={{ 
                  position: 'absolute', 
                  content: ' ', 
                  display: 'block', 
                  width: '200%', 
                  height: '200%', 
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), transparent)', 
                  animation: 'rotate-gradient 4s infinite linear', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)'
                }}></div>
                <div style={{ 
                  position: 'absolute', 
                  inset: '1px', 
                  background: 'rgba(10, 11, 20, 0.8)', 
                  borderRadius: '9999px', 
                  backdropFilter: 'blur(8px)'
                }}></div>
                <span className="whitespace-nowrap relative z-10 font-sans">
                  Create Your First Vault
                </span>
                <span className="inline-flex items-center justify-center z-10 bg-white/10 w-7 h-7 rounded-full relative">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 relative bg-[#090a0a]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-[#a1a1aa]">What vault creators say</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl tracking-tight font-semibold text-white">Testimonials</h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[#a1a1aa]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
                <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
              </svg>
              <span className="text-sm">Real feedback from builders</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-[#0a0b0c] border border-white/[0.06] relative">
            <div 
              className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-[#0a0b0c] to-transparent z-10"
            ></div>
            <div 
              className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-[#0a0b0c] to-transparent z-10"
            ></div>
            
            {/* First Row */}
            <div className="py-6 sm:py-8 relative">
              <div className="flex gap-4 sm:gap-5 animate-marquee-ltr">
                {[...duplicatedTestimonials.row1, ...duplicatedTestimonials.row1].map((testimonial, idx) => (
                  <article 
                    key={`row1-${idx}`}
                    className="shrink-0 w-[280px] sm:w-[360px] md:w-[420px] rounded-2xl border border-white/[0.08] bg-[#16181a]/40 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-[#090a0a] font-semibold text-sm`}>
                        {testimonial.initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-white">{testimonial.name}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#dce85d]">
                            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                            <path d="m9 12 2 2 4-4"></path>
                          </svg>
                        </div>
                        <p className="text-xs text-[#a1a1aa]">{testimonial.handle}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm sm:text-base text-[#fafafa]">
                      {testimonial.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
            
            <div className="border-t border-white/[0.08]"></div>
            
            {/* Second Row */}
            <div className="py-6 sm:py-8 relative">
              <div className="flex gap-4 sm:gap-5 animate-marquee-rtl">
                {[...duplicatedTestimonials.row2, ...duplicatedTestimonials.row2].map((testimonial, idx) => (
                  <article 
                    key={`row2-${idx}`}
                    className="shrink-0 w-[280px] sm:w-[360px] md:w-[420px] rounded-2xl border border-white/[0.08] bg-[#16181a]/40 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-semibold text-sm`}>
                        {testimonial.initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-white">{testimonial.name}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#dce85d]">
                            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                            <path d="m9 12 2 2 4-4"></path>
                          </svg>
                        </div>
                        <p className="text-xs text-[#a1a1aa]">{testimonial.handle}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm sm:text-base text-[#fafafa]">
                      {testimonial.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative bg-[#161a1d]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="glass-card rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#dce85d] rounded-full blur-[100px]"></div>
              <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#74b97f] rounded-full blur-[100px]"></div>
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-white tracking-tight">
                Ready to{' '}
                <span className="text-[#dce85d]">Maximize</span>
                {' '}Your Yields?
              </h2>
              <p className="text-lg text-[#a1a1aa] mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already earning with Syft's automated yield vaults
              </p>
              <button
                onClick={() => navigate('/app/builder')}
                className="group isolate inline-flex cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(220,232,93,0.35)] rounded-full relative shadow-[0_8px_40px_rgba(220,232,93,0.25)]"
                style={{ 
                  '--spread': '90deg',
                  '--shimmer-color': 'rgba(255,255,255,0.6)',
                  '--radius': '9999px',
                  '--speed': '4s',
                  '--cut': '1px',
                  '--bg': 'rgba(220, 232, 93, 0.1)'
                } as React.CSSProperties}
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-[-200%] w-[400%] h-[400%] animate-[rotate-gradient_var(--speed)_linear_infinite]">
                    <div className="absolute inset-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]"></div>
                  </div>
                </div>
                <div className="absolute rounded-full [background:var(--bg)] [inset:var(--cut)] backdrop-blur"></div>
                <div className="z-10 flex gap-3 sm:w-auto overflow-hidden text-base font-medium text-white w-full pt-3 pr-5 pb-3 pl-5 relative gap-x-3 gap-y-3 items-center" style={{ borderRadius: '9999px' }}>
                  <div style={{ 
                    position: 'absolute', 
                    content: ' ', 
                    display: 'block', 
                    width: '200%', 
                    height: '200%', 
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), transparent)', 
                    animation: 'rotate-gradient 4s infinite linear', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)'
                  }}></div>
                  <div style={{ 
                    position: 'absolute', 
                    inset: '1px', 
                    background: 'rgba(10, 11, 20, 0.8)', 
                    borderRadius: '9999px', 
                    backdropFilter: 'blur(8px)'
                  }}></div>
                  <span className="whitespace-nowrap relative z-10 font-sans">
                    Launch App
                  </span>
                  <span className="inline-flex items-center justify-center z-10 bg-white/10 w-7 h-7 rounded-full relative">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Add type declaration for UnicornStudio
declare global {
  interface Window {
    UnicornStudio?: {
      init: () => void;
      isInitialized?: boolean;
    };
  }
}

export default Home;
