import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { ArrowRight, Check } from 'lucide-react';

import mockup6 from '@assets/landing_page_6_1773851354670.png';
import mockup7 from '@assets/landing_page_7_1773851354670.png';
import mockup8 from '@assets/landing_page_8_1773851354670.png';

function MockupImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-white/5 shadow-2xl shadow-black/60 ${className}`}>
      <img src={src} alt={alt} className="w-full h-auto block" />
    </div>
  );
}

export default function LandingPage() {
  const { user, profile, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && profile) {
      setLocation('/feed');
    }
  }, [user, profile, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user && profile) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-safe bg-black/90 backdrop-blur-md border-b border-white/5">
        <div className="flex h-14 items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" /><path d="m8 17 4 4 4-4" />
            </svg>
          </div>
          <span className="text-xl font-display text-white tracking-widest">FORTIFY</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features', id: 'features' },
            { label: 'Disciplines', id: 'disciplines' },
            { label: 'How It Works', id: 'how-it-works' },
            { label: 'Pricing', id: 'pricing' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/auth" className="hidden md:block text-sm text-white/70 hover:text-white transition-colors">
            Log In
          </Link>
          <Link
            href="/auth"
            className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Start For Free
          </Link>
        </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] text-center px-6 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-20">
        <div className="mb-6 inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white/70">
          Supplemental Strength Programming
        </div>
        <h1 className="font-display text-7xl md:text-9xl leading-none tracking-wide mb-6">
          BREAK YOUR<br />
          <span className="text-primary">LIMITS</span>
        </h1>
        <p className="max-w-xl text-lg text-white/60 mb-10 leading-relaxed">
          Fortify is the strength layer that makes every CrossFit WOD, Hyrox race, and ATHX event feel different.
          Not your primary program — the thing that makes your primary program better.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/auth"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:scale-105"
          >
            Start For Free <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="text-white/80 hover:text-white font-semibold px-7 py-3.5 border border-white/20 rounded-xl transition-all hover:border-white/40"
          >
            See How It Works
          </button>
        </div>
        <div className="mt-8 flex items-center gap-3 text-sm text-white/40">
          <span className="font-semibold text-white/60">Backed by 2POOD</span>
          <span>•</span>
          <span>Built for functional athletes</span>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="pt-10 pb-24 px-6 md:px-12 max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-6xl text-center mb-3">
          STRENGTH THAT FITS
        </h2>
        <h2 className="font-display text-4xl md:text-6xl text-center mb-4">
          INSIDE YOUR LIFE
        </h2>
        <p className="text-center text-white/50 mb-16 max-w-xl mx-auto">
          Like Aflac for strength — it works alongside whatever you are already doing.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" />
                </svg>
              ),
              title: 'SUPPLEMENTAL, NOT REPLACEMENT',
              body: '2–4 days a week, 30–45 minutes. Designed to run alongside your box programming, your Hyrox plan, or your ATHX training. Never conflicts. Always compounds.',
            },
            {
              num: '02',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                </svg>
              ),
              title: 'BUILT FOR YOUR DISCIPLINE',
              body: 'Choose your athlete profile: CrossFit, Hyrox, or ATHX. Then pick the strength gap you want to close. Lower body, overhead, pulling, explosive power — your track, your goal.',
            },
            {
              num: '03',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
                </svg>
              ),
              title: 'PROGRESSIVE AND TRACKED',
              body: '4–6 week cycles with RPE-based loading. Log every set, track every PR, watch your numbers move.',
            },
          ].map(({ num, icon, title, body }) => (
            <div key={num} className="bg-[#111] rounded-2xl p-8 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-bold text-primary">{num}</span>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {icon}
                </div>
              </div>
              <h3 className="font-display text-xl mb-3">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-6xl text-center mb-2">YOU TRAIN HARD.</h2>
        <h2 className="font-display text-4xl md:text-6xl text-center text-white/30 mb-16">
          YOUR STRENGTH ISN'T KEEPING UP.
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {[
            {
              discipline: 'CROSSFIT',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
                </svg>
              ),
              heading: 'YOUR CONDITIONING IS THERE.',
              body: 'Your squat, press, and pull are the bottleneck.',
            },
            {
              discipline: 'HYROX',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              ),
              heading: 'YOU CAN RUN.',
              body: 'But the sled destroys you every time.',
            },
            {
              discipline: 'ATHX',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              heading: "YOU'RE FIT.",
              body: "You're not powerful.",
            },
          ].map(({ discipline, icon, heading, body }) => (
            <div key={discipline} className="bg-[#111] rounded-2xl p-8 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                {icon}
              </div>
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{discipline}</div>
              <h3 className="font-display text-lg mb-2">{heading}</h3>
              <p className="text-white/50 text-sm">{body}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 max-w-xs h-px bg-primary/40" />
          <span className="text-white/80 font-semibold text-lg">Fortify fixes the gap.</span>
          <div className="flex-1 max-w-xs h-px bg-primary/40" />
        </div>
      </section>

      {/* ── DISCIPLINES ── */}
      <section id="disciplines" className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-primary mb-4">Choose Your Path</p>
        <h2 className="font-display text-4xl md:text-6xl text-center mb-16">BUILT FOR YOUR DISCIPLINE</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'CROSSFIT',
              color: '#E8451E',
              tagline: 'Close the strength gap your WODs leave open.',
              tracks: ['Lower Body', 'Overhead & Shoulder', 'Pulling Strength', 'Muscular Endurance'],
            },
            {
              name: 'HYROX',
              color: '#00B4D8',
              tagline: 'Build the hip drive and carry strength that wins races.',
              tracks: ['Sled & Loaded Carry', 'Running Economy', 'Station Strength', 'Strength Endurance'],
            },
            {
              name: 'ATHX',
              color: '#E8451E',
              tagline: 'Develop the explosive power ATHX demands.',
              tracks: ['Explosive Power', 'Posterior Chain', 'Upper Body Power', 'Competition Prep'],
            },
          ].map(({ name, color, tagline, tracks }) => (
            <div key={name} className="bg-[#111] rounded-2xl p-8 border border-white/5 flex flex-col">
              <div className="h-0.5 rounded-full mb-6" style={{ backgroundColor: color }} />
              <h3 className="font-display text-2xl mb-3">{name}</h3>
              <p className="text-white/50 text-sm mb-6 flex-1">{tagline}</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {tracks.map(t => (
                  <span key={t} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/60">
                    {t}
                  </span>
                ))}
              </div>
              <Link href="/auth" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Explore Tracks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-primary mb-4">Simple Process</p>
        <h2 className="font-display text-4xl md:text-6xl text-center mb-16">HOW IT WORKS</h2>
        <div className="grid md:grid-cols-2 gap-10">
          {[
            {
              num: '01',
              title: 'CHOOSE YOUR DISCIPLINE',
              body: 'CrossFit, Hyrox, or ATHX. Pick the strength gap you want to close.',
            },
            {
              num: '02',
              title: 'GET YOUR PROGRAM',
              body: 'A 4–6 week supplemental cycle built around your schedule. 2–4 days a week, 30–45 minutes per session.',
            },
            {
              num: '03',
              title: 'TRAIN AND TRACK',
              body: 'Log every set with RPE-based loading. Watch your PRs climb week over week.',
            },
            {
              num: '04',
              title: 'GET STRONGER AT YOUR SPORT',
              body: 'Show up to your WOD, your race, or your event with more in the tank.',
            },
          ].map(({ num, title, body }) => (
            <div key={num} className="flex gap-6 items-start">
              <span className="font-display text-5xl text-primary leading-none">{num}</span>
              <div>
                <h3 className="font-display text-xl mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── APP FEATURES ── */}
      <section id="features" className="py-24 max-w-6xl mx-auto">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-primary mb-4 px-6 md:px-12">App Features</p>
        <h2 className="font-display text-4xl md:text-6xl text-center mb-20 px-6 md:px-12">
          EVERYTHING YOU NEED<br />TO GET STRONGER
        </h2>

        <div className="flex flex-col gap-24">
          {/* Feature 1: Today's Workout */}
          <div>
            <div className="flex items-start gap-4 mb-8 px-6 md:px-12">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-3xl md:text-4xl mb-2">TODAY'S WORKOUT</h3>
                <p className="text-white/50 leading-relaxed max-w-lg">
                  Coach-written sessions delivered daily. Every exercise has a description, cue points, and a linked video.
                </p>
              </div>
            </div>
            <MockupImage src={mockup6} alt="Today's workout view" />
          </div>

          {/* Feature 2: Set Logging */}
          <div>
            <div className="flex items-start gap-4 mb-8 px-6 md:px-12">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-3xl md:text-4xl mb-2">SET LOGGING + REST TIMER</h3>
                <p className="text-white/50 leading-relaxed max-w-lg">
                  Log weight, reps, and RPE inline. Built-in rest timer so you stay on pace.
                </p>
              </div>
            </div>
            <MockupImage src={mockup7} alt="Set logging and rest timer view" />
          </div>

          {/* Feature 3: PR Tracker + Community */}
          <div>
            <div className="flex items-start gap-4 mb-8 px-6 md:px-12">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-3xl md:text-4xl mb-2">PR TRACKER & COMMUNITY</h3>
                <p className="text-white/50 leading-relaxed max-w-lg">
                  Every movement tracked over time. PRs surface automatically as you log. Ask questions and share progress with athletes on the same track.
                </p>
              </div>
            </div>
            <MockupImage src={mockup8} alt="PR tracker and community view" />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'BETA ATHLETES' },
            { value: '12', label: 'SUB-TRACKS' },
            { value: '40+', label: 'COACHED MOVEMENTS' },
            { value: '2POOD', label: 'BACKED BY' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="font-display text-5xl md:text-6xl text-primary mb-2">{value}</div>
              <div className="text-xs uppercase tracking-widest text-white/30">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: '"I\'ve tried every strength cycle. Fortify is the first one that didn\'t wreck my metcons."',
              name: 'Sarah M.',
              role: 'CrossFit athlete, 4 years',
            },
            {
              quote: '"My sled push times dropped 20 seconds after one cycle. The hip drive work is legit."',
              name: 'Marcus K.',
              role: 'Hyrox competitor',
            },
            {
              quote: '"Finally found something that builds power without killing my conditioning."',
              name: 'Jake T.',
              role: 'ATHX athlete',
            },
          ].map(({ quote, name, role }) => (
            <div key={name} className="bg-[#111] rounded-2xl p-8 border border-white/5">
              <div className="text-4xl font-display text-primary/20 mb-4">"</div>
              <p className="text-white/80 text-sm leading-relaxed mb-6">{quote}</p>
              <div>
                <div className="font-semibold text-sm text-white">{name}</div>
                <div className="text-xs text-white/40 mt-0.5">{role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6 md:px-12 max-w-2xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-6xl mb-4">FREE DURING BETA</h2>
        <p className="text-white/50 mb-12">Built for athletes who are serious about getting stronger.</p>

        <div className="bg-[#111] border-2 border-primary/30 rounded-2xl overflow-hidden">
          <div className="h-0.5 bg-primary w-full" />
          <div className="p-10">
            <div className="text-xs uppercase tracking-widest text-primary mb-3">Beta Access</div>
            <div className="font-display text-7xl text-primary mb-8">FREE</div>
            <div className="space-y-4 text-left mb-10">
              {[
                'Full access to all 12 training tracks',
                'Daily coach-written workouts',
                'Set logging with RPE tracking',
                'Automatic PR detection',
                '40+ exercise video library',
                'Community & coach chat access',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-white/70 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth"
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl transition-all hover:scale-[1.02]"
            >
              Join the Beta <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-white/30 mt-4">
              No credit card required. Founding member pricing locked in when paid tier launches.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" /><path d="m8 17 4 4 4-4" />
              </svg>
            </div>
            <span className="font-display tracking-widest text-white">FORTIFY</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            {[
              { label: 'Features', id: 'features' },
              { label: 'Disciplines', id: 'disciplines' },
              { label: 'How It Works', id: 'how-it-works' },
            ].map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white/70 transition-colors">
                {label}
              </button>
            ))}
            <Link href="/auth" className="hover:text-white/70 transition-colors">Join Beta</Link>
          </div>
          <div className="text-sm text-white/30">
            Backed by <span className="font-bold text-white/50">2POOD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
