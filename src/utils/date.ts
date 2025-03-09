export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isDatePassed = (date: Date): boolean => {
  return new Date(date) < new Date();
};

export const getTimeSlots = (start: Date, end: Date, duration: number): Date[] => {
  const slots: Date[] = [];
  let current = new Date(start);
  
  while (current < end) {
    slots.push(new Date(current));
    current = new Date(current.getTime() + duration * 60000);
  }
  
  return slots;
};