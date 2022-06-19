import ApplicationState from './applicationState';

export function timeRemainingMessage(timeToGo: number): string {
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

export function getTimeLeft(profileName: string, state: ApplicationState): string {
    const profileSession = state.windows[profileName];
    const currentTime = new Date().getTime();
    const timeToGo = profileSession.expiryTime - currentTime;
    if (timeToGo < 1000 && profileSession.titleUpdateTimer) {
        clearInterval(profileSession.titleUpdateTimer);
        profileSession.titleUpdateTimer = undefined;
        return profileSession.window.getTitle();
    }
    return timeRemainingMessage(timeToGo);
}
