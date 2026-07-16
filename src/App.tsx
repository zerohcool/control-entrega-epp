import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavBar } from './components/NavBar';
import { SideNavBar } from './components/SideNavBar';
import { Login } from './pages/Login';
import { WorkerSearch } from './pages/WorkerSearch';
import { WorkerProfile } from './pages/WorkerProfile';
import { EPPCatalog } from './pages/EPPCatalog';
import { AdminDashboard } from './pages/AdminDashboard';
import { Reports } from './pages/Reports';

const AppContent: React.FC = () => {
  const { activeView, alert, user, isSubmittingRequest, submissionProgress } = useApp();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'login':
        return <Login />;
      case 'worker-search':
        return <WorkerSearch />;
      case 'worker-profile':
        return <WorkerProfile />;
      case 'catalog':
        return <EPPCatalog />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'reports':
        return <Reports />;
      default:
        return <Login />;
    }
  };

  const showSideNav = user?.role === 'admin' && activeView !== 'login';
  const showTopNav = activeView !== 'login';

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-md antialiased text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Navigation */}
      {showTopNav && <NavBar />}

      {/* Admin Sidebar Navigation */}
      {showSideNav && <SideNavBar />}

      {/* Main Content Viewport */}
      <main
        className={`flex-grow flex flex-col ${
          showSideNav ? 'md:ml-[260px] print:ml-0' : ''
        } ${showTopNav ? (user?.role === 'admin' && activeView !== 'catalog' ? 'pt-16 md:pt-0' : 'pt-16') : ''} transition-all duration-200 ease-in-out`}
      >
        {renderActiveView()}

        {/* Global Footer (shows unless login screen) */}
        {activeView !== 'login' && (
          <footer className="w-full py-4 px-margin-page flex flex-col items-center justify-center bg-surface-container-low border-t border-outline-variant mt-auto gap-1 text-center">
            <span className="font-body-sm text-body-sm text-on-surface-variant text-xs font-semibold">
              razecl web design Ⓡ
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant text-xs flex items-center justify-center gap-1.5 mt-0.5">
              Andres Alquinta Ayala
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                alt="WhatsApp"
                className="w-3.5 h-3.5 object-contain"
              />
              <a href="https://wa.me/56966735408" target="_blank" rel="noreferrer" className="hover:text-green-600 transition-colors font-mono-data font-bold">
                +56 9 6673 5408
              </a>
            </span>
          </footer>
        )}
      </main>

      {/* Toast Alert Banner */}
      {alert && (
        <div className="fixed top-4 right-4 z-50 animate-bounce max-w-sm w-full bg-white border border-outline-variant rounded-lg shadow-lg overflow-hidden flex items-center p-4">
          <div className="shrink-0 mr-3">
            {alert.type === 'success' && (
              <span className="material-symbols-outlined text-green-600 filled font-bold">check_circle</span>
            )}
            {alert.type === 'error' && (
              <span className="material-symbols-outlined text-red-600 filled font-bold">error</span>
            )}
            {alert.type === 'warning' && (
              <span className="material-symbols-outlined text-amber-600 filled font-bold">warning</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-on-surface uppercase tracking-wider">{alert.type}</p>
            <p className="text-sm text-on-surface-variant mt-0.5">{alert.message}</p>
          </div>
        </div>
      )}
      {/* Transaction Submission Loader Overlay */}
      {isSubmittingRequest && (
        <div id="loader_overlay">
          <div id="loader_container">
            <div id="bar_container">
              <div id="progress_bar" style={{ width: `${submissionProgress}%` }}>
                <div id="progress_percentage">
                  {submissionProgress}%
                </div>
              </div>
            </div>
            <div id="text_container">
              Enviando Solicitud
              <span>Por favor espere...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
export { App };
