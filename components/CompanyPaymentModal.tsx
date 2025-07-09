
import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { Modal } from './Modal';
import { CompanyPayment, PaymentType } from '../types';

interface CompanyPaymentModalProps {
    modalData: {
        payment?: CompanyPayment | null;
        companyId?: string;
    }
}

export const CompanyPaymentModal: React.FC<CompanyPaymentModalProps> = ({ modalData }) => {
    const { addCompanyPayment, updateCompanyPayment, closeModal } = useData();
    const { payment, companyId } = modalData;
    
    const isEditMode = payment != null;
    
    const getInitialState = (): Omit<CompanyPayment, 'id' | 'companyId'> => {
        if (isEditMode) {
            return {
                amount: payment.amount,
                date: payment.date,
                paymentMethod: payment.paymentMethod,
                notes: payment.notes || '',
            };
        }
        return {
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'transfer',
            notes: '',
        };
    };

    const [formData, setFormData] = useState(getInitialState);

    useEffect(() => {
        setFormData(getInitialState());
    }, [modalData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            alert("O valor do pagamento deve ser maior que zero.");
            return;
        }

        if (isEditMode) {
            updateCompanyPayment({ ...payment, ...formData });
        } else if (companyId) {
            addCompanyPayment({ ...formData, companyId });
        }
        closeModal();
    };

    const title = isEditMode ? 'Editar Pagamento' : 'Novo Pagamento';

    return (
        <Modal isOpen={true} onClose={closeModal} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                        <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data do Pagamento</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                </div>
                 <div className="grid grid-cols-1">
                    <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="transfer">Transferência</option>
                            <option value="pix">Pix</option>
                            <option value="debit">Débito</option>
                            <option value="credit">Crédito</option>
                            <option value="money">Dinheiro</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Observações (Opcional)</label>
                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                </div>
                
                <div className="flex justify-end items-center pt-4 space-x-2">
                     <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{isEditMode ? 'Salvar Alterações' : 'Adicionar Pagamento'}</button>
                </div>
            </form>
        </Modal>
    );
};