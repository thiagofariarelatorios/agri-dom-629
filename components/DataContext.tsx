
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Room, Guest, Reservation, RoomStatus, ReservationStatus, ModalState, User, AppSettings, Payment, PaymentType, DailyReport, DailyTask, Company, CompanyPayment, AuditLog } from '../types';

// TODO: In a real application, you would initialize your Supabase client here.
// import { createClient } from '@supabase/supabase-js'
// const supabaseUrl = 'YOUR_SUPABASE_URL'
// const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
// const supabase = createClient(supabaseUrl, supabaseKey)

interface DataContextType {
  rooms: Room[];
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (room: Room) => void;
  deleteRoom: (roomId: string) => void;
  
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id'>) => Guest;
  updateGuest: (guest: Guest) => void;
  deleteGuest: (guestId: string) => void;

  companies: Company[];
  addCompany: (company: Omit<Company, 'id'>) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (companyId: string) => void;

  companyPayments: CompanyPayment[];
  addCompanyPayment: (payment: Omit<CompanyPayment, 'id'>) => void;
  updateCompanyPayment: (payment: CompanyPayment) => void;
  deleteCompanyPayment: (paymentId: string) => void;
  
  reservations: Reservation[];
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  updateReservation: (reservation: Reservation) => void;
  deleteReservation: (reservationId: string) => void;

  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  addUser: (user: Omit<User, 'id' | 'active'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;
  
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;

  dailyReports: DailyReport[];
  addOrUpdateReport: (date: string, reportText: string) => void;
  addTask: (date: string, taskText: string) => void;
  toggleTask: (date: string, taskId: string) => void;
  deleteTask: (date: string, taskId: string) => void;

  modalState: ModalState;
  openModal: (type: ModalState['type'], data?: ModalState['data']) => void;
  closeModal: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayString = yesterday.toISOString().split('T')[0];

const dayBeforeYesterday = new Date();
dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
const dayBeforeYesterdayString = dayBeforeYesterday.toISOString().split('T')[0];


const initialUsers: User[] = [
    { id: 'u1', username: 'admin', name: 'Admin Geral', email: 'admin@pousada.com', role: 'admin', active: true },
    { id: 'u2', username: 'recepcao', name: 'Recepção', email: 'recepcao@pousada.com', role: 'employee', active: true },
    { id: 'u3', username: 'limpeza', name: 'Equipe Limpeza', email: 'limpeza@pousada.com', role: 'limpeza', active: false },
];

const initialData = {
  rooms: [
    { id: 'r1', name: '101', type: 'Solteiro', status: 'Limpo' as RoomStatus, price: 150, capacity: 2 },
    { id: 'r2', name: '102', type: 'Solteiro', status: 'Limpo' as RoomStatus, price: 150, capacity: 2 },
    { id: 'r3', name: '103', type: 'Duplo', status: 'Sujo' as RoomStatus, price: 250, capacity: 4 },
    { id: 'r4', name: '104', type: 'Duplo', status: 'Manutenção' as RoomStatus, price: 250, capacity: 4 },
    { id: 'r5', name: '105', type: 'Suite', status: 'Limpo' as RoomStatus, price: 400, capacity: 4 },
    { id: 'r6', name: '201', type: 'Solteiro', status: 'Limpo' as RoomStatus, price: 160, capacity: 2 },
    { id: 'r7', name: '202', type: 'Duplo', status: 'Limpo' as RoomStatus, price: 260, capacity: 4 },
    { id: 'r8', name: '203', type: 'Suite', status: 'Limpo' as RoomStatus, price: 420, capacity: 5 },
  ],
  guests: [
    { id: 'g1', name: 'John Smith', email: 'john.smith@example.com', phone: '11 98765-4321', cpf: '111.222.333-44' },
    { id: 'g2', name: 'Sarah Davis', email: 'sarah.davis@example.com', phone: '21 91234-5678', cpf: '222.333.444-55' },
    { id: 'g3', name: 'Emily Johnson', email: 'emily.johnson@example.com', phone: '31 98888-7777', cpf: '333.444.555-66' },
    { id: 'g4', name: 'Michael Brown', email: 'michael.brown@example.com', phone: '41 99999-6666', cpf: '444.555.666-77' },
    { id: 'g5', name: 'Robert Wilson', email: 'robert.wilson@example.com', phone: '51 97777-8888', cpf: '555.666.777-88' },
    { id: 'g6', name: 'Funcionário da Construtora Alpha', email: 'contato@alpha.com', phone: '11 5555-1000', cpf: '---' },
  ],
  companies: [
      {id: 'comp1', name: 'Construtora Alpha', cnpj: '11.222.333/0001-44', email:'financeiro@alpha.com', phone: '11 5555-1000'},
      {id: 'comp2', name: 'Tech Solutions Inc.', cnpj: '44.555.666/0001-77', email:'contas@techsolutions.com', phone: '21 8888-2000'},
  ],
  companyPayments: [
      { id: 'cp1', companyId: 'comp1', amount: 400, date: '2025-07-01', paymentMethod: 'transfer' as PaymentType, notes: 'Adiantamento Fatura 07/2025' },
  ],
  reservations: [
    { id: 'res1', roomId: 'r1', guestId: 'g1', startDate: '2025-07-08', endDate: '2025-07-10', status: 'confirmed' as ReservationStatus, adults: 2, children: 0, dailyRate: 150, payments: [], advancePayment: { amount: 0, type: 'pix' as PaymentType }, consumptions: [] },
    { id: 'res2', roomId: 'r2', guestId: 'g2', startDate: '2025-07-10', endDate: '2025-07-12', status: 'confirmed' as ReservationStatus, adults: 1, children: 0, dailyRate: 150, payments: [], advancePayment: { amount: 0, type: 'pix' as PaymentType }, consumptions: [] },
    { id: 'res3', roomId: 'r3', guestId: 'g3', startDate: '2025-07-09', endDate: '2025-07-11', status: 'occupied' as ReservationStatus, adults: 2, children: 1, dailyRate: 250, payments: [], advancePayment: { amount: 250, type: 'credit' as PaymentType }, consumptions: [{id: 'c1', description: 'Frigobar', amount: 45}] },
    { id: 'res4', roomId: 'r5', guestId: 'g4', startDate: '2025-07-07', endDate: '2025-07-09', status: 'reserved' as ReservationStatus, adults: 2, children: 2, dailyRate: 400, payments: [], advancePayment: { amount: 0, type: 'pix' as PaymentType }, consumptions: [] },
    { id: 'res5', roomId: 'r7', guestId: 'g5', startDate: '2025-07-08', endDate: '2025-07-13', status: 'checked-out' as ReservationStatus, adults: 1, children: 0, dailyRate: 260, payments: [], advancePayment: { amount: 0, type: 'pix' as PaymentType }, consumptions: [] },
    { id: 'res6', roomId: 'r8', guestId: 'g6', companyId: 'comp1', startDate: '2025-06-25', endDate: '2025-06-28', status: 'checked-out_invoiced' as ReservationStatus, adults: 1, children: 0, dailyRate: 420, payments: [], advancePayment: { amount: 0, type: 'pix' as PaymentType }, consumptions: [{id: 'c2', description: 'Lavanderia', amount: 80}] },
  ],
  users: initialUsers,
  settings: {
      hotelName: 'Pousada da Baleia',
      address: 'Rua das Gaivotas, 123, Praia do Rosa, SC',
      phone: '(48) 99999-9999',
      email: 'contato@pousadadabaleia.com',
      checkInTime: '14:00',
      checkOutTime: '11:00',
  },
  dailyReports: [
      {
          id: 'dr1',
          date: yesterdayString,
          reportText: 'Dia tranquilo. Recebemos o Sr. e a Sra. Silva. O quarto 103 precisou de uma troca de lâmpada.',
          tasks: [
              { id: 't1', text: 'Verificar check-ins do dia', completed: true },
              { id: 't2', text: 'Confirmar reservas de amanhã', completed: true },
              { id: 't3', text: 'Repor estoque do frigobar', completed: false },
          ]
      },
      {
          id: 'dr2',
          date: dayBeforeYesterdayString,
          reportText: 'Check-out do grupo grande no quarto 203. Tudo ocorreu bem. Limpeza geral do quarto foi iniciada.',
          tasks: [
              { id: 't4', text: 'Processar check-out do quarto 203', completed: true },
              { id: 't5', text: 'Realizar fechamento do caixa', completed: true },
          ]
      }
  ]
};

const sortReports = (reports: DailyReport[]) => reports.sort((a, b) => b.date.localeCompare(a.date));

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(initialData.rooms);
  const [guests, setGuests] = useState<Guest[]>(initialData.guests);
  const [reservations, setReservations] = useState<Reservation[]>(initialData.reservations);
  const [companies, setCompanies] = useState<Company[]>(initialData.companies);
  const [companyPayments, setCompanyPayments] = useState<CompanyPayment[]>(initialData.companyPayments);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<AppSettings>(initialData.settings);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(sortReports(initialData.dailyReports));
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const addAuditLog = useCallback((action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      action,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  const openModal = useCallback((type: ModalState['type'], data?: ModalState['data']) => setModalState({ type, data }), []);
  const closeModal = useCallback(() => setModalState({ type: null, data: null }), []);

  // Room Functions
  const updateRoomStatus = useCallback((roomId: string, status: RoomStatus) => {
      const room = rooms.find(r => r.id === roomId);
      if (room && room.status !== status) {
        addAuditLog('Atualização de Quarto', `Status do quarto ${room.name} alterado para ${status}.`);
        setRooms(p => p.map(r => r.id === roomId ? { ...r, status } : r));
      }
  }, [rooms, addAuditLog]);
  const addRoom = useCallback((room: Omit<Room, 'id'>) => {
    const newRoom = { ...room, id: `r${Date.now()}` };
    addAuditLog('Criação de Quarto', `Quarto ${newRoom.name} adicionado.`);
    setRooms(p => [...p, newRoom]);
  }, [addAuditLog]);
  const updateRoom = useCallback((updatedRoom: Room) => {
    addAuditLog('Atualização de Quarto', `Dados do quarto ${updatedRoom.name} atualizados.`);
    setRooms(p => p.map(r => r.id === updatedRoom.id ? updatedRoom : r));
  }, [addAuditLog]);
  const deleteRoom = useCallback((roomId: string) => {
    if (reservations.some(res => res.roomId === roomId)) {
        alert('Não é possível excluir um quarto com reservas ativas.');
        return;
    }
    const room = rooms.find(r => r.id === roomId);
    addAuditLog('Exclusão de Quarto', `Quarto ${room?.name || roomId} excluído.`);
    setRooms(p => p.filter(r => r.id !== roomId))
  }, [reservations, addAuditLog, rooms]);

  // Guest Functions
  const addGuest = useCallback((guest: Omit<Guest, 'id'>): Guest => {
    const newGuest = { ...guest, id: `g${Date.now()}` };
    addAuditLog('Criação de Hóspede', `Hóspede ${newGuest.name} adicionado.`);
    setGuests(p => [...p, newGuest]);
    return newGuest;
  }, [addAuditLog]);
  const updateGuest = useCallback((updatedGuest: Guest) => {
    addAuditLog('Atualização de Hóspede', `Dados do hóspede ${updatedGuest.name} atualizados.`);
    setGuests(p => p.map(g => g.id === updatedGuest.id ? updatedGuest : g));
  }, [addAuditLog]);
  const deleteGuest = useCallback((guestId: string) => {
    if (reservations.some(res => res.guestId === guestId)) {
        alert('Não é possível excluir um hóspede com reservas ativas.');
        return;
    }
    const guest = guests.find(g => g.id === guestId);
    addAuditLog('Exclusão de Hóspede', `Hóspede ${guest?.name || guestId} excluído.`);
    setGuests(p => p.filter(g => g.id !== guestId));
  }, [reservations, addAuditLog, guests]);

  // Company Functions
  const addCompany = useCallback((company: Omit<Company, 'id'>) => {
    const newCompany = { ...company, id: `comp${Date.now()}` };
    addAuditLog('Criação de Empresa', `Empresa ${newCompany.name} adicionada.`);
    setCompanies(p => [...p, newCompany]);
  }, [addAuditLog]);
  const updateCompany = useCallback((updatedCompany: Company) => {
    addAuditLog('Atualização de Empresa', `Dados da empresa ${updatedCompany.name} atualizados.`);
    setCompanies(p => p.map(c => c.id === updatedCompany.id ? updatedCompany : c));
  }, [addAuditLog]);
  const deleteCompany = useCallback((companyId: string) => {
      if (reservations.some(res => res.companyId === companyId && res.status === 'checked-out_invoiced')) {
          alert('Não é possível excluir uma empresa com faturas pendentes.');
          return;
      }
      const company = companies.find(c => c.id === companyId);
      addAuditLog('Exclusão de Empresa', `Empresa ${company?.name || companyId} excluída.`);
      setCompanies(p => p.filter(c => c.id !== companyId));
  }, [reservations, addAuditLog, companies]);

  // Company Payment Functions
  const _updateReservationsStatusForCompany = useCallback((companyId: string, currentPayments: CompanyPayment[], currentReservations: Reservation[]) => {
      const companyReservations = currentReservations.filter(r => r.companyId === companyId);
      const companyInvoicedReservations = companyReservations.filter(r => ['checked-out_invoiced', 'checked-out_paid'].includes(r.status));
      if (companyInvoicedReservations.length === 0) return currentReservations;
      
      const totalDebt = companyInvoicedReservations.reduce((total, res) => {
          const start = new Date(res.startDate);
          const end = new Date(res.endDate);
          const nights = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          const accommodation = (res.dailyRate || 0) * nights;
          const consumption = (res.consumptions || []).reduce((acc, c) => acc + Number(c.amount || 0), 0);
          const paid = (res.payments || []).reduce((acc, p) => acc + p.amount, 0) + (res.advancePayment?.amount || 0);
          return total + (accommodation + consumption - paid);
      }, 0);

      const totalPaidByCompany = currentPayments.filter(p => p.companyId === companyId).reduce((acc, p) => acc + p.amount, 0);

      const isSettled = totalPaidByCompany >= totalDebt;
      const newStatus: ReservationStatus = isSettled ? 'checked-out_paid' : 'checked-out_invoiced';

      const invoicedIds = companyInvoicedReservations.map(r => r.id);
      return currentReservations.map(r => 
        invoicedIds.includes(r.id) ? { ...r, status: newStatus } : r
      );
  }, []);
  
  const addCompanyPayment = useCallback((payment: Omit<CompanyPayment, 'id'>) => {
      const newPayment = { ...payment, id: `cp${Date.now()}` };
      const company = companies.find(c => c.id === payment.companyId);
      addAuditLog('Pagamento de Empresa', `Pagamento de R$ ${payment.amount.toFixed(2)} registrado para ${company?.name}.`);
      setCompanyPayments(prevPayments => {
          const updatedPayments = [...prevPayments, newPayment];
          setReservations(prevRes => _updateReservationsStatusForCompany(payment.companyId, updatedPayments, prevRes));
          return updatedPayments;
      });
  }, [_updateReservationsStatusForCompany, addAuditLog, companies]);

  const updateCompanyPayment = useCallback((updatedPayment: CompanyPayment) => {
      addAuditLog('Atualização de Pagamento', `Pagamento ${updatedPayment.id} atualizado.`);
      setCompanyPayments(prevPayments => {
          const updatedPayments = prevPayments.map(p => p.id === updatedPayment.id ? updatedPayment : p);
          setReservations(prevRes => _updateReservationsStatusForCompany(updatedPayment.companyId, updatedPayments, prevRes));
          return updatedPayments;
      });
  }, [_updateReservationsStatusForCompany, addAuditLog]);

  const deleteCompanyPayment = useCallback((paymentId: string) => {
      addAuditLog('Exclusão de Pagamento', `Pagamento ${paymentId} excluído.`);
      setCompanyPayments(prevPayments => {
          const paymentToDelete = prevPayments.find(p => p.id === paymentId);
          if (!paymentToDelete) return prevPayments;

          const updatedPayments = prevPayments.filter(p => p.id !== paymentId);
          setReservations(prevRes => _updateReservationsStatusForCompany(paymentToDelete.companyId, updatedPayments, prevRes));
          return updatedPayments;
      });
  }, [_updateReservationsStatusForCompany, addAuditLog]);


  // Reservation Functions
  const addReservation = useCallback((res: Omit<Reservation, 'id'>) => {
    const guestName = guests.find(g => g.id === res.guestId)?.name || 'N/A';
    addAuditLog('Criação de Reserva', `Reserva criada para ${guestName} de ${res.startDate} a ${res.endDate}.`);
    setReservations(p => [...p, { ...res, id: `res${Date.now()}` }]);
  }, [addAuditLog, guests]);
  const updateReservation = useCallback((updatedRes: Reservation) => {
    const guestName = guests.find(g => g.id === updatedRes.guestId)?.name || 'N/A';
    addAuditLog('Atualização de Reserva', `Reserva de ${guestName} atualizada.`);
    setReservations(p => p.map(res => res.id === updatedRes.id ? updatedRes : res));
  }, [addAuditLog, guests]);
  const deleteReservation = useCallback((reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId);
    const guestName = guests.find(g => g.id === res?.guestId)?.name || 'N/A';
    addAuditLog('Exclusão de Reserva', `Reserva de ${guestName} (${reservationId}) excluída.`);
    setReservations(p => p.filter(res => res.id !== reservationId));
  }, [addAuditLog, reservations, guests]);

  // User Functions (Prepared for Supabase)
    useEffect(() => {
        const fetchUsers = async () => {
            // In a real app, you would fetch from Supabase
            // const { data, error } = await supabase.from('users').select('*');
            // if (error) console.error('Error fetching users:', error);
            // else setUsers(data || []);

            // For now, we use initial data for demonstration
            setUsers(initialData.users);
        };
        fetchUsers();
    }, []);

  const addUser = useCallback(async (user: Omit<User, 'id' | 'active'>) => {
    const newUser = { ...user, id: `u${Date.now()}`, active: true };
    
    // In a real app, you would call Supabase here.
    // const { error } = await supabase.from('users').insert([newUser]);
    // if (error) { console.error(error); return; }
    
    addAuditLog('Criação de Usuário', `Usuário ${newUser.username} (${newUser.role}) criado.`);
    setUsers(p => [...p, newUser]); // Optimistic update
  }, [addAuditLog]);

  const updateUser = useCallback(async (updatedUser: User) => {
    // In a real app, you would call Supabase here.
    // const { error } = await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
    // if (error) { console.error(error); return; }
      
    addAuditLog('Atualização de Usuário', `Dados do usuário ${updatedUser.username} atualizados.`);
    setUsers(p => p.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, [addAuditLog]);

  const deleteUser = useCallback(async (userId: string) => {
    // In a real app, you would call Supabase here.
    // const { error } = await supabase.from('users').delete().eq('id', userId);
    // if (error) { console.error(error); return; }

    const user = users.find(u => u.id === userId);
    addAuditLog('Exclusão de Usuário', `Usuário ${user?.username || userId} excluído.`);
    setUsers(p => p.filter(u => u.id !== userId));
  }, [addAuditLog, users]);

  const toggleUserStatus = useCallback(async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newStatus = !user.active;

    // In a real app, you would call Supabase here.
    // const { error } = await supabase.from('users').update({ active: newStatus }).eq('id', userId);
    // if (error) { console.error(error); return; }

    addAuditLog('Status de Usuário', `Usuário ${user.username} foi ${newStatus ? 'ativado' : 'desativado'}.`);
    setUsers(p => p.map(u => u.id === userId ? { ...u, active: newStatus } : u));
  }, [addAuditLog, users]);

  
  // Settings Functions
  const updateSettings = useCallback((newSettings: AppSettings) => {
    addAuditLog('Atualização de Configurações', `Configurações gerais do hotel foram atualizadas.`);
    setSettings(newSettings);
  }, [addAuditLog]);

  // Daily Report Functions
  const addOrUpdateReport = useCallback((date: string, reportText: string) => {
    setDailyReports(prev => {
        const existingReportIndex = prev.findIndex(r => r.date === date);
        const newReports = [...prev];
        if (existingReportIndex > -1) {
            newReports[existingReportIndex] = { ...newReports[existingReportIndex], reportText };
        } else {
            newReports.push({ id: `dr${Date.now()}`, date, reportText, tasks: [] });
        }
        return sortReports(newReports);
    });
  }, []);

  const modifyTasks = useCallback((date: string, taskUpdater: (tasks: DailyTask[]) => DailyTask[]) => {
      setDailyReports(prev => {
          const reportIndex = prev.findIndex(r => r.date === date);
          const newReports = [...prev];
          
          if (reportIndex > -1) {
              const updatedReport = { ...newReports[reportIndex] };
              updatedReport.tasks = taskUpdater(updatedReport.tasks);
              newReports[reportIndex] = updatedReport;
          } else {
              const newReport: DailyReport = {
                  id: `dr${Date.now()}`,
                  date: date,
                  reportText: '',
                  tasks: taskUpdater([])
              };
              newReports.push(newReport);
          }
          return sortReports(newReports);
      });
  }, []);

  const addTask = useCallback((date: string, taskText: string) => {
      if (!taskText.trim()) return;
      const newTask: DailyTask = { id: `t${Date.now()}`, text: taskText, completed: false };
      modifyTasks(date, tasks => [...tasks, newTask]);
  }, [modifyTasks]);

  const toggleTask = useCallback((date: string, taskId: string) => {
      modifyTasks(date, tasks => tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  }, [modifyTasks]);

  const deleteTask = useCallback((date: string, taskId: string) => {
      modifyTasks(date, tasks => tasks.filter(t => t.id !== taskId));
  }, [modifyTasks]);

  return (
    <DataContext.Provider value={{
      rooms, updateRoomStatus, addRoom, updateRoom, deleteRoom,
      guests, addGuest, updateGuest, deleteGuest,
      companies, addCompany, updateCompany, deleteCompany,
      companyPayments, addCompanyPayment, updateCompanyPayment, deleteCompanyPayment,
      reservations, addReservation, updateReservation, deleteReservation,
      users, currentUser, setCurrentUser, addUser, updateUser, deleteUser, toggleUserStatus,
      auditLogs, addAuditLog,
      settings, updateSettings,
      dailyReports, addOrUpdateReport, addTask, toggleTask, deleteTask,
      modalState, openModal, closeModal
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};