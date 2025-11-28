export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-45" style={{
        backgroundImage:
          'radial-gradient(60% 60% at 30% 70%, rgba(251,191,36,0.18), transparent 70%), radial-gradient(50% 50% at 70% 30%, rgba(124,58,237,0.16), transparent 65%)'
      }} />
      <div className="mx-auto max-w-md text-center space-y-3">
        <p className="text-sm text-slate-400">Page not found</p>
        <h1 className="text-3xl font-semibold">Let’s guide you back</h1>
        <p className="text-slate-300">The page you’re looking for doesn’t exist. Head back to the calm control center.</p>
        <a href="/" className="inline-flex items-center justify-center rounded-lg bg-teal-400 text-slate-950 px-5 py-2 text-sm font-semibold hover:bg-teal-300">Go to homepage</a>
      </div>
    </div>
  );
}

