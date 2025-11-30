import React from "react";

type Quote = {
  quote: string;
  author?: string;
  role?: string;
};

type Logo = {
  src: string;
  alt: string;
};

type SocialProofProps = {
  quotes?: Quote[];
  logos?: Logo[];
};

export const SocialProof: React.FC<SocialProofProps> = ({
  quotes = [
    {
      quote:
        "For the first time, someone built a tool that understands what interpreting does to my body and my brain.",
      author: "Community Interpreter",
      role: "Medical & Mental Health",
    },
    {
      quote:
        "It's the only platform that truly respects the cognitive and ethical demands of this profession.",
      author: "Education Interpreter",
      role: "K–12 & Postsecondary",
    },
  ],
  logos = [],
}) => {
  return (
    <section id="testimonials" className="border-y border-slate-800 bg-slate-950/95 py-14 text-slate-50 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {quotes.map((q, i) => (
            <figure key={i} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <blockquote className="text-balance text-lg leading-relaxed text-slate-200">"{q.quote}"</blockquote>
              {(q.author || q.role) && (
                <figcaption className="mt-4 text-sm text-slate-400">
                  {q.author ? <span className="font-medium">{q.author}</span> : null}
                  {q.author && q.role ? <span className="mx-2 text-slate-700">•</span> : null}
                  {q.role ? <span>{q.role}</span> : null}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        {logos.length > 0 && (
          <div className="mt-10 border-t border-slate-800 pt-8">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              {logos.map((logo, idx) => (
                <img key={idx} src={logo.src} alt={logo.alt} className="h-8 w-auto opacity-70 grayscale hover:opacity-90" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
