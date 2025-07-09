
import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { Modal } from './Modal';
import { Guest } from '../types';

interface GuestModalProps {
    modalData: {
        guest?: Guest | null;
    }
}

export const GuestModal: React.FC<GuestModalProps> = ({ modalData }) => {
    const { addGuest, updateGuest, closeModal } = useData();
    const { guest } = modalData;
    
    const isEditMode = guest != null;
    
    const getInitialState = () => {
        if (isEditMode) {
            return {
                name: guest.name,
                email: guest.email,
                phone: guest.phone,
                cpf: guest.cpf || '',
                address: guest.address || '',
            };
        }
        return {
            name: '',
            email: '',
            phone: '',
            cpf: '',
            address: '',
        };
    };

    const [formData, setFormData] = useState(getInitialState);

    useEffect(() => {
        setFormData(getInitialState());
    }, [modalData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const guestData = isEditMode ? { ...guest, ...formData } : formData;
        if (isEditMode) {
            updateGuest(guestData as Guest);
        } else {
            addGuest(guestData);
        }
        closeModal();
    };

    const title = isEditMode ? 'Editar Hóspede' : 'Novo Hóspede';

    return (
        <Modal isOpen={true} onClose={closeModal} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                    <div>
                        <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
                        <input type="text" id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
                    <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                </div>
                
                <div className="flex justify-end items-center pt-4 space-x-2">
                     <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{isEditMode ? 'Salvar Alterações' : 'Adicionar Hóspede'}</button>
                </div>
            </form>
        </Modal>
    );
};
