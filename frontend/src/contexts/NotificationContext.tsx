import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Pour générer des IDs uniques pour les notifications

// Dépendance à installer: npm install uuid @types/uuid

// Définition du type pour une notification
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // Durée d'affichage en ms (optionnel)
}

// Définition du type pour le contexte de notification
interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  // Vous pouvez ajouter d'autres fonctions si nécessaire, par exemple pour masquer manuellement
}

// Crée le contexte
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Fournisseur du contexte de notification
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fonction pour afficher une nouvelle notification
  const showNotification = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 5000 // Durée par défaut de 5 secondes
  ) => {
    const id = uuidv4(); // Génère un ID unique
    const newNotification: Notification = { id, message, type, duration };

    setNotifications((prevNotifications) => [...prevNotifications, newNotification]);

    // Masque la notification après la durée spécifiée
    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notif) => notif.id !== id)
      );
    }, duration);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Le composant qui affichera les notifications sera rendu ici ou dans App.tsx */}
      <NotificationDisplay notifications={notifications} />
    </NotificationContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte de notification
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification doit être utilisé à l\'intérieur d\'un NotificationProvider');
  }
  return context;
};

// Composant pour afficher les notifications (Toast/Snackbar)
interface NotificationDisplayProps {
  notifications: Notification[];
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({ notifications }) => {
  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2"> {/* CHANGEMENT ICI: 'right-4' au lieu de 'left-4' */}
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`p-4 rounded-lg shadow-lg text-white ${getBackgroundColor(notif.type)} transition-all duration-300 ease-out transform translate-x-0 opacity-100`}
          // Vous pouvez ajouter des animations CSS ici (ex: fade-in, slide-in)
        >
          <p className="font-bold">{notif.type.toUpperCase()}</p>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  );
};
