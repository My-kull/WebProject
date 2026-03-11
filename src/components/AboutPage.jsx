const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 text-center">
          About Us
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 text-center max-w-2xl mx-auto mb-12">
          We're passionate about bringing fun, free browser-based games to
          everyone.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Our Mission
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              GameSite was built to celebrate the joy of gaming. We curate and
              host browser-based games so you can jump in and play instantly —
              no downloads, no installs, just fun.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-4">🛠️</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Built With
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              This site is powered by React, Tailwind CSS, and Vite. Our games
              leverage modern web technologies including HTML5 Canvas and
              WebAssembly to deliver smooth, native-like experiences.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Open & Free
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              All our games are completely free to play. We believe great gaming
              experiences should be accessible to everyone, anywhere, on any
              device with a browser.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Always Growing
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We're constantly adding new games and improving existing ones.
              Have a suggestion? We'd love to hear from you on our Contact page!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
