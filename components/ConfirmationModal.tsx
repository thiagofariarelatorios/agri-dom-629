
import React from 'react';
import { useData } from './DataContext';
import { Modal } from './Modal';

interface ConfirmationModalProps {
    modalData: {
        message: string;
        onConfirm: () => void;
    }
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ modalData }) => {
    const { closeModal } = useData();
    const { message, onConfirm } = modalData;

    const handleConfirm = () => {
        onConfirm();
        closeModal();
    };

    return (
        <Modal isOpen={true} onClose={closeModal} title="Confirmar Ação">
            <div>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </Modal>
    );
};
