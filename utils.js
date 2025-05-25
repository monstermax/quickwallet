

export function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existingNotif = document.getElementById('autoscroll-notification');
    if (existingNotif) {
        existingNotif.remove();
    }

    // Créer un élément de notification
    const notification = document.createElement('div');
    notification.id = 'autoscroll-notification';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.fontFamily = 'Arial, sans-serif';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '9999';
    notification.style.transition = 'opacity 0.5s ease-in-out';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

    // Styles selon le type de notification
    if (type === 'info') {
        notification.style.backgroundColor = '#1da1f2';
        notification.style.color = 'white';

    } else if (type === 'success') {
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';

    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ff9800';
        notification.style.color = 'white';
    }

    notification.innerHTML = message;
    document.body.appendChild(notification);

    // Faire disparaître la notification après 3 secondes
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

