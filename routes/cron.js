// const schedule =  require('node-schedule');
const { CronJob } = require('cron');
const moment = require('moment');
const { LectureTable } = require('../models/addLecture');
const timeZone = 'Asia/Kolkata';
const { sendEmail } = require("../ContactUser/NodeMailer");
const { sendWhatsAppMessage } = require("../HelperFunctions/whatsAppTemplates");
const { UserTable } = require('../models/userModel');
const cronjobs = () => {
    const job2 = new CronJob(
        '0 40 23 * * *', // cronTime
        async function () {
            const yesterday = new Date(moment().subtract(1, 'day').set({ hour: 5, minute: 30, second: 0, millisecond: 0 }));
            const dayBeforeYesterday = new Date(moment().subtract(10, 'day').set({ hour: 5, minute: 30, second: 0, millisecond: 0 }));
            console.log(yesterday, dayBeforeYesterday);
            // const newOne = await LectureTable.find({ lecture_type: "YT", LiveOrRecorded: "Live" , endingDate : { $lt : yesterday } });
            const newOne = await LectureTable.find({ lecture_type: "YT", LiveOrRecorded: "Live", endingDate: { $gt: dayBeforeYesterday, $lt: yesterday } });
            await Promise.all(newOne.map(async (item) => {
                await LectureTable.findByIdAndUpdate(item._id, { LiveOrRecorded: "Recorded" });
            }))
        },
        null,
        true,
        timeZone
    );
    job2.start();

    const teacherSchedule = new CronJob(
        '0 0 6 * * *', // cronTime
        async function () {
            const startOfDay = new Date(moment().set({ hour: 5, minute: 30, second: 59, millisecond: 0 }));
            const endOfDay = new Date(moment().set({ hour: 28, minute: 89, second: 59, millisecond: 0 }));
            const lectures = await LectureTable.find({ endingDate: { $lte: endOfDay, $gte: startOfDay } }).populate("teacher", "_id FullName email").populate("batch", "_id batch_name").populate("subject", "_id title");
            const scheduleLectures = lectures.map((item, index) => {
                return {
                    startDate: item.starting_date.split(' ')[0],
                    day: moment(item.starting_date, "DD-MM-YYYY HH:mm:ss").format('dddd'),
                    teacherName: item?.teacher[0]?.FullName ?? "",
                    teacherEmail: item?.teacher[0]?.email ?? "",
                    batchName: item?.batch?.batch_name ?? "",
                    startTiming: item.starting_date,
                    endTiming: item.ending_date,
                    lectureTopic: item.lecture_title,
                }
            });
            const groupedData = scheduleLectures.reduce((acc, lecture) => {
                const teacherName = lecture.teacherName;
                if (!acc[teacherName]) {
                    acc[teacherName] = [];
                }
                acc[teacherName].push(lecture);
                return acc;
            }, {});
            const result = Object.keys(groupedData).map(teacherName => (groupedData[teacherName]))
            for (let i = 0; i < result.length; i++) {
                await sendEmail("scheduleLectures", result[i][0]['teacherEmail'], result[i][0]['teacherName'], result[i])
            }
        },
        null,
        true,
        timeZone
    );
    teacherSchedule.start();

    const sevenDaysInactive = new CronJob(
        '0 9 * * *', // cronTime
        async function () {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const inactive = await UserTable.find({ lastActive: { $lt: sevenDaysAgo } });
            console.warn("Inactive users for 7 days:", inactive);
            for (const user of inactive) {
                await sendWhatsAppMessage(user.mobileNumber, user.FullName);
            }
            console.warn("WhatsApp messages sent to inactive users.");
        },
        null,
        true,
        timeZone
    );
    sevenDaysInactive.start();
}


module.exports = {
    // job1
    cronjobs
}