
import React from 'react';
import { Page, User } from '../types';
import { WhaleIcon, MenuIcon, CalendarIcon, UsersIcon, BedIcon, UserCircleIcon, CogIcon, DocumentTextIcon, BuildingOfficeIcon, CurrencyDollarIcon, ChartPieIcon } from './icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  currentUser: User;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; isCollapsed: boolean; }> = ({ icon, label, isActive, onClick, isCollapsed }) => (
  <li>
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`group flex items-center p-3 my-1 rounded-lg transition-all duration-300 border-l-4 ${
        isActive ? 'bg-white/95 text-indigo-800 shadow-lg border-indigo-400' : 'border-transparent text-indigo-100 hover:bg-white/10 hover:shadow-md'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : ''}
    >
      {icon}
      <span className={`ml-3 font-semibold transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isCollapsed, toggleCollapse, currentUser }) => {
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartPieIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin', 'employee', 'limpeza'] },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin', 'employee', 'limpeza'] },
    { id: 'hospedes', label: 'Hóspedes', icon: <UsersIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin', 'employee'] },
    { id: 'empresas', label: 'Empresas', icon: <BuildingOfficeIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin', 'employee'] },
    { id: 'quartos', label: 'Quartos', icon: <BedIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin', 'employee', 'limpeza'] },
    { id: 'daily_tasks', label: 'Tarefas Diárias', icon: <DocumentTextIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin', 'employee', 'limpeza'] },
    { id: 'financeiro', label: 'Gestão Financeira', icon: <CurrencyDollarIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin'] },
    { id: 'usuarios', label: 'Usuários', icon: <UserCircleIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin'] },
    { id: 'audit_log', label: 'Log de Atividades', icon: <DocumentTextIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin'] },
    { id: 'configuracoes', label: 'Configurações', icon: <CogIcon className="w-6 h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />, roles: ['admin'] },
  ];
  
  const navItems = allNavItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className={`bg-gradient-to-b from-indigo-800 to-purple-700 text-white flex flex-col h-full flex-shrink-0 shadow-2xl transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`h-20 flex items-center border-b border-white/10 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
        <div className={`flex items-center overflow-hidden ${isCollapsed ? 'hidden' : ''}`}>
            <WhaleIcon className="w-12 h-12 text-white flex-shrink-0 -ml-1"/>
            <span className="ml-2 text-xl font-bold whitespace-wrap">Pousada da Baleia</span>
        </div>
        <button onClick={toggleCollapse} className="text-indigo-200 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <MenuIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 p-2">
        <ul>
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentPage === item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
};
