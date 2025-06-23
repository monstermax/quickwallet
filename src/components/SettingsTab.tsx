// SettingsTab.tsx

import React from 'react'
import { secureStorage } from '../services/SecureStorage'
import { getTabStyles, mainStyles } from './WalletDialogStyles'

interface SettingsTabProps {
    error: string | null
    autoConnectDomains: { domain: string, enabled: boolean }[]
    setAutoConnectDomains: (domains: { domain: string, enabled: boolean }[]) => void
    autoConnectEnabled: boolean
    setAutoConnectEnabled: (enabled: boolean) => void
    isDomainAllowed: boolean
    setNotification: (notification: any) => void
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
    error,
    autoConnectDomains,
    setAutoConnectDomains,
    autoConnectEnabled,
    setAutoConnectEnabled,
    isDomainAllowed,
    setNotification
}) => {
    const tabStyles = getTabStyles({ autoConnectEnabled })

    return (
        <div style={tabStyles.settingsContainer}>
            {error && (
                <div style={mainStyles.error}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Auto-connexion par domaine */}
            <div style={tabStyles.settingsSection}>
                <div style={tabStyles.settingRow}>
                    <div>
                        <div style={tabStyles.settingLabel}>🌐 Domain auto-connect</div>
                        <div style={tabStyles.settingDescription}>
                            Enable automatic connection for specific domains
                            {isDomainAllowed && (
                                <div style={{ color: '#65F152', fontWeight: 'bold', marginTop: '4px' }}>
                                    ✅ Current domain allowed: {secureStorage.getCurrentDomain()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        style={tabStyles.autoConnectToggle}
                        onClick={() => setAutoConnectEnabled(!autoConnectEnabled)}
                    >
                        <div style={tabStyles.autoConnectKnob} />
                    </div>
                </div>

                {autoConnectEnabled && (
                    <div style={{ marginTop: '16px' }}>
                        <div style={tabStyles.settingLabel}>Allowed domains (one per line):</div>
                        <div style={tabStyles.domainRow}>
                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                Current domain: {secureStorage.getCurrentDomain()}
                            </div>
                            <button
                                style={tabStyles.addDomainButton}
                                onClick={() => {
                                    const currentDomain = secureStorage.getCurrentDomain()
                                    if (!autoConnectDomains.some(d => d.domain === currentDomain)) {
                                        const newDomains = [
                                            ...autoConnectDomains,
                                            { domain: currentDomain, enabled: true }
                                        ]
                                        setAutoConnectDomains(newDomains)
                                        // Sauvegarde auto
                                        const domainsToSave = newDomains.filter(d => d.enabled).map(d => d.domain.trim())
                                        secureStorage.saveAutoConnectSettings({
                                            enabled: autoConnectEnabled,
                                            domains: domainsToSave
                                        })
                                    }
                                }}
                                title="Add current domain to the list"
                            >
                                + Add
                            </button>
                        </div>
                        <div>
                            {autoConnectDomains.map((d, idx) => (
                                <div key={d.domain} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                    <input
                                        type="checkbox"
                                        checked={d.enabled}
                                        onChange={() => {
                                            const newDomains = autoConnectDomains.map((item, i) =>
                                                i === idx ? { ...item, enabled: !item.enabled } : item
                                            )
                                            setAutoConnectDomains(newDomains)
                                            // Sauvegarde auto
                                            const domainsToSave = newDomains.filter(dom => dom.enabled).map(dom => dom.domain.trim())
                                            secureStorage.saveAutoConnectSettings({
                                                enabled: autoConnectEnabled,
                                                domains: domainsToSave
                                            })
                                        }}
                                        style={tabStyles.checkbox}
                                    />
                                    <span style={{ flex: 1 }}>{d.domain}</span>
                                    <button
                                        style={{
                                            ...tabStyles.settingsButton,
                                            ...tabStyles.deleteButton,
                                            padding: '2px 8px',
                                            fontSize: '12px',
                                            marginRight: 0
                                        }}
                                        onClick={() => {
                                            const newDomains = autoConnectDomains.filter((_, i) => i !== idx)
                                            setAutoConnectDomains(newDomains)
                                            // Sauvegarde auto
                                            const domainsToSave = newDomains.filter(dom => dom.enabled).map(dom => dom.domain.trim())
                                            secureStorage.saveAutoConnectSettings({
                                                enabled: autoConnectEnabled,
                                                domains: domainsToSave
                                            })
                                        }}
                                        title="Remove this domain from the list"
                                    >
                                        ✖
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}