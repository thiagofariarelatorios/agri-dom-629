
import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { Modal } from './Modal';
import { User } from '../types';

interface UserModalProps {
    modalData: {
        user?: User | null;
    }
}

export const UserModal: React.FC<UserModalProps> = ({ modalData }) => {
    const { addUser, updateUser, closeModal } = useData();
    const { user } = modalData;
    
    const isEditMode = user != null;
    
    const getInitialState = (): Omit<User, 'id'> & { password?: string } => {
        if (isEditMode) return { ...user };
        return {
            name: '',
            username: '',
            email: '',
            role: 'employee',
            active: true,
            password: '',
        };
    };

    const [formData, setFormData] = useState(getInitialState);

    useEffect(() => {
        setFormData(getInitialState());
    }, [modalData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Exclude password from the data to be saved if it's not a new user
        const { password, ...dataToSave } = formData;

        if (isEditMode) {
            updateUser(dataToSave as User);
        } else {
            if (!password) {
                alert('A senha é obrigatória para novos usuários.');
                return;
            }
            // In a real app, you would hash the password before saving
            addUser(dataToSave as Omit<User, 'id' | 'active'>);
        }
        closeModal();
    };

    const title = isEditMode ? 'Editar Usuário' : 'Novo Usuário';

    return (
        <Modal isOpen={true} onClose={closeModal} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Cargo</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm capitalize">
                            <option value="employee">Funcionário</option>
                            <option value="admin">Administrador</option>
                            <option value="limpeza">Limpeza</option>
                        </select>
                    </div>
                </div>
                
                 <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                    <input type="password" id="password" name="password" value={formData.password || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder={isEditMode ? 'Deixe em branco para não alterar' : ''} required={!isEditMode} />
                </div>
                
                <div className="flex items-center">
                    <input type="checkbox" id="active" name="active" checked={formData.active} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-900">Usuário Ativo</label>
                </div>

                <div className="flex justify-end items-center pt-4 space-x-2">
                     <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{isEditMode ? 'Salvar Alterações' : 'Adicionar Usuário'}</button>
                </div>
            </form>
        </Modal>
    );
};