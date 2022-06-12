export default function timeRemainingMessage(timeToGo: number): string {
    const hoursRemaining = Math.floor(timeToGo / 3600000);
    const minutesRemaining = Math.floor(
        (timeToGo - (hoursRemaining * 3600000)) / 60000,
    );
    const secondsRemaining = Math.floor(
        (timeToGo - ((hoursRemaining * 3600000) + (
            minutesRemaining * 60000
        ))) / 1000,
    );
    const hoursMessage = (
        hoursRemaining > 0 ? `${hoursRemaining} hours, ` : ''
    );
    const minutesMessage = (
        minutesRemaining > 0
            ? `${minutesRemaining} minutes, ` : ''
    );
    const message = [
        'Time remaining: ',
        hoursMessage,
        minutesMessage,
        secondsRemaining,
        ' seconds',
    ].join('');
    return message;
}
