// ConfirmationDialog.tsx

import React from 'react'
import { mainStyles } from './WalletDialogStyles'

interface ConfirmationDialogProps {
    isOpen: boolean
    title: string
    message: string
    details?: string
    onConfirm: () => void
    onCancel: () => void
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    title,
    message,
    details,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null

    const dialogStyles = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        },
        dialog: {
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '2px solid #65F152'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid #eee'
        },
        icon: {
            fontSize: 24,
            marginRight: 12,
            color: '#ff9500'
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            margin: 0
        },
        message: {
            fontSize: 16,
            color: '#555',
            marginBottom: 16,
            lineHeight: 1.5
        },
        details: {
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: 8,
            padding: 12,
            fontSize: 14,
            fontFamily: 'monospace',
            color: '#495057',
            marginBottom: 20,
            whiteSpace: 'pre-wrap' as const,
            maxHeight: 200,
            overflow: 'auto'
        },
        buttons: {
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end'
        },
        cancelButton: {
            ...mainStyles.button,
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: '500'
        },
        confirmButton: {
            ...mainStyles.button,
            backgroundColor: '#65F152',
            color: '#000',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: '500'
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel()
        } else if (e.key === 'Enter') {
            onConfirm()
        }
    }

    return (
        <div 
            style={dialogStyles.overlay}
            onClick={(e) => e.target === e.currentTarget && onCancel()}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div style={dialogStyles.dialog}>
                <div style={dialogStyles.header}>
                    <span style={dialogStyles.icon}>⚠️</span>
                    <h3 style={dialogStyles.title}>{title}</h3>
                </div>
                
                <div style={dialogStyles.message}>
                    {message}
                </div>
                
                {details && (
                    <div style={dialogStyles.details}>
                        {details}
                    </div>
                )}
                
                <div style={dialogStyles.buttons}>
                    <button
                        style={dialogStyles.cancelButton}
                        onClick={onCancel}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#5a6268'
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#6c757d'
                        }}
                    >
                        Annuler
                    </button>
                    <button
                        style={dialogStyles.confirmButton}
                        onClick={onConfirm}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#5ae042'
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#65F152'
                        }}
                        autoFocus
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    )
}