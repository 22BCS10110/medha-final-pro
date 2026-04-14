import { Link } from 'react-router-dom';
import { Monitor, Download, Apple, ShieldCheck, ArrowLeft } from 'lucide-react';
import Layout from './layout/Layout';

/**
 * DesktopOnlyRedirect — shown when a browser user tries to access
 * desktop-only routes (admin, doctor, patient dashboards, NFC, etc).
 */
export default function DesktopOnlyRedirect() {
  return (
    <Layout>
      <section className="min-h-[80vh] flex items-center justify-center px-6 py-32">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Monitor size={36} className="text-primary" />
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight">
              Desktop App Required
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
              The admin panel, doctor dashboard, and patient management features
              are available exclusively in the Medha Desktop App.
            </p>
          </div>

          {/* Security note */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-100">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">
              Offline-first, encrypted, HIPAA-ready
            </span>
          </div>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#"
              className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
            >
              <Download size={20} />
              Download for Windows
            </a>
            <a
              href="#"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-slate-900 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
            >
              <Apple size={20} />
              Download for macOS
            </a>
          </div>

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Homepage
          </Link>
        </div>
      </section>
    </Layout>
  );
}
