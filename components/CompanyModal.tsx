
import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { Modal } from './Modal';
import { Company } from '../types';

interface CompanyModalProps {
    modalData: {
        company?: Company | null;
    }
}

export const CompanyModal: React.FC<CompanyModalProps> = ({ modalData }) => {
    const { addCompany, updateCompany, closeModal } = useData();
    const { company } = modalData;
    
    const isEditMode = company != null;
    
    const getInitialState = (): Omit<Company, 'id'> => {
        if (isEditMode) return { name: company.name, cnpj: company.cnpj, email: company.email, phone: company.phone };
        return {
            name: '',
            cnpj: '',
            email: '',
            phone: '',
        };
    };

    const [formData, setFormData] = useState(getInitialState);

    useEffect(() => {
        setFormData(getInitialState());
    }, [modalData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const companyData = isEditMode ? { ...company, ...formData } : formData;
        if (isEditMode) {
            updateCompany(companyData as Company);
        } else {
            addCompany(companyData as Omit<Company, 'id'>);
        }
        closeModal();
    };

    const title = isEditMode ? 'Editar Empresa' : 'Nova Empresa';

    return (
        <Modal isOpen={true} onClose={closeModal} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                    <div>
                        <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
                        <input type="text" id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email de Contato</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
                    </div>
                </div>
                
                <div className="flex justify-end items-center pt-4 space-x-2">
                     <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{isEditMode ? 'Salvar Alterações' : 'Adicionar Empresa'}</button>
                </div>
            </form>
        </Modal>
    );
};
