
import React, { useState, useMemo } from 'react';
import { useData } from './DataContext';
import { Modal } from './Modal';
import { Reservation, PaymentType, Company } from '../types';

interface CheckoutModalProps {
    modalData: {
        reservation: Reservation;
    }
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ modalData }) => {
    const { guests, companies, updateReservation, closeModal, openModal, addAuditLog } = useData();
    const { reservation } = modalData;
    
    const [payment, setPayment] = useState({ amount: 0, type: 'money' as PaymentType });
    const [billToCompany, setBillToCompany] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(reservation.companyId || (companies.length > 0 ? companies[0].id : ''));

    const guest = useMemo(() => guests.find(g => g.id === reservation.guestId), [guests, reservation]);

    const numberOfNights = useMemo(() => {
        const start = new Date(reservation.startDate);
        const end = new Date(reservation.endDate);
        return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }, [reservation.startDate, reservation.endDate]);
    
    const totalAccommodation = useMemo(() => reservation.dailyRate * numberOfNights, [reservation.dailyRate, numberOfNights]);
    const totalConsumptions = useMemo(() => reservation.consumptions.reduce((acc, c) => acc + c.amount, 0), [reservation.consumptions]);
    const totalPaid = useMemo(() => reservation.payments.reduce((acc, p) => acc + p.amount, 0) + (reservation.advancePayment?.amount || 0), [reservation.payments, reservation.advancePayment]);
    const grandTotal = useMemo(() => totalAccommodation + totalConsumptions, [totalAccommodation, totalConsumptions]);
    const amountDue = useMemo(() => grandTotal - totalPaid, [grandTotal, totalPaid]);
    const remainingDue = useMemo(() => amountDue - payment.amount, [amountDue, payment.amount]);

    useState(() => {
        setPayment(p => ({...p, amount: Math.max(0, amountDue)}));
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPayment(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const updatedReservation = { ...reservation };
        
        if (payment.amount > 0) {
            updatedReservation.payments = [...updatedReservation.payments, payment];
        }

        if (billToCompany) {
            if (!selectedCompanyId) {
                alert("Por favor, selecione uma empresa para faturar.");
                return;
            }
            updatedReservation.status = 'checked-out_invoiced';
            updatedReservation.companyId = selectedCompanyId;
            const companyName = companies.find(c => c.id === selectedCompanyId)?.name;
            
            openModal('confirmation', {
                message: `Confirmar check-out e faturar o saldo de R$ ${remainingDue.toFixed(2)} para a empresa ${companyName}?`,
                onConfirm: () => {
                    addAuditLog('Check-out (Faturado)', `Reserva de ${guest?.name} faturada para ${companyName} no valor de R$ ${remainingDue.toFixed(2)}.`);
                    updateReservation(updatedReservation);
                    closeModal();
                }
            });

        } else {
            if (remainingDue > 0.01) {
                alert(`Pagamento insuficiente. Ainda faltam R$ ${remainingDue.toFixed(2)}.`);
                return;
            }
            updatedReservation.status = 'checked-out';
            addAuditLog('Check-out (Pago)', `Check-out de ${guest?.name} finalizado com pagamento de R$ ${payment.amount.toFixed(2)}.`);
            updateReservation(updatedReservation);
            closeModal();
        }
    };

    return (
        <Modal isOpen={true} onClose={closeModal} title="Check-out e Pagamento">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <h3 className="font-bold text-lg">{guest?.name}</h3>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>Hospedagem ({numberOfNights} noites):</span> <span className="font-semibold">R$ {totalAccommodation.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Consumos:</span> <span className="font-semibold">R$ {totalConsumptions.toFixed(2)}</span></div>
                        <div className="flex justify-between border-t mt-1 pt-1"><span>Subtotal:</span> <span className="font-semibold">R$ {grandTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-green-600"><span>Total Pago:</span> <span className="font-semibold">- R$ {totalPaid.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-base border-t mt-1 pt-1"><span>Valor Pendente:</span> <span>R$ {amountDue.toFixed(2)}</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Pagamento Final</label>
                        <input type="number" step="0.01" id="amount" name="amount" value={payment.amount} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <select id="type" name="type" value={payment.type} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                             <option value="pix">Pix</option>
                            <option value="credit">Crédito</option>
                            <option value="debit">Débito</option>
                            <option value="transfer">Transferência</option>
                            <option value="money">Dinheiro</option>
                        </select>
                    </div>
                </div>

                {remainingDue > 0.01 && (
                     <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                         <div className="flex items-center">
                             <input type="checkbox" id="billToCompany" checked={billToCompany} onChange={(e) => setBillToCompany(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                             <label htmlFor="billToCompany" className="ml-2 block text-sm font-medium text-yellow-800">
                                Faturar saldo devedor de <span className="font-bold">R$ {remainingDue.toFixed(2)}</span> para uma empresa
                             </label>
                         </div>
                         {billToCompany && (
                            <div>
                                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">Selecione a Empresa</label>
                                <select id="companyId" value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm">
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                         )}
                     </div>
                )}
                
                <div className="flex justify-end items-center pt-4 space-x-2">
                     <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                        {billToCompany ? 'Finalizar e Faturar' : 'Finalizar Check-out'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};