
import React, {useState, useEffect, useMemo, useCallback} from 'react';
import { useData } from './DataContext';
import { PencilIcon, TrashIcon, PlusIcon, ChevronDownIcon } from './icons';
import { Room, User, AppSettings, DailyTask, Company, Reservation, PaymentType, CompanyPayment, Guest, AuditLog } from '../types';

const PageTitle: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent mb-8">
        {children}
    </h1>
);

const AddButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button 
        onClick={onClick}
        className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
    >
        <PlusIcon className="w-5 h-5 mr-2" />
        {children}
    </button>
);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-lg ${className}`}>
        <h3 className="text-lg font-semibold text-gray-500 mb-4">{title}</h3>
        {children}
    </div>
);

const KpiCard: React.FC<{ title: string; value: string | number; description?: string; children?: React.ReactNode; }> = ({ title, value, description, children }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col justify-between">
        <div>
            <h3 className="text-md font-semibold text-gray-500 mb-2">{title}</h3>
            <p className="text-4xl font-bold text-indigo-700">{value}</p>
            {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        </div>
        {children && <div className="mt-4">{children}</div>}
    </div>
);


export const DashboardPage: React.FC = () => {
    const { rooms, reservations, guests } = useData();
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const dashboardData = useMemo(() => {
        // Occupancy
        const occupiedRoomIds = new Set(
            reservations
                .filter(r => r.startDate <= todayStr && r.endDate > todayStr && r.status !== 'cancelled' && r.status !== 'no_show')
                .map(r => r.roomId)
        );
        const occupancyRate = rooms.length > 0 ? (occupiedRoomIds.size / rooms.length) * 100 : 0;

        // Today's movements
        const checkInsToday = reservations.filter(r => r.startDate === todayStr && r.status !== 'cancelled' && r.status !== 'no_show');
        const checkOutsToday = reservations.filter(r => r.endDate === todayStr && r.status !== 'cancelled');

        // Room status
        const maintenanceRooms = rooms.filter(r => r.status === 'Manutenção').length;

        // Problematic bookings
        const problematicBookings = reservations.filter(r => r.startDate === todayStr && (r.status === 'cancelled' || r.status === 'no_show'));
        
        // Recent activity
        const latestReservations = [...reservations].sort((a,b) => b.id.localeCompare(a.id)).slice(0, 5);

        return {
            occupancyRate: occupancyRate.toFixed(1),
            checkInsCount: checkInsToday.length,
            checkOutsCount: checkOutsToday.length,
            availableRooms: rooms.length - occupiedRoomIds.size,
            occupiedRooms: occupiedRoomIds.size,
            maintenanceRooms,
            problematicBookingsCount: problematicBookings.length,
            latestReservations,
            checkInsToday,
            checkOutsToday,
        }

    }, [rooms, reservations, todayStr]);

    const getGuestName = (guestId: string) => guests.find(g => g.id === guestId)?.name || 'N/A';
    
    const ActivityList: React.FC<{title: string; items: Reservation[]}> = ({title, items}) => (
        <Card title={title}>
            {items.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">Nenhuma atividade hoje.</p>
            ) : (
                <ul className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map(res => (
                        <li key={res.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                            <div>
                                <p className="font-semibold text-gray-800">{getGuestName(res.guestId)}</p>
                                <p className="text-gray-500">Quarto {rooms.find(r=>r.id === res.roomId)?.name}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                res.status === 'confirmed' || res.status === 'confirmed_advance' ? 'bg-green-100 text-green-800' :
                                res.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>{res.status.replace(/_/g, ' ')}</span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <PageTitle>Dashboard</PageTitle>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Taxa de Ocupação" value={`${dashboardData.occupancyRate}%`}>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full" style={{ width: `${dashboardData.occupancyRate}%` }}></div>
                    </div>
                </KpiCard>
                <KpiCard title="Movimentações do Dia" value={`${dashboardData.checkInsCount} / ${dashboardData.checkOutsCount}`} description="Check-ins / Check-outs" />
                <KpiCard title="Quartos" value={dashboardData.availableRooms} description="Disponíveis">
                     <div className="flex justify-between text-xs text-gray-500">
                        <span>Ocupados: {dashboardData.occupiedRooms}</span>
                        <span>Manutenção: {dashboardData.maintenanceRooms}</span>
                    </div>
                </KpiCard>
                <KpiCard title="Problemas" value={dashboardData.problematicBookingsCount} description="Cancelados / No-show hoje" />
            </div>

            {/* Activity Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1">
                    <ActivityList title="Check-ins de Hoje" items={dashboardData.checkInsToday} />
                </div>
                <div className="lg:col-span-1">
                    <ActivityList title="Check-outs de Hoje" items={dashboardData.checkOutsToday} />
                </div>
                 <div className="lg:col-span-1">
                    <Card title="Últimas Reservas">
                        {dashboardData.latestReservations.length === 0 ? (
                             <p className="text-gray-500 text-sm py-8 text-center">Nenhuma reserva recente.</p>
                        ) : (
                            <ul className="space-y-3 max-h-60 overflow-y-auto">
                                {dashboardData.latestReservations.map(res => (
                                    <li key={res.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                        <div>
                                            <p className="font-semibold text-gray-800">{getGuestName(res.guestId)}</p>
                                            <p className="text-gray-500">{new Date(res.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(res.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                        </div>
                                         <span className="text-gray-500">Q. {rooms.find(r=>r.id === res.roomId)?.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export const GuestManagement: React.FC = () => {
    const { guests, openModal, deleteGuest } = useData();

    const handleAddNew = () => openModal('guest');
    const handleEdit = (guest: Guest) => openModal('guest', { guest });
    
    const handleDelete = (guest: Guest) => {
        openModal('confirmation', {
            message: `Tem certeza que deseja excluir o hóspede ${guest.name}? Esta ação não pode ser desfeita.`,
            onConfirm: () => deleteGuest(guest.id),
        });
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <PageTitle>Gerenciar Hóspedes</PageTitle>
                <AddButton onClick={handleAddNew}>Adicionar Hóspede</AddButton>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 rounded-l-lg">Nome</th>
                            <th className="py-3 px-6">Email</th>
                            <th className="py-3 px-6">Telefone</th>
                             <th className="py-3 px-6">CPF</th>
                            <th className="py-3 px-6 text-center rounded-r-lg">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm font-light">
                        {guests.map(guest => (
                            <tr key={guest.id} className="border-b border-gray-200 hover:bg-indigo-50 transition-colors">
                                <td className="py-4 px-6 font-medium">{guest.name}</td>
                                <td className="py-4 px-6">{guest.email}</td>
                                <td className="py-4 px-6">{guest.phone}</td>
                                <td className="py-4 px-6">{guest.cpf}</td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex item-center justify-center space-x-4">
                                        <button onClick={() => handleEdit(guest)} className="w-6 h-6 text-indigo-600 hover:text-indigo-800 transition-colors"><PencilIcon /></button>
                                        <button onClick={() => handleDelete(guest)} className="w-6 h-6 text-red-600 hover:text-red-800 transition-colors"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const RoomManagement: React.FC = () => {
    const { rooms, openModal, deleteRoom } = useData();

    const handleAddNew = () => openModal('room');
    const handleEdit = (room: Room) => openModal('room', { room });

    const handleDelete = (room: Room) => {
        openModal('confirmation', {
            message: `Tem certeza que deseja excluir o quarto ${room.name}?`,
            onConfirm: () => deleteRoom(room.id),
        });
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <PageTitle>Gerenciar Quartos</PageTitle>
                <AddButton onClick={handleAddNew}>Adicionar Quarto</AddButton>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 rounded-l-lg">Número</th>
                            <th className="py-3 px-6">Tipo</th>
                            <th className="py-3 px-6">Preço (R$)</th>
                             <th className="py-3 px-6">Capacidade</th>
                            <th className="py-3 px-6">Status</th>
                            <th className="py-3 px-6 text-center rounded-r-lg">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm font-light">
                        {rooms.map(room => (
                            <tr key={room.id} className="border-b border-gray-200 hover:bg-indigo-50 transition-colors">
                                <td className="py-4 px-6 font-medium">{room.name}</td>
                                <td className="py-4 px-6">{room.type}</td>
                                <td className="py-4 px-6">{room.price.toFixed(2)}</td>
                                <td className="py-4 px-6">{room.capacity}</td>
                                <td className="py-4 px-6">{room.status}</td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex item-center justify-center space-x-4">
                                        <button onClick={() => handleEdit(room)} className="w-6 h-6 text-indigo-600 hover:text-indigo-800 transition-colors"><PencilIcon /></button>
                                        <button onClick={() => handleDelete(room)} className="w-6 h-6 text-red-600 hover:text-red-800 transition-colors"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const UserManagement: React.FC = () => {
    const { users, openModal, deleteUser, toggleUserStatus, currentUser } = useData();
    
    const handleAddNew = () => openModal('user');
    const handleEdit = (user: User) => openModal('user', { user });

    const handleDelete = (user: User) => {
        if (user.id === currentUser.id) {
            alert("Você não pode excluir seu próprio usuário.");
            return;
        }
        openModal('confirmation', {
            message: `Tem certeza que deseja excluir o usuário ${user.name}?`,
            onConfirm: () => deleteUser(user.id),
        });
    }
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <PageTitle>Gerenciar Usuários</PageTitle>
                <AddButton onClick={handleAddNew}>Adicionar Usuário</AddButton>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 rounded-l-lg">Nome</th>
                            <th className="py-3 px-6">Email</th>
                            <th className="py-3 px-6">Username</th>
                            <th className="py-3 px-6">Cargo</th>
                            <th className="py-3 px-6 text-center">Status</th>
                            <th className="py-3 px-6 text-center rounded-r-lg">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm font-light">
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-200 hover:bg-indigo-50 transition-colors">
                                <td className="py-4 px-6 font-medium">{user.name}</td>
                                <td className="py-4 px-6">{user.email}</td>
                                <td className="py-4 px-6">{user.username}</td>
                                <td className="py-4 px-6 capitalize">{user.role}</td>
                                <td className="py-4 px-6 text-center">
                                    <button 
                                      onClick={() => toggleUserStatus(user.id)}
                                      disabled={user.id === currentUser.id}
                                      className={`px-3 py-1 text-xs font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${user.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                      title={user.id === currentUser.id ? "Não é possível alterar o próprio status" : (user.active ? "Clique para desativar" : "Clique para ativar")}
                                    >
                                        {user.active ? 'Ativo' : 'Inativo'}
                                    </button>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex item-center justify-center space-x-4">
                                        <button onClick={() => handleEdit(user)} className="w-6 h-6 text-indigo-600 hover:text-indigo-800 transition-colors"><PencilIcon /></button>
                                        <button onClick={() => handleDelete(user)} disabled={user.id === currentUser.id} className="w-6 h-6 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Settings: React.FC = () => {
    const { settings, updateSettings } = useData();
    const [formData, setFormData] = useState<AppSettings>(settings);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSave = () => {
        updateSettings(formData);
        alert('Configurações salvas com sucesso!');
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl animate-fade-in">
            <PageTitle>Configurações Gerais</PageTitle>
            <div className="max-w-2xl space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700">Nome do Hotel</label>
                        <input type="text" name="hotelName" id="hotelName" value={formData.hotelName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email de Contato</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="checkInTime" className="block text-sm font-medium text-gray-700">Horário Check-in</label>
                        <input type="time" name="checkInTime" id="checkInTime" value={formData.checkInTime} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="checkOutTime" className="block text-sm font-medium text-gray-700">Horário Check-out</label>
                        <input type="time" name="checkOutTime" id="checkOutTime" value={formData.checkOutTime} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                </div>

                <div className="pt-4">
                    <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md">Salvar Configurações</button>
                </div>
            </div>
        </div>
    );
};

export const DailyTasksPage: React.FC = () => {
    const { dailyReports, addOrUpdateReport, addTask, toggleTask, deleteTask, auditLogs } = useData();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTaskText, setNewTaskText] = useState('');
    const [historySearch, setHistorySearch] = useState('');
    const [showHistory, setShowHistory] = useState(true);

    const currentReport = useMemo(() => {
        return dailyReports.find(r => r.date === selectedDate) || {
            id: '', date: selectedDate, reportText: '', tasks: [] as DailyTask[]
        };
    }, [dailyReports, selectedDate]);

    const filteredHistory = useMemo(() => {
        return dailyReports
            .filter(r => r.date !== selectedDate)
            .filter(r => 
                historySearch === '' ||
                r.date.includes(historySearch) ||
                r.reportText.toLowerCase().includes(historySearch.toLowerCase()) ||
                r.tasks.some(t => t.text.toLowerCase().includes(historySearch.toLowerCase()))
            );
    }, [dailyReports, selectedDate, historySearch]);

    const handleReportChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        addOrUpdateReport(selectedDate, e.target.value);
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        addTask(selectedDate, newTaskText);
        setNewTaskText('');
    };
    
    const recentActivity = useMemo(() => auditLogs.slice(0, 10), [auditLogs]);


    return (
        <div className="space-y-8 animate-fade-in">
            <PageTitle>Tarefas Diárias e Atividades</PageTitle>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    <Card title="Relatório do Dia">
                         <div className="flex items-center space-x-4 mb-4">
                            <label htmlFor="report-date" className="font-semibold">Data:</label>
                            <input
                                type="date"
                                id="report-date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="p-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <textarea
                            value={currentReport.reportText}
                            onChange={handleReportChange}
                            placeholder="Escreva o relatório do dia aqui..."
                            rows={8}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </Card>
                     <Card title="Log de Atividades Recentes (Resumo de Turno)">
                         <ul className="space-y-2 text-sm text-gray-600 max-h-60 overflow-y-auto">
                            {recentActivity.map(log => (
                                <li key={log.id} className="border-b border-gray-100 pb-1">
                                    <span className="font-semibold text-indigo-700">{log.username}</span> {log.action.toLowerCase()}: <span className="text-gray-800">{log.details}</span>
                                    <span className="text-xs text-gray-400 block">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                {/* Task List */}
                <div className="lg:col-span-2">
                     <Card title="Checklist de Tarefas">
                        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={e => setNewTaskText(e.target.value)}
                                placeholder="Nova tarefa..."
                                className="flex-grow p-2 border border-gray-300 rounded-lg"
                            />
                            <button type="submit" className="bg-indigo-600 text-white px-4 rounded-lg font-semibold hover:bg-indigo-700">+</button>
                        </form>
                        <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {currentReport.tasks.map(task => (
                                <li key={task.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => toggleTask(selectedDate, task.id)}
                                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className={`ml-3 ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.text}</span>
                                    </div>
                                    <button onClick={() => deleteTask(selectedDate, task.id)} className="text-red-500 hover:text-red-700 opacity-50 hover:opacity-100">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                     </Card>
                </div>
            </div>
            
            {/* History Section */}
            <div>
                 <Card title="Histórico de Relatórios">
                    <div className="flex justify-between items-center mb-4">
                         <input
                            type="text"
                            placeholder="Buscar no histórico..."
                            value={historySearch}
                            onChange={e => setHistorySearch(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg w-1/3"
                        />
                         <button onClick={() => setShowHistory(!showHistory)} className="flex items-center text-indigo-600 font-semibold">
                           {showHistory ? 'Ocultar' : 'Mostrar'} Histórico
                           <ChevronDownIcon className={`w-5 h-5 ml-1 transform transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {showHistory && (
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            {filteredHistory.map(report => (
                                <div key={report.id} className="p-4 bg-gray-50/70 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold text-lg mb-2">{new Date(report.date + 'T00:00:00Z').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                                    <p className="whitespace-pre-wrap mb-3">{report.reportText || 'Nenhum relatório escrito.'}</p>
                                    {report.tasks.length > 0 && (
                                        <>
                                            <h5 className="font-semibold text-sm mb-1">Tarefas:</h5>
                                            <ul className="list-disc list-inside text-sm">
                                                {report.tasks.map(task => (
                                                    <li key={task.id} className={task.completed ? 'line-through text-gray-500' : ''}>{task.text}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                 </Card>
            </div>
        </div>
    );
};

export const CompaniesManagement: React.FC = () => {
    const { companies, reservations, companyPayments, openModal, deleteCompany, deleteCompanyPayment } = useData();
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [historySearch, setHistorySearch] = useState('');
    const [showHistory, setShowHistory] = useState(true);

    const companyData = useMemo(() => {
        if (!selectedCompanyId) return null;
        const company = companies.find(c => c.id === selectedCompanyId);
        if (!company) return null;

        const companyReservations = reservations.filter(r => r.companyId === company.id && r.status === 'checked-out_invoiced' || r.status === 'checked-out_paid');
        const payments = companyPayments.filter(p => p.companyId === company.id);
        
        const totalDebt = companyReservations.reduce((total, res) => {
          const start = new Date(res.startDate);
          const end = new Date(res.endDate);
          const nights = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          const accommodation = (res.dailyRate || 0) * nights;
          const consumption = (res.consumptions || []).reduce((acc, c) => acc + Number(c.amount || 0), 0);
          const paid = (res.payments || []).reduce((acc, p) => acc + p.amount, 0) + (res.advancePayment?.amount || 0);
          return total + (accommodation + consumption - paid);
        }, 0);

        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        const balance = totalDebt - totalPaid;

        return { company, reservations: companyReservations, payments, totalDebt, totalPaid, balance };
    }, [selectedCompanyId, companies, reservations, companyPayments]);

    const filteredPayments = useMemo(() => {
        if (!companyData) return [];
        return companyData.payments.filter(p => 
            p.date.includes(historySearch) ||
            p.amount.toString().includes(historySearch) ||
            p.paymentMethod.toLowerCase().includes(historySearch.toLowerCase()) ||
            p.notes?.toLowerCase().includes(historySearch.toLowerCase())
        ).sort((a,b) => b.date.localeCompare(a.date));
    }, [companyData, historySearch]);


    const handleAddCompany = () => openModal('company');
    const handleEditCompany = (company: Company) => openModal('company', { company });
    const handleDeleteCompany = (company: Company) => {
        openModal('confirmation', {
            message: `Tem certeza que deseja excluir a empresa ${company.name}?`,
            onConfirm: () => {
                if(selectedCompanyId === company.id) setSelectedCompanyId(null);
                deleteCompany(company.id)
            },
        });
    };
    
    const handleAddPayment = () => {
        if (!selectedCompanyId) return;
        openModal('company_payment', { companyId: selectedCompanyId });
    }

    const handleEditPayment = (payment: CompanyPayment) => openModal('company_payment', { payment });

    const handleDeletePayment = (payment: CompanyPayment) => {
         openModal('confirmation', {
            message: `Tem certeza que deseja excluir este pagamento de R$ ${payment.amount.toFixed(2)}?`,
            onConfirm: () => deleteCompanyPayment(payment.id),
        });
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <PageTitle>Gerenciar Empresas</PageTitle>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card title="Empresas Cadastradas">
                        <AddButton onClick={handleAddCompany}>Adicionar Empresa</AddButton>
                        <ul className="mt-4 space-y-2">
                           {companies.map(c => (
                               <li key={c.id} onClick={() => setSelectedCompanyId(c.id)}
                                   className={`p-3 rounded-lg cursor-pointer transition-all ${selectedCompanyId === c.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 hover:bg-indigo-100'}`}>
                                   <div className="flex justify-between items-center">
                                       <span className="font-semibold">{c.name}</span>
                                       <div>
                                           <button onClick={(e) => { e.stopPropagation(); handleEditCompany(c); }} className={`w-5 h-5 mr-2 ${selectedCompanyId === c.id ? 'text-indigo-200 hover:text-white' : 'text-gray-500 hover:text-indigo-600'}`}><PencilIcon/></button>
                                           <button onClick={(e) => { e.stopPropagation(); handleDeleteCompany(c); }} className={`w-5 h-5 ${selectedCompanyId === c.id ? 'text-indigo-200 hover:text-white' : 'text-gray-500 hover:text-red-600'}`}><TrashIcon/></button>
                                       </div>
                                   </div>
                               </li>
                           ))}
                        </ul>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    {companyData ? (
                        <div className="space-y-6">
                            <Card title={`Detalhes de ${companyData.company.name}`}>
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                    <p><strong>CNPJ:</strong> {companyData.company.cnpj}</p>
                                    <p><strong>Email:</strong> {companyData.company.email}</p>
                                    <p><strong>Telefone:</strong> {companyData.company.phone}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-red-50 rounded-lg"><div className="text-xl font-bold">R$ {companyData.totalDebt.toFixed(2)}</div><div className="text-sm text-red-700">Total Faturado</div></div>
                                    <div className="p-3 bg-green-50 rounded-lg"><div className="text-xl font-bold">R$ {companyData.totalPaid.toFixed(2)}</div><div className="text-sm text-green-700">Total Pago</div></div>
                                    <div className="p-3 bg-blue-50 rounded-lg"><div className="text-xl font-bold">R$ {companyData.balance.toFixed(2)}</div><div className="text-sm text-blue-700">Saldo Devedor</div></div>
                                </div>
                            </Card>

                            <Card title="Pagamentos">
                                <AddButton onClick={handleAddPayment}>Adicionar Pagamento</AddButton>
                                <div className="flex justify-between items-center my-4">
                                    <input
                                        type="text"
                                        placeholder="Buscar pagamento..."
                                        value={historySearch}
                                        onChange={e => setHistorySearch(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-lg w-1/2"
                                    />
                                     <button onClick={() => setShowHistory(!showHistory)} className="flex items-center text-indigo-600 font-semibold">
                                        {showHistory ? 'Ocultar' : 'Mostrar'} Histórico
                                        <ChevronDownIcon className={`w-5 h-5 ml-1 transform transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {showHistory && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left table-auto">
                                             <thead>
                                                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                                    <th className="py-3 px-4">Data</th>
                                                    <th className="py-3 px-4">Valor</th>
                                                    <th className="py-3 px-4">Forma</th>
                                                    <th className="py-3 px-4">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-700 text-sm">
                                                {filteredPayments.map(p => (
                                                    <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                        <td className="py-3 px-4">{new Date(p.date+'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                                        <td className="py-3 px-4">R$ {p.amount.toFixed(2)}</td>
                                                        <td className="py-3 px-4">{p.paymentMethod}</td>
                                                        <td className="py-3 px-4">
                                                            <button onClick={() => handleEditPayment(p)} className="text-indigo-600 mr-2"><PencilIcon className="w-4 h-4"/></button>
                                                            <button onClick={() => handleDeletePayment(p)} className="text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        </div>
                    ) : (
                        <Card title="Nenhuma empresa selecionada">
                           <p className="text-center text-gray-500 py-10">Selecione uma empresa na lista para ver os detalhes.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
};

export const FinancialManagement: React.FC = () => {
    const { reservations, guests, companies, companyPayments } = useData();
    const [filterPeriod, setFilterPeriod] = useState('this_month');
    const [searchTerm, setSearchTerm] = useState('');

    const getReservationTotal = (res: Reservation) => {
        const start = new Date(res.startDate);
        const end = new Date(res.endDate);
        const nights = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const accommodation = (res.dailyRate || 0) * nights;
        const consumption = (res.consumptions || []).reduce((acc, c) => acc + Number(c.amount || 0), 0);
        return accommodation + consumption;
    };

    interface Transaction {
        id: string;
        date: string;
        description: string;
        amount: number;
        method: PaymentType;
        clientType: 'company' | 'individual';
    }

    const financialData = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

        let allTransactions: Transaction[] = [];
        reservations.forEach(res => {
            const guestName = guests.find(g => g.id === res.guestId)?.name || 'N/A';
            if (res.advancePayment && res.advancePayment.amount > 0) {
                allTransactions.push({
                    id: `${res.id}-adv`,
                    date: res.startDate,
                    description: `Adiantamento - ${guestName}`,
                    amount: res.advancePayment.amount,
                    method: res.advancePayment.type,
                    clientType: res.companyId ? 'company' : 'individual',
                });
            }
            res.payments.forEach((p, i) => {
                 allTransactions.push({
                    id: `${res.id}-pay${i}`,
                    date: res.endDate,
                    description: `Pagamento Check-out - ${guestName}`,
                    amount: p.amount,
                    method: p.type,
                    clientType: res.companyId ? 'company' : 'individual',
                });
            });
        });
        companyPayments.forEach(p => {
             const companyName = companies.find(c => c.id === p.companyId)?.name || 'N/A';
             allTransactions.push({
                id: p.id,
                date: p.date,
                description: `Pagamento Fatura - ${companyName}`,
                amount: p.amount,
                method: p.paymentMethod,
                clientType: 'company',
            });
        });

        const filteredByDate = allTransactions.filter(t => {
            const tDate = new Date(t.date + 'T00:00:00');
            if (filterPeriod === 'all') return true;
            if (filterPeriod === 'this_month') return tDate >= firstDayOfMonth;
            if (filterPeriod === 'last_7_days') return tDate >= sevenDaysAgo;
            return false;
        });
        
        const totalRevenue = filteredByDate.reduce((acc, t) => acc + t.amount, 0);
        const revenueByMethod = filteredByDate.reduce((acc, t) => {
            acc[t.method] = (acc[t.method] || 0) + t.amount;
            return acc;
        }, {} as Record<PaymentType, number>);
        const revenueByClientType = filteredByDate.reduce((acc, t) => {
            acc[t.clientType] = (acc[t.clientType] || 0) + t.amount;
            return acc;
        }, { individual: 0, company: 0 });

        const pendingInvoices = reservations.filter(r => r.status === 'checked-out_invoiced');
        const totalPending = pendingInvoices.reduce((acc, res) => {
            const company = companies.find(c => c.id === res.companyId);
            if (!company) return acc;
            const companyReservations = reservations.filter(r => r.companyId === company.id && ['checked-out_invoiced', 'checked-out_paid'].includes(r.status));
            const totalDebt = companyReservations.reduce((total, r) => total + getReservationTotal(r), 0);
            const totalPaid = companyPayments.filter(p => p.companyId === company.id).reduce((sum, p) => sum + p.amount, 0);
            return acc + (totalDebt-totalPaid);
        },0);


        const finalTransactionHistory = filteredByDate.filter(t => 
            searchTerm === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


        return {
            totalRevenue,
            totalPending: Math.max(0, totalPending),
            revenueByMethod,
            revenueByClientType,
            pendingInvoices,
            transactionHistory: finalTransactionHistory
        };
    }, [reservations, guests, companies, companyPayments, filterPeriod, searchTerm]);

    const FilterButton: React.FC<{period: string; label: string}> = ({ period, label }) => (
        <button
            onClick={() => setFilterPeriod(period)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterPeriod === period ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`}
        >{label}</button>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <PageTitle>Gestão Financeira</PageTitle>

            <div className="flex space-x-2">
                <FilterButton period="this_month" label="Este Mês" />
                <FilterButton period="last_7_days" label="Últimos 7 Dias" />
                <FilterButton period="all" label="Tudo" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Receita Total">
                    <p className="text-4xl font-bold text-green-600">R$ {financialData.totalRevenue.toFixed(2)}</p>
                </Card>
                 <Card title="Saldo Pendente">
                    <p className="text-4xl font-bold text-red-600">R$ {financialData.totalPending.toFixed(2)}</p>
                </Card>
                 <Card title="Receita por Cliente">
                     <div className="text-lg space-y-1">
                        <p><strong>Individual:</strong> R$ {financialData.revenueByClientType.individual.toFixed(2)}</p>
                        <p><strong>Empresa:</strong> R$ {financialData.revenueByClientType.company.toFixed(2)}</p>
                     </div>
                </Card>
                 <Card title="Receita por Pagamento">
                     <div className="text-sm space-y-1 capitalize">
                         {Object.entries(financialData.revenueByMethod).map(([method, amount]) => (
                            <p key={method}><strong>{method}:</strong> R$ {(amount as number).toFixed(2)}</p>
                         ))}
                     </div>
                </Card>
            </div>
            
            <Card title="Reservas com Saldo Pendente">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                                <th className="py-2 px-4">Hóspede</th>
                                <th className="py-2 px-4">Empresa</th>
                                <th className="py-2 px-4">Período</th>
                                <th className="py-2 px-4">Valor Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {financialData.pendingInvoices.map(res => {
                                const guest = guests.find(g => g.id === res.guestId);
                                const company = companies.find(c => c.id === res.companyId);
                                return (
                                    <tr key={res.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-2 px-4">{guest?.name}</td>
                                        <td className="py-2 px-4">{company?.name}</td>
                                        <td className="py-2 px-4">{new Date(res.startDate+'T00:00').toLocaleDateString('pt-BR')} - {new Date(res.endDate+'T00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="py-2 px-4">R$ {getReservationTotal(res).toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card title="Histórico de Transações">
                <input
                    type="text"
                    placeholder="Buscar transação..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-full md:w-1/3 mb-4"
                />
                 <div className="overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 uppercase text-sm sticky top-0">
                                <th className="py-2 px-4">Data</th>
                                <th className="py-2 px-4">Descrição</th>
                                <th className="py-2 px-4">Forma</th>
                                <th className="py-2 px-4 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                             {financialData.transactionHistory.map(t => (
                                <tr key={t.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-2 px-4 whitespace-nowrap">{new Date(t.date+'T00:00').toLocaleDateString('pt-BR')}</td>
                                    <td className="py-2 px-4">{t.description}</td>
                                    <td className="py-2 px-4 capitalize">{t.method}</td>
                                    <td className="py-2 px-4 text-right font-semibold">R$ {t.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
};

export const AuditLogPage: React.FC = () => {
    const { auditLogs } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = useMemo(() => {
        return auditLogs.filter(log => 
            log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [auditLogs, searchTerm]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <PageTitle>Log de Atividades</PageTitle>
                <input
                    type="text"
                    placeholder="Buscar nos logs..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-full md:w-1/3"
                />
            </div>
            <div className="overflow-x-auto max-h-[75vh]">
                <table className="w-full text-left table-auto">
                    <thead className="sticky top-0">
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 rounded-l-lg">Data/Hora</th>
                            <th className="py-3 px-6">Usuário</th>
                            <th className="py-3 px-6">Ação</th>
                            <th className="py-3 px-6 rounded-r-lg">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 text-sm font-light">
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="border-b border-gray-200 hover:bg-indigo-50 transition-colors">
                                <td className="py-4 px-6 font-medium whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                                <td className="py-4 px-6">{log.username}</td>
                                <td className="py-4 px-6 font-semibold">{log.action}</td>
                                <td className="py-4 px-6">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};