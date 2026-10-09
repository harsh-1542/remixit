import React from 'react';
import { RouterProvider, useRouter } from './lib/router';
import { AuthProvider } from './lib/auth-context';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { WebsiteDetailPage } from './pages/WebsiteDetailPage';
import { BuildPage } from './pages/BuildPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { GeneratePage } from './pages/GeneratePage';
import { EditorPage } from './pages/EditorPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PublishedSitePage } from './pages/PublishedSitePage';

const AppContent: React.FC = () => {
  const { path } = useRouter();

  // Fullscreen Visual Builder Workspace
  if (path.startsWith('/editor/')) {
    const projectId = path.replace('/editor/', '').split('/')[0];
    return <EditorPage projectId={projectId} />;
  }

  // Fullscreen Published Website Showcase & Simulator
  if (path.startsWith('/p/')) {
    const deploymentId = path.replace('/p/', '').split('/')[0];
    return <PublishedSitePage deploymentId={deploymentId} />;
  }

  if (path.startsWith('/preview/')) {
    const deploymentId = path.replace('/preview/', '').split('/')[0];
    return <PublishedSitePage deploymentId={deploymentId} />;
  }

  const renderRoute = () => {
    // Route: /
    if (path === '/' || path === '') {
      return <HomePage />;
    }

    // Route: /explore
    if (path === '/explore') {
      return <ExplorePage />;
    }

    // Route: /build
    if (path === '/build') {
      return <BuildPage />;
    }

    // Route: /dashboard or /projects
    if (path === '/dashboard' || path === '/projects') {
      return <DashboardPage />;
    }

    // Route: /login
    if (path === '/login') {
      return <LoginPage />;
    }

    // Route: /signup
    if (path === '/signup') {
      return <SignupPage />;
    }

    // Route: /forgot-password
    if (path === '/forgot-password') {
      return <ForgotPasswordPage />;
    }

    // Route: /analyze/:jobId
    if (path.startsWith('/analyze/')) {
      const jobId = path.replace('/analyze/', '').split('/')[0];
      return <AnalysisPage jobId={jobId} />;
    }

    // Route: /generate/:jobId
    if (path.startsWith('/generate/')) {
      const jobId = path.replace('/generate/', '').split('/')[0];
      return <GeneratePage jobId={jobId} />;
    }

    // Route: /website/:slug
    if (path.startsWith('/website/')) {
      const slug = path.replace('/website/', '').split('/')[0];
      return <WebsiteDetailPage slug={slug} />;
    }

    // Fallback default: HomePage
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#121212] font-sans">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        {renderRoute()}
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
