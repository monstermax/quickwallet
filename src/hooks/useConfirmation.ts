// useConfirmation.ts

import { useState, useCallback } from 'react'

interface ConfirmationOptions {
    title: string
    message: string
    details?: string
}

interface ConfirmationState {
    isOpen: boolean
    title: string
    message: string
    details?: string
    resolve?: (value: boolean) => void
}

export const useConfirmation = () => {
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
        isOpen: false,
        title: '',
        message: '',
        details: undefined,
        resolve: undefined
    })

    const showConfirmation = useCallback((options: ConfirmationOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmationState({
                isOpen: true,
                title: options.title,
                message: options.message,
                details: options.details,
                resolve
            })
        })
    }, [])

    const handleConfirm = useCallback(() => {
        if (confirmationState.resolve) {
            confirmationState.resolve(true)
        }
        setConfirmationState(prev => ({ ...prev, isOpen: false, resolve: undefined }))
    }, [confirmationState.resolve])

    const handleCancel = useCallback(() => {
        if (confirmationState.resolve) {
            confirmationState.resolve(false)
        }
        setConfirmationState(prev => ({ ...prev, isOpen: false, resolve: undefined }))
    }, [confirmationState.resolve])

    return {
        confirmationState,
        showConfirmation,
        handleConfirm,
        handleCancel
    }
}