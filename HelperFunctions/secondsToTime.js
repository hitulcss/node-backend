const convertSecondsToTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const hoursString = hours > 0 ? `${hours}h :` : '';
    const minutesString = minutes > 0 ? `${minutes}m :` : '';
    const secondsString = `${remainingSeconds}s`;

    return hoursString + minutesString + secondsString;
}

module.exports = {
    convertSecondsToTime
}