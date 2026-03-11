import { useState } from "react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6 text-center">
          Contact Us
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 text-center max-w-2xl mx-auto mb-12">
          Got a question, feedback, or a game idea? Drop us a message!
        </p>

        <div className="grid gap-8 md:grid-cols-5">
          {/* Contact Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Email
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                hello@gamesite.dev
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Social
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                @gamesite on Twitter
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Location
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                The Internet, everywhere
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Thanks for reaching out!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  We'll get back to you as soon as we can.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", message: "" });
                  }}
                  className="mt-6 text-cyan-500 hover:text-cyan-400 font-medium transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors resize-none"
                    placeholder="What's on your mind?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
