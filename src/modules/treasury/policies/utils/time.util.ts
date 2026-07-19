export function isWithinBusinessHours(
  transactionTime: Date,
  startTime: string,
  endTime: string,
  timeZone: string,
): boolean {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const timeStr = formatter.format(transactionTime);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const transactionMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;

    return transactionMinutes >= startMinutesTotal && transactionMinutes <= endMinutesTotal;
  } catch (error) {
    return true;
  }
}

export function getTimeWindowStart(endTime: Date, hours: number): Date {
  const startTime = new Date(endTime);
  startTime.setHours(startTime.getHours() - hours);
  return startTime;
}

export function formatTimestamp(timestamp: Date): string {
  return timestamp.toISOString();
}
