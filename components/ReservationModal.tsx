
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from './DataContext';
import { Modal } from './Modal';
import { Reservation, ReservationStatus, Guest, Payment, PaymentType, Consumption } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface ReservationModalProps {
    modalData: {
        reservation?: Reservation;
        date?: Date;
        roomId?: string;
    }
}

const formatDateForInput = (date: Date): string => date.toISOString().split('T')[0];

export const ReservationModal: React.FC<ReservationModalProps> = ({ modalData }) => {
    const { rooms, guests, companies, addReservation, updateReservation, deleteReservation, closeModal, addGuest, openModal } = useData();
    const { reservation, date, roomId } = modalData;
    
    const isEditMode = reservation != null;
    
    const getInitialState = (): Partial<Reservation> => {
        if (isEditMode) return { ...reservation };
        
        const room = rooms.find(r => r.id === roomId);
        return {
            roomId: roomId,
            guestId: '',
            companyId: undefined,
            startDate: date ? formatDateForInput(date) : '',
            endDate: date ? formatDateForInput(new Date(date!.getTime() + 86400000)) : '',
            status: 'reserved',
            adults: 1,
            children: 0,
            dailyRate: room?.price || 0,
            payments: [],
            advancePayment: { amount: 0, type: 'pix' as PaymentType },
            consumptions: [],
            observations: '',
        };
    };

    const [formData, setFormData] = useState(getInitialState);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [guestSearch, setGuestSearch] = useState('');

    useEffect(() => {
        const initialState = getInitialState();
        setFormData(initialState);
        if (isEditMode && initialState.guestId) {
            const guest = guests.find(g => g.id === initialState.guestId);
            setSelectedGuest(guest || null);
            setGuestSearch(guest?.name || '');
        } else {
            setSelectedGuest(null);
            setGuestSearch('');
        }
    }, [modalData, guests]);

    const guestSearchResults = useMemo(() => {
        if (!guestSearch || (selectedGuest && selectedGuest.name === guestSearch)) return [];
        return guests.filter(g =>
            g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
            g.cpf?.includes(guestSearch)
        );
    }, [guestSearch, guests, selectedGuest]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSelectGuest = (guest: Guest) => {
        setSelectedGuest(guest);
        setFormData(p => ({ ...p, guestId: guest.id }));
        setGuestSearch(guest.name);
    }
    
    const handleAddNewGuest = () => {
       const newGuest = addGuest({name: guestSearch, email: '', phone: ''});
       handleSelectGuest(newGuest);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.guestId) {
            alert('Por favor, selecione um hóspede.');
            return;
        }

        if (formData.status === 'checked-out_invoiced' && !formData.companyId) {
            alert('Para marcar uma reserva como "Faturado", é obrigatório selecionar uma empresa.');
            return;
        }
        
        const dataToSave = {
            ...formData,
            companyId: formData.companyId === '' ? undefined : formData.companyId
        }

        if (isEditMode) {
            updateReservation(dataToSave as Reservation);
        } else {
            addReservation(dataToSave as Omit<Reservation, 'id'>);
        }
        closeModal();
    };

    const handleDelete = () => {
        if (isEditMode) {
           openModal('confirmation', {
               message: 'Tem certeza que deseja excluir esta reserva?',
               onConfirm: () => {
                   deleteReservation(reservation!.id);
                   closeModal();
               }
           });
        }
    }
    
    const handleCheckout = () => {
        if (isEditMode) {
            openModal('checkout', { reservation });
        }
    }
    
    const handleConsumptionChange = (index: number, field: keyof Consumption, value: string | number) => {
        const updatedConsumptions = [...(formData.consumptions || [])];
        updatedConsumptions[index] = { ...updatedConsumptions[index], [field]: value };
        setFormData(p => ({...p, consumptions: updatedConsumptions}));
    }
    const addConsumption = () => setFormData(p => ({...p, consumptions: [...(p.consumptions || []), {id: `c${Date.now()}`, description: '', amount: 0}]}));
    const removeConsumption = (index: number) => setFormData(p => ({...p, consumptions: (p.consumptions || []).filter((_, i) => i !== index)}));
    
    const numberOfNights = useMemo(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }
        return 0;
    }, [formData.startDate, formData.endDate]);

    const totalAccommodation = useMemo(() => (formData.dailyRate || 0) * numberOfNights, [formData.dailyRate, numberOfNights]);
    const totalConsumptions = useMemo(() => (formData.consumptions || []).reduce((acc, c) => acc + Number(c.amount || 0), 0), [formData.consumptions]);
    const grandTotal = useMemo(() => totalAccommodation + totalConsumptions, [totalAccommodation, totalConsumptions]);


    return (
        <Modal isOpen={true} onClose={closeModal} title={isEditMode ? 'Editar Reserva' : 'Nova Reserva'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
                {/* Guest Search and Company */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label htmlFor="guestSearch" className="block text-sm font-medium text-gray-700">Hóspede</label>
                        <input id="guestSearch" value={guestSearch} onChange={e => setGuestSearch(e.target.value)} placeholder="Pesquisar por nome ou CPF" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        {guestSearchResults.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                                {guestSearchResults.map(g => <li key={g.id} onClick={() => handleSelectGuest(g)} className="p-2 hover:bg-indigo-100 cursor-pointer">{g.name} ({g.cpf})</li>)}
                                <li onClick={handleAddNewGuest} className="p-2 flex items-center text-indigo-600 hover:bg-indigo-100 cursor-pointer font-semibold"><PlusIcon className="w-4 h-4 mr-2"/>Adicionar novo hóspede: "{guestSearch}"</li>
                            </ul>
                        )}
                    </div>
                     <div>
                        <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">Empresa (Opcional)</label>
                        <select id="companyId" name="companyId" value={formData.companyId || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="">Nenhuma</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>


                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Check-in</label>
                        <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Check-out</label>
                        <input type="date" id="endDate" name="endDate" value={formData.endDate} min={formData.startDate} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                </div>

                {/* People and Rate */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="adults" className="block text-sm font-medium text-gray-700">Adultos</label>
                        <input type="number" id="adults" name="adults" value={formData.adults} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" min="1" />
                    </div>
                    <div>
                        <label htmlFor="children" className="block text-sm font-medium text-gray-700">Crianças</label>
                        <input type="number" id="children" name="children" value={formData.children} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" min="0" />
                    </div>
                    <div>
                        <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700">Diária (R$)</label>
                        <input type="number" id="dailyRate" name="dailyRate" value={formData.dailyRate} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>

                {/* Consumptions */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700">Consumos</h3>
                    <div className="space-y-2 mt-1">
                        {(formData.consumptions || []).map((con, index) => (
                            <div key={con.id || index} className="grid grid-cols-[1fr,auto,auto] gap-2 items-center">
                                <input type="text" placeholder="Descrição" value={con.description} onChange={e => handleConsumptionChange(index, 'description', e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm"/>
                                <input type="number" placeholder="Valor" value={con.amount} onChange={e => handleConsumptionChange(index, 'amount', Number(e.target.value))} className="block w-full border-gray-300 rounded-md shadow-sm"/>
                                <button type="button" onClick={() => removeConsumption(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addConsumption} className="mt-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 flex items-center"><PlusIcon className="w-4 h-4 mr-1"/>Adicionar Consumo</button>
                </div>

                {/* Summary */}
                <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between"><span>Hospedagem ({numberOfNights} noites):</span> <span className="font-semibold">R$ {totalAccommodation.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Consumos:</span> <span className="font-semibold">R$ {totalConsumptions.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Total:</span> <span>R$ {grandTotal.toFixed(2)}</span></div>
                </div>

                 {/* Status */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status da Reserva</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                        <option value="reserved">Reservado</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="occupied">Ocupado</option>
                        {isEditMode && <option value="checked-out">Checked-out</option>}
                        {isEditMode && <option value="checked-out_invoiced">Faturado</option>}
                        {isEditMode && <option value="checked-out_paid">Pago</option>}
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
                
                {/* Actions */}
                <div className="flex justify-between items-center pt-4">
                    <div>
                        {isEditMode && (
                             <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm">Excluir</button>
                        )}
                    </div>
                    <div className="flex space-x-2">
                         <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                         {isEditMode && formData.status === 'occupied' && (
                             <button type="button" onClick={handleCheckout} className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors shadow-sm">Check-out</button>
                         )}
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">{isEditMode ? 'Salvar' : 'Criar Reserva'}</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
