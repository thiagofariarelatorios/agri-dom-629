
import React, { useState } from 'react';
import { Page, User } from './types';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { DashboardPage, GuestManagement, RoomManagement, UserManagement, Settings, DailyTasksPage, CompaniesManagement, FinancialManagement, AuditLogPage } from './components/ManagementPages';
import { useData } from './components/DataContext';
import { ReservationModal } from './components/ReservationModal';
import { GuestModal } from './components/GuestModal';
import { RoomModal } from './components/RoomModal';
import { UserModal } from './components/UserModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { CompanyModal } from './components/CompanyModal';
import { CompanyPaymentModal } from './components/CompanyPaymentModal';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { modalState, users, currentUser, setCurrentUser } = useData();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSetPage = (page: Page) => {
    // Prevent non-admins from accessing admin pages
    const adminPages: Page[] = ['financeiro', 'usuarios', 'configuracoes', 'audit_log'];
    if (adminPages.includes(page) && currentUser.role !== 'admin') {
      setCurrentPage('dashboard'); // Default to a safe page
    } else {
      setCurrentPage(page);
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'calendar': return <CalendarView />;
      case 'hospedes': return <GuestManagement />;
      case 'empresas': return <CompaniesManagement />;
      case 'financeiro': return <FinancialManagement />;
      case 'quartos': return <RoomManagement />;
      case 'usuarios': return <UserManagement />;
      case 'configuracoes': return <Settings />;
      case 'daily_tasks': return <DailyTasksPage />;
      case 'audit_log': return <AuditLogPage />;
      default: return <DashboardPage />;
    }
  };

  const renderModal = () => {
    if (!modalState.type) return null;
    switch (modalState.type) {
      case 'reservation': return <ReservationModal modalData={modalState.data || {}} />;
      case 'guest': return <GuestModal modalData={modalState.data || {}} />;
      case 'room': return <RoomModal modalData={modalState.data || {}} />;
      case 'user': return <UserModal modalData={modalState.data || {}} />;
      case 'checkout': return <CheckoutModal modalData={modalState.data} />;
      case 'confirmation': return <ConfirmationModal modalData={modalState.data} />;
      case 'company': return <CompanyModal modalData={modalState.data || {}} />;
      case 'company_payment': return <CompanyPaymentModal modalData={modalState.data || {}} />;
      default: return null;
    }
  };

  const handleUserSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedUser = users.find(u => u.id === e.target.value);
      if(selectedUser) {
          setCurrentUser(selectedUser);
          // If the current page is not allowed for the new user, switch to a default page
          const adminPages: Page[] = ['financeiro', 'usuarios', 'configuracoes', 'audit_log'];
          if (adminPages.includes(currentPage) && selectedUser.role !== 'admin') {
            setCurrentPage('dashboard');
          }
      }
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50 text-gray-800 antialiased">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={handleSetPage} 
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
          currentUser={currentUser}
        />
        <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto">
            {/* User Switcher for Demo */}
            <div className="flex justify-end mb-4">
                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow">
                    <label htmlFor="user-switcher" className="text-sm font-semibold text-gray-600">Usuário Logado:</label>
                    <select
                        id="user-switcher"
                        value={currentUser.id}
                        onChange={handleUserSwitch}
                        className="p-1 border border-gray-300 rounded-md text-sm"
                    >
                        {users.filter(u => u.active).map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
             {renderPage()}
            </div>
        </main>
      </div>
      {renderModal()}
    </>
  );
};

export default App;