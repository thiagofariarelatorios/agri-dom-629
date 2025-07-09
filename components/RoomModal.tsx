
import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { Modal } from './Modal';
import { Room, RoomStatus } from '../types';

interface RoomModalProps {
    modalData: {
        room?: Room | null;
    }
}

export const RoomModal: React.FC<RoomModalProps> = ({ modalData }) => {
    const { addRoom, updateRoom, closeModal } = useData();
    const { room } = modalData;
    
    const isEditMode = room != null;
    
    const getInitialState = (): Omit<Room, 'id'> => {
        if (isEditMode) return room;
        return {
            name: '',
            type: 'Solteiro',
            price: 150,
            capacity: 2,
            status: 'Limpo' as RoomStatus,
        };
    };

    const [formData, setFormData] = useState(getInitialState);

    useEffect(() => {
        setFormData(getInitialState());
    }, [modalData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = ['price', 'capacity'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditMode) {
            updateRoom({ ...room, ...formData });
        } else {
            addRoom(formData);
        }
        closeModal();
    };

    const title = isEditMode ? 'Editar Quarto' : 'Novo Quarto';

    return (
        <Modal isOpen={true} onClose={closeModal} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Número do Quarto</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option>Solteiro</option>
                            <option>Duplo</option>
                            <option>Suite</option>
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                        <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacidade</label>
                        <input type="number" id="capacity" name="capacity" value={formData.capacity} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        <option>Limpo</option>
                        <option>Sujo</option>
                        <option>Manutenção</option>
                    </select>
                </div>
                <div className="flex justify-end items-center pt-4 space-x-2">
                     <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{isEditMode ? 'Salvar Alterações' : 'Adicionar Quarto'}</button>
                </div>
            </form>
        </Modal>
    );
};
