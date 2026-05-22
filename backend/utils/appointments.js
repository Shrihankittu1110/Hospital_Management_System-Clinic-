const DEFAULT_AVAILABILITY = {
  monday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
  tuesday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
  wednesday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
  thursday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
  friday: { startTime: '09:00', endTime: '17:00', isAvailable: true },
  saturday: { startTime: '10:00', endTime: '14:00', isAvailable: false },
  sunday: { startTime: '00:00', endTime: '00:00', isAvailable: false },
};

const getDayRange = (dateValue) => {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const getWeekday = (dateValue) => (
  new Date(dateValue).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
);

const generateTimeSlots = (startTime, endTime) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const hour12 = currentHour % 12 || 12;
    const period = currentHour >= 12 ? 'PM' : 'AM';
    slots.push(`${hour12}:${String(currentMin).padStart(2, '0')} ${period}`);

    currentMin += 60;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin %= 60;
    }
  }

  return slots;
};

const parseDisplayTime = (time) => {
  const [timeStr, period] = String(time).trim().split(' ');
  if (!timeStr || !['AM', 'PM'].includes(period)) {
    return null;
  }

  const [hours, minutes = '00'] = timeStr.split(':');
  let hour24 = Number(hours);
  const minute = Number(minutes);

  if (!Number.isInteger(hour24) || !Number.isInteger(minute) || hour24 < 1 || hour24 > 12 || minute < 0 || minute > 59) {
    return null;
  }

  if (period === 'PM' && hour24 !== 12) hour24 += 12;
  if (period === 'AM' && hour24 === 12) hour24 = 0;

  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

module.exports = {
  DEFAULT_AVAILABILITY,
  getDayRange,
  getWeekday,
  generateTimeSlots,
  parseDisplayTime,
};
