// Utility functions
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(0)}`;
};

export const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const getOrderStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    PLACED: 'Order sent to restaurant',
    CONFIRMED: 'Restaurant confirmed your order!',
    PREPARING: 'Your food is being prepared 👨‍🍳',
    RIDER_ASSIGNED: 'Rider is heading to the restaurant',
    PICKED_UP: 'Your order is on the way! 🛵',
    ON_THE_WAY: 'Rider is on the way!',
    DELIVERED: 'Order delivered! 🎉',
    CANCELLED: 'Order cancelled',
  };
  return statusMap[status] || status;
};

export const getOrderStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    PLACED: '#4A90D9',
    CONFIRMED: '#06C167',
    PREPARING: '#FFC043',
    RIDER_ASSIGNED: '#FF8C00',
    PICKED_UP: '#FF8C00',
    ON_THE_WAY: '#06C167',
    DELIVERED: '#06C167',
    CANCELLED: '#FF4444',
  };
  return colorMap[status] || '#8E8E8E';
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const getDeliveryTimeRange = (minutes: number): string => {
  const lower = Math.max(minutes - 5, 10);
  const upper = minutes + 10;
  return `${lower}–${upper} min`;
};
