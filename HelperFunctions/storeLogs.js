const { logsTables } = require("../models/logs");

const savePanelEventLogs = async (user, event, action, data) => {
    try {
        const logData = {
            admin : user ,
            event,
            action,
            data : [data]
        };

        const savedLogs = await logsTables.create(logData);

        if (savedLogs) {
            return true;
        }
        return true
    } catch (error) {
        console.error(error);
        return false
    }
};

module.exports = {
    savePanelEventLogs
};
