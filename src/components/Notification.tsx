// Notification.tsx

import React, { useEffect, useState } from 'react'

import type { NotificationProps } from '../types/wallet'


const notificationStyles = {
    container: {
        position: 'fixed' as const,
        bottom: '20px',
        right: '20px',
        zIndex: 999999,
        minWidth: '300px',
        maxWidth: '400px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'all 0.3s ease-in-out'
    },
    content: {
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
    },
    icon: {
        fontSize: '20px',
        marginTop: '2px'
    },
    message: {
        flex: 1,
        fontSize: '14px',
        lineHeight: '1.4'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '0',
        marginLeft: '8px',
        opacity: 0.7
    }
}

export const Notification: React.FC<NotificationProps> = ({
    message,
    type = 'info',
    show,
    onClose
}) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (show) {
            setIsVisible(true)
            const timer = setTimeout(() => {
                setIsVisible(false)
                setTimeout(onClose, 300)
            }, 3000)

            return () => clearTimeout(timer)
        } else {
            setIsVisible(false)
        }
    }, [show, onClose])

    if (!show) return null

    const getStyles = () => {
        const baseStyles = {
            ...notificationStyles.content,
            transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
            opacity: isVisible ? 1 : 0
        }

        switch (type) {
            case 'success':
                return {
                    ...baseStyles,
                    backgroundColor: '#f0f9f0',
                    borderColor: '#65F152',
                    color: '#2d5a2d'
                }
            case 'warning':
                return {
                    ...baseStyles,
                    backgroundColor: '#fffbeb',
                    borderColor: '#fbbf24',
                    color: '#92400e'
                }
            case 'error':
                return {
                    ...baseStyles,
                    backgroundColor: '#fef2f2',
                    borderColor: '#f87171',
                    color: '#b91c1c'
                }
            default:
                return {
                    ...baseStyles,
                    backgroundColor: '#f0f9ff',
                    borderColor: '#3b82f6',
                    color: '#1e40af'
                }
        }
    }

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅'
            case 'warning': return '⚠️'
            case 'error': return '❌'
            default: return 'ℹ️'
        }
    }

    return (
        <div style={notificationStyles.container}>
            <div style={getStyles()}>
                <span style={notificationStyles.icon}>{getIcon()}</span>
                <div
                    style={notificationStyles.message}
                    dangerouslySetInnerHTML={{ __html: message }}
                />
                <button
                    style={notificationStyles.closeButton}
                    onClick={onClose}
                >
                    ×
                </button>
            </div>
        </div>
    )
}

