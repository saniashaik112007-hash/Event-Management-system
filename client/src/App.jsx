import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RoleSwitcherBanner from './components/RoleSwitcherBanner';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import GalleryPage from './pages/GalleryPage';
import RoleLoginPage from './pages/RoleLoginPage';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import JudgeDashboard from './pages/JudgeDashboard';
import LoginModal from './pages/LoginModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Default to 'portal' if not logged in, or 'dashboard' if logged in
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? 'dashboard' : 'portal';
  });

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPresetRole, setSelectedPresetRole] = useState(null);

  const handleUserSwitch = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setActiveTab('portal');
  };

  const handleRolePortalClick = (portalObj) => {
    setSelectedPresetRole(portalObj);
    setShowLoginModal(true);
  };

  const renderDashboard = () => {
    if (!currentUser) {
      return (
        <RoleLoginPage
          onSelectRoleLogin={handleRolePortalClick}
          onGuestBrowse={() => setActiveTab('home')}
        />
      );
    }

    switch (currentUser.role_name) {
      case 'Student':
        return (
          <StudentDashboard
            currentUser={currentUser}
            onNavigateEvents={() => setActiveTab('home')}
            onNavigateGallery={() => setActiveTab('gallery')}
          />
        );
      case 'Organizing Committee':
      case 'Student Organizer':
        return <OrganizerDashboard currentUser={currentUser} />;
      case 'Management':
      case 'Faculty Coordinator':
      case 'HOD/Admin':
      case 'Principal/Final Admin':
        return <ManagementDashboard currentUser={currentUser} />;
      case 'Judge':
        return <JudgeDashboard currentUser={currentUser} />;
      default:
        return (
          <StudentDashboard
            currentUser={currentUser}
            onNavigateEvents={() => setActiveTab('home')}
            onNavigateGallery={() => setActiveTab('gallery')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* 3-Role Simulator Bar */}
      <RoleSwitcherBanner
        currentUser={currentUser}
        onUserSwitch={handleUserSwitch}
      />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => {
          setSelectedPresetRole(null);
          setShowLoginModal(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'portal' && (
          <RoleLoginPage
            onSelectRoleLogin={handleRolePortalClick}
            onGuestBrowse={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'home' && (
          <Home
            onSelectEvent={(event) => {
              setSelectedEventId(event.id);
              setActiveTab('event-details');
            }}
            onNavigateGallery={() => setActiveTab('gallery')}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryPage currentUser={currentUser} />
        )}

        {activeTab === 'event-details' && (
          <EventDetails
            eventId={selectedEventId}
            onBack={() => setActiveTab('home')}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'dashboard' && renderDashboard()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span>CampusVibe - Role-Based Event Management Platform</span>
          </div>

          <p className="text-slate-500">
            Dedicated Portals: Student Dashboard | Organizing Committee Hub | Management Executive Panel
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          presetRole={selectedPresetRole}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
          }}
        />
      )}

    </div>
  );
}
