// WalletDialogStyles.ts

export function getTabStyles(dependencies: Record<string, any>) {
    const { autoSign, autoConnectEnabled } = dependencies;

    return {
        tabContainer: {
            display: 'flex',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f8f9fa'
        },
        tab: {
            flex: 1,
            padding: '12px 16px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
        },
        activeTab: {
            backgroundColor: '#ffffff',
            borderBottom: '2px solid #65F152',
            color: '#65F152'
        },
        inactiveTab: {
            color: '#6c757d'
        },
        settingsContainer: {
            padding: '24px'
        },
        settingRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '1px solid #e5e7eb'
        },
        settingLabel: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151'
        },
        settingDescription: {
            fontSize: '12px',
            color: '#6c757d',
            marginTop: '4px'
        },
        toggle: {
            width: '48px',
            height: '24px',
            backgroundColor: autoSign ? '#65F152' : '#d1d5db',
            borderRadius: '12px',
            position: 'relative' as const,
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        toggleKnob: {
            width: '20px',
            height: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute' as const,
            top: '2px',
            left: autoSign ? '26px' : '2px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        },
        settingsButton: {
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginRight: '8px',
            marginBottom: '8px'
        },
        saveButton: {
            backgroundColor: '#65F152',
            color: '#000'
        },
        deleteButton: {
            backgroundColor: '#fee2e2',
            color: '#b91c1c'
        },
        textarea: {
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            border: '2px solid #65F152',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical' as const,
            outline: 'none',
            backgroundColor: '#ffffff',
            color: '#000000',
            boxShadow: '0 2px 4px rgba(101, 241, 82, 0.2)',
            zIndex: 999999
        },
        checkbox: {
            width: '18px',
            height: '18px',
            marginRight: '8px',
            cursor: 'pointer'
        },
        settingsSection: {
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
        },
        buttonGroup: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '8px',
            marginTop: '12px'
        },
        autoConnectToggle: {
            width: '48px',
            height: '24px',
            backgroundColor: autoConnectEnabled ? '#65F152' : '#d1d5db',
            borderRadius: '12px',
            position: 'relative' as const,
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        autoConnectKnob: {
            width: '20px',
            height: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute' as const,
            top: '2px',
            left: autoConnectEnabled ? '26px' : '2px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        },
        addDomainButton: {
            padding: '4px 8px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: '#65F152',
            color: '#000',
            marginLeft: '8px',
            transition: 'all 0.2s'
        },
        domainRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
        }
    };
}

export const mainStyles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '2px solid #65F152',
        color: 'black',
    },
    header: {
        padding: '20px 24px',
        borderBottom: '2px solid #65F152',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#65F152',
        textShadow: '1px 1px 2px black'
    },
    subtitle: {
        color: '#6c757d',
        fontSize: '14px',
        marginLeft: '8px'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#6c757d',
        padding: '4px'
    },
    body: {
        padding: '24px'
    },
    section: {
        marginBottom: '24px'
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '600',
        fontSize: '14px',
        color: '#374151'
    },
    connectedCard: {
        border: '1px solid #65F152',
        borderRadius: '6px',
        padding: '16px',
        backgroundColor: '#f0f9f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    badge: {
        backgroundColor: '#65F152',
        color: '#000',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        marginRight: '8px'
    },
    address: {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#1e40af',
        backgroundColor: '#eff6ff',
        padding: '4px 8px',
        borderRadius: '4px',
        wordBreak: 'break-all' as const
    },
    inputGroup: {
        display: 'flex',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        overflow: 'hidden'
    },
    inputIcon: {
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRight: '1px solid #d1d5db',
        fontSize: '16px'
    },
    input: {
        flex: 1,
        padding: '12px',
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        fontFamily: 'inherit',
        color: '#374151',
        backgroundColor: '#ffffff',
    },
    inputButton: {
        padding: '8px 16px',
        border: 'none',
        borderLeft: '1px solid #d1d5db',
        backgroundColor: '#65F152',
        color: '#000',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '80px',
        whiteSpace: 'nowrap' as const
    },
    button: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    primaryButton: {
        backgroundColor: '#65F152',
        color: '#000'
    },
    secondaryButton: {
        backgroundColor: '#f3f4f6',
        color: '#374151'
    },
    dangerButton: {
        backgroundColor: '#fee2e2',
        color: '#b91c1c'
    },
    disabledButton: {
        opacity: 0.6,
        cursor: 'not-allowed'
    },
    loadingContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    spinner: {
        width: '14px',
        height: '14px',
        border: '2px solid transparent',
        borderTop: '2px solid currentColor',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    footer: {
        padding: '16px 24px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'flex-end'
    },
    warning: {
        backgroundColor: '#fffbeb',
        border: '1px solid #fbbf24',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '12px',
        color: '#92400e'
    },
    error: {
        backgroundColor: '#fef2f2',
        border: '1px solid #f87171',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '14px',
        color: '#b91c1c',
        marginBottom: '16px'
    }
};

// Injecter le CSS d'animation une seule fois
if (!document.getElementById('quickwallet-spinner-css')) {
    const styleElement = document.createElement('style')
    styleElement.id = 'quickwallet-spinner-css'
    styleElement.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `
    document.head.appendChild(styleElement)
}
