const express = require("express");
const moment = require("moment");
const { default: mongoose } = require("mongoose");

const { CUser } = require("../models/CUser");
const { CEvent } = require("../models/CEvent");
const { CBooking } = require("../models/CBooking");
const { CAvailability } = require("../models/CAvailability");
const { CDayAvailability } = require("../models/CDayAvailability");
const { path } = require("@ffmpeg-installer/ffmpeg");
const { populate } = require("dotenv");

const { cldrBookingUsrData } = require("../HelperFunctions/crmTracking");
const { sendEmail } = require("../ContactUser/NodeMailer");

const {
  demoWelcomeImmediately,
} = require("../HelperFunctions/whatsAppTemplates");

const calendarRoute = express.Router();

//=> api/Checkuser
//=> api/updateUsername
//=> api/getUserByUsername

//=> api/createEvent
//=> api/getUserEvents
//=> api/deleteEvent
//=> api/getEventDetails

//=> api/getUserAvailability
//=> api/getEventAvailability
//=> api/updateAvailability

//=> api/getUserMeetings
//=> api/cancelMeeting

//=> api/createBooking
//=> api/getLatestUpdates

//UserRoutes

//userEventsRoute

//Start Availability ApI

/** Start cancel meeting API/cancelMeeting */
calendarRoute.post("/cancelMeeting", async (req, res) => {
  try {
    const { userId, meetingId } = req.body;
    const existingUser = await CUser.findOne({ clerkUserId: userId });

    if (!existingUser) {
      return res.json({
        status: false,
        data: null,
        msg: "User not found",
      });
    }

    const booking = await CBooking.findById(meetingId).populate({
      path: "eventId",
      populate: {
        path: "userId",
        select: "id name email",
      },
    });
    // console.log(booking.userId.toString(),existingUser._id.toString());

    if (!booking || booking.userId.toString() !== existingUser._id.toString()) {
      return res.json({
        status: false,
        data: null,
        msg: "Meeting not found or unauthorized",
      });
    }

    await CBooking.deleteOne({ _id: meetingId });
    await CUser.findOneAndUpdate(
      { _id: booking.userId },
      { $pull: { booking: meetingId } },
      { new: true }
    );

    await CEvent.findOneAndUpdate(
      { _id: booking.eventId },
      { $pull: { booking: meetingId } },
      { new: true }
    );

    return res.json({
      status: true,
      data: {
        userId: existingUser._id,
        user: {
          clerkUserId: existingUser.clerkUserId,
        },
        googleEventId: booking.googleEventId,
      },
      msg: "Delete Booking.",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

/** End cancel meeting API/cancelMeeting */

/** Start Upadate user name API/updateUserName */
calendarRoute.put("/updateUserName", async (req, res) => {
  try {
    const { userId, username } = req.body;
    const existingUser = await CUser.findOne({ username });

    if (existingUser && existingUser._id.toString() !== userId) {
      return res.json({
        status: false,
        data: null,
        msg: "Username is already taken",
      });
    }

    const getuser = await CUser.findById(userId);
    // console.log("TT", getuser);
    const updatedUser = await CUser.findByIdAndUpdate(userId, { username });
    return res.json({
      status: true,
      data: {
        username: updatedUser.username,
      },
      msg: "Username updated successfully",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

/**END Upadate user name API/updateUserName */

/**Start Get user Meetings API/getUserMeetings */

calendarRoute.post("/getUserMeetings", async (req, res) => {
  try {
    const { userId, type } = req.body;
    const user = await CUser.findOne({ clerkUserId: userId });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "User not exists",
      });
    }

    const now = new Date();

    const query = CBooking.find({
      userId: user._id,
      startTime: type === "upcoming" ? { $gte: now } : { $lt: now }, // Filter by startTime
    })
      .sort({ startTime: type === "upcoming" ? 1 : -1 })
      .populate({
        path: "eventId",
        populate: {
          path: "userId",
          select: "name email",
        },
      });

    // console.log("Query Filter:", query.getFilter());


    const meetings = await query;
    // console.log(meetings);

    if (!meetings) {
      return res.json({
        status: false,
        data: null,
        msg: "Event not exists",
      });
    }

    return res.json({
      status: true,
      data: meetings.map((meeting) => {
        if (
          !meeting.eventId ||
          (typeof meeting.eventId === "string" && meeting.eventId.trim() === "")
        ) {
          return {
            ...meeting.toObject(),
            id: meeting._id,
            event: null,
          };
        }

        const transformedMeeting = {
          ...meeting.toObject(),
          id: meeting._id,
          event: {
            ...meeting.eventId.toObject(),
            id: meeting.eventId._id,
            user: meeting.eventId.userId
              ? {
                ...meeting.eventId.userId.toObject(),
                id: meeting.eventId.userId._id,
              }
              : null,
          },
        };

        delete transformedMeeting._id;
        delete transformedMeeting.eventId;
        delete transformedMeeting.event?.userId;

        return transformedMeeting;
      }),
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

/**End Get user Meetings API/getUserMeetings */

/** Get Event By Event Id */
calendarRoute.post("/getEventByEeventId", async (req, res) => {
  try {
    const { slug } = req.body;
    // const event = await CEvent.findOne({ eventId });
    const event = await CEvent.findOne({ slug });

    if (!event) {
      return res.json({
        status: false,
        data: null,
        msg: "Event not exists",
      });
    }

    return res.json({
      status: true,
      data: event,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});
/** End get event by event Id */

/**Start check Duplicate event bookin api/checkDuplicateEventBooking*/
calendarRoute.post("/checkDuplicateEventBooking", async (req, res) => {
  try {
    const { eventId, email, startTime } = req.body;
    // const event = await CEvent.findOne({ eventId });
    const event = await CEvent.findById(eventId).populate({
      path: "userId",
      select: "clerkUserId email username name imageUrl",
    });

    if (!event) {
      return res.json({
        status: false,
        data: null,
        msg: "Event not exists",
      });
    }

    const transformedEvent = {
      ...event.toObject(),
      user: event.userId,
      id: event._id,
    };
    delete transformedEvent.userId;
    delete transformedEvent._id;

    const checkDuplicateBooking = await CBooking.findOne({
      eventId: eventId,
      userId: transformedEvent.user._id,
      email: email,
      startTime: startTime,
    });

    if (checkDuplicateBooking) {
      return res.json({
        status: false,
        data: null,
        msg: "Duplicate booking found on the same time",
      });
    }

    return res.json({
      status: true,
      data: transformedEvent,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

/**End check Duplicate event bookin api/checkDuplicateEventBooking*/

/** Start calendar/createUserBooking */

calendarRoute.post("/createUserBooking", async (req, res) => {
  try {
    const {
      eventId,
      userId,
      name,
      email,
      phone,
      startTime,
      endTime,
      additionalInfo,
      meetLink,
      googleEventId,
      clerkUserId,
      utmCampaign,
      utmSource,
      utmMedium,
    } = req.body;

    if (!eventId || !userId || !name || !email || !startTime || !endTime || !meetLink || !googleEventId) {
      return res.json({
        status: false,
        data: req.body,
        msg: "Required! userId,userId,name,email,startTime,endtime,meetlink,googleEventId and eventId",
      });
    }

    const booking = await CBooking.create({
      eventId,
      userId,
      name,
      email,
      phone,
      startTime,
      endTime,
      additionalInfo,
      meetLink,
      googleEventId,
      clerkUserId,
      utmCampaign,
      utmSource,
      utmMedium,
    });

    await CEvent.findByIdAndUpdate(
      eventId,
      { $push: { bookings: booking._id } },
      { new: true }
    );

    await CUser.findByIdAndUpdate(
      userId,
      { $push: { bookings: booking._id } },
      { new: true }
    );
    // console.log("Payload", name, email, phone, startTime, endTime, meetLink);
    const eventdetaills = await CEvent.findOne({ _id: eventId });
    const istStart = moment.utc(startTime).tz("Asia/Kolkata");
    const istEnd = moment.utc(endTime).tz("Asia/Kolkata");
    const dataObj = {
      name,
      email,
      phone,
      date: istStart.format("DD MMMM YYYY"), //"01 April 2025",
      startTime: istStart.format("h:mm A"), //"5:00 PM",
      endTime: istEnd.format("h:mm A"), //"5:45 PM",
      meetLink: meetLink,
      eventName: eventdetaills.title ?? "SD Campus for Sainik/JNV Demo Class",
    };
    // console.log("WP OBJ", dataObj);
    //WA Template
    await demoWelcomeImmediately(dataObj)
    // console.log("WP template sent");
    // confirmation email
    await sendEmail("DemoSessionConfirmedImmediately", email, name, dataObj)

    // sending data to teleCRM
    const obj = {
      name: name ?? "",
      email: email ?? "",
      phone: phone ?? "",
      utm_source: utmSource ?? "demo_booking",
      utm_campaign: utmCampaign ?? "demo_booking_class",
      utm_medium: utmMedium ?? "demo_booking_form_submit",
      platform: "website",
      category: "School Entrance Exams",
      eventName: eventdetaills.title ?? "SD Campus for Sainik/JNV Demo Class",
      eventStartDate: istStart.format("DD MMMM YYYY"),
      eventStartTime: istStart.format("h:mm A"),
      eventEndTime: istEnd.format("h:mm A"),
      meetingLink: meetLink,
    };
    await cldrBookingUsrData(obj);

    return res.json({
      status: true,
      data: booking,
      msg: "Booking Created successfully.",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

calendarRoute.post("/createExternalBooking", async (req, res) => {
  try {
    const {
      eventId,
      userId,
      name,
      email,
      phone,
      startTime,
      endTime,
      additionalInfo,
      meetLink,
      googleEventId,
      clerkUserId,
    } = req.body;

    if (!eventId || !userId) {
      return res.json({
        status: false,
        data: req.body,
        msg: "Required! userId and eventId",
      });
    }

    const booking = await CBooking.create({
      eventId,
      userId,
      name,
      email,
      phone,
      startTime,
      endTime,
      additionalInfo,
      meetLink,
      googleEventId,
      clerkUserId,
    });

    await CEvent.findByIdAndUpdate(
      eventId,
      { $push: { bookings: booking._id } },
      { new: true }
    );

    await CUser.findByIdAndUpdate(
      userId,
      { $push: { bookings: booking._id } },
      { new: true }
    );
    // console.log("Payload", name, email, phone, startTime, endTime, meetLink);
    const eventdetaills = await CEvent.findOne({ _id: eventId });
    const istStart = moment.utc(startTime).tz("Asia/Kolkata");
    const istEnd = moment.utc(endTime).tz("Asia/Kolkata");
    const dataObj = {
      name,
      email,
      phone,
      date: istStart.format("DD MMMM YYYY"), //"01 April 2025",
      startTime: istStart.format("h:mm A"), //"5:00 PM",
      endTime: istEnd.format("h:mm A"), //"5:45 PM",
      meetLink: meetLink,
      eventName: eventdetaills?.title ?? "SD Campus for Sainik/JNV Demo Class",
    };
    // console.log("WP OBJ", dataObj);
    //WA Template
    await demoWelcomeImmediately(dataObj)
    console.log("WP template sent");
    // confirmation email
    await sendEmail("DemoSessionConfirmedImmediately", email, name, dataObj)
    console.log("Email template sent");
    return res.json({
      status: true,
      data: booking,
      msg: "Booking Created successfully.",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

calendarRoute.post("/getUserBooking", async (req, res) => {
  try {
    const {
      page = 0,
      pageSize = 10,
      queryOptions,
      slug,
      clerkUserId,
    } = req.body;
    const limit = parseInt(pageSize);
    const skip = (page - 1) * limit;

    let query = CBooking.find().sort({ createdAt: -1 });
    if (queryOptions.length > 0 && queryOptions.filterModel.items.length > 0) {
      const filters = { clerkUserId };
      queryOptions.filterModel.items.forEach((filter) => {
        const field = filter.field;
        const value = filter.value;
        if (field && value) {
          filters[field] = { $regex: value, $options: "i" }; // Case-insensitive regex match
        }
      });

      query = CBooking.find(filters).sort({ createdAt: -1 });
    }

    if (queryOptions.length > 0 && queryOptions.sortModel.length > 0) {
      const SortingFilter = { clerkUserId };
      queryOptions.sortModel.forEach((sorting) => {
        const field = sorting.field;
        const sortOrder = sorting.sort === "asc" ? 1 : -1;
        if (field) {
          SortingFilter[field] = sortOrder;
        }
      });

      query = query.sort(SortingFilter);
    }

    if (pageSize) {
      query.find({ clerkUserId }).skip(skip).limit(limit);
    }

    if (slug) {
      const objEventId = await getEventIdBySlug(slug);
      query = CBooking.find({ eventId: objEventId, clerkUserId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    let getBooking;
    if (!slug) {
      getBooking = await query.populate({
        path: "eventId",
        select: "title slug description duration",
      });
    } else {
      getBooking = await query;
    }

    const totalBookings = await CBooking.find({ clerkUserId }).countDocuments();

    return res.json({
      status: true,
      data: {
        bookings: getBooking,
        currentPage: page,
        totalPages: Math.ceil(totalBookings / limit),
        totalBookings,
      },
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

calendarRoute.post("/getEventAvailability", async (req, res) => {
  try {
    const { eventId } = req.body;
    // const event = await CEvent.findOne({ eventId });
    const objEventId = await getEventIdBySlug(eventId);
    // console.log(await CEvent.findOne({ _id: objEventId }));
    const event = await CEvent.findOne({ _id: objEventId }).populate({
      path: "userId",
      select: "clerkUserId email username name imageUrl availability",
      populate: [
        {
          path: "availability",
          select: "days timeGap",
          populate: {
            path: "days",
            select: "day startTime endTime",
          },
        },
        {
          path: "bookings",
          select: "startTime endTime",
        },
      ],
    });

    if (!event) {
      return res.json({
        status: false,
        data: null,
        msg: "Event not exists",
      });
    }

    const transformedEvent = {
      ...event.toObject(),
      user: event.userId,
    };
    delete transformedEvent.userId;

    return res.json({
      status: true,
      data: transformedEvent,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

/** END calendar/getEventAvailability */

/** Start calendar/updateUserAvailability */

calendarRoute.post("/updateUserAvailability", async (req, res) => {
  try {
    const { userId, uId, formData } = req.body;
    const user = await CUser.findOne({ clerkUserId: userId });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "User not exists",
      });
    }

    let userAvailability = await CAvailability.findOne({ clerkUserId: userId });
    if (!userAvailability) {
      userAvailability = await CAvailability.create({
        userId: uId,
        clerkUserId: userId,
        days: [],
        timeGap: formData.timeGap,
      });
    }

    const availabilityData = Object.entries(formData).flatMap(
      ([day, { isAvailable, startTime, endTime }]) => {
        if (isAvailable) {
          const baseDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format

          return [
            {
              availabilityId: userAvailability._id,
              day: day.toUpperCase(),
              startTime: new Date(`${baseDate}T${startTime}:00Z`),
              endTime: new Date(`${baseDate}T${endTime}:00Z`),
            },
          ];
        }
        return [];
      }
    );

    if (userAvailability) {
      //update user availability
      await CDayAvailability.deleteMany({
        availabilityId: userAvailability._id,
      });
    }
    const availabilities = await CDayAvailability.create(availabilityData);
    const availabilityArr = availabilities.map((day) => day._id);

    userAvailability = await CAvailability.findOneAndUpdate(
      { clerkUserId: userId },
      { timeGap: formData.timeGap, days: availabilityArr },
      { new: true }
    );

    CUser.findOneAndUpdate(
      { _id: uId },
      { availability: userAvailability._id },
      { new: true }
    );

    return res.json({
      status: true,
      data: null,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

/** END calendar/updateUserAvailability */

/** Start calendar/getUserAvailability */

calendarRoute.post("/getUserAvailability", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await CUser.findOne({ clerkUserId: userId }).populate({
      path: "availability",
      select: "days timeGap",
      populate: {
        path: "days",
        select: "day startTime endTime",
      },
    });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "User not exists",
      });
    }

    return res.json({
      status: true,
      data: user,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

/** END calendar/getUserAvailability */

//Delete Event APi
calendarRoute.post("/deleteEvent", async (req, res) => {
  try {
    let { eventId, userId } = req.body;
    //find user by userId
    const checkUser = await CUser.findOne({ clerkUserId: userId });
    if (!checkUser) {
      return res.json({
        status: false,
        data: null,
        msg: "User not exists",
      });
    }
    //find event by eventId and userId
    const checkEvent = await CEvent.findById(eventId);
    if (!checkEvent) {
      return res.json({
        status: false,
        data: null,
        msg: "Event not exists",
      });
    }

    //check if events userId is same as userId
    if (
      checkEvent.clerkUserId.toString() !== checkUser.clerkUserId.toString()
    ) {
      return res.json({
        status: false,
        data: null,
        msg: "You are not authorized to delete this event",
      });
    }
    //delete event
    await CEvent.deleteOne({ _id: eventId });
    await CUser.findOneAndUpdate(
      { uId },
      { $pull: { events: eventId } },
      { new: true }
    );

    return res.json({
      status: true,
      data: null,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

//Get Event Details APi
calendarRoute.post("/getEventById", async (req, res) => {
  try {
    let { eventId, username } = req.body;
    const checkUser = await CUser.findOne({
      username,
    });
    if (!checkUser) {
      return res.json({
        status: false,
        data: null,
        msg: "User not exists",
      });
    }
    const objEventId = await getEventIdBySlug(eventId);
    const checkEvent = await CEvent.findOne({
      _id: objEventId,
      user: checkUser._id,
    });
    if (!checkEvent) {
      return res.json({
        status: false,
        data: null,
        msg: "Event not exists",
      });
    }
    return res.json({
      status: true,
      data: {
        event: {
          user: {
            name: checkUser.name,
            email: checkUser.email,
            imageUrl: checkUser.imageUrl,
          },
          id: checkEvent._id,
          _id: checkEvent._id,
          title: checkEvent.title,
          description: checkEvent.description,
          duration: checkEvent.duration,
        },
      },
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

calendarRoute.post("/createEvent", async (req, res) => {
  try {
    let { title, description, duration, isPrivate, userId, uId } = req.body;
    const checkUser = await CUser.findOne({ clerkUserId: userId });
    if (!checkUser) {
      return res.json({
        status: false,
        data: null,
        msg: "User not exists",
      });
    }
    const randomLetters = Math.random().toString(36).substring(2, 12);
    // Create the slug
    const slug = `${randomLetters}-${title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim()
      .slice(0, 50)}`;

    const events = await CEvent.create({
      title,
      slug,
      description,
      duration,
      isPrivate,
      userId: uId,
      clerkUserId: userId,
    });

    await CUser.findOneAndUpdate(
      { userId: uId },
      { $push: { events: events._id } },
      { new: true }
    );

    return res.json({
      status: true,
      data: events,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

calendarRoute.post("/getEventsByUserName", async (req, res) => {
  try {
    let { userName } = req.body;
    const user = await CUser.findOne({ username: userName })
      .select("id name email imageUrl")
      .populate({
        path: "events",
        match: { isPrivate: false },
        options: { sort: { createdAt: -1 } },
        select: "id title slug description duration isPrivate",
        populate: {
          path: "bookings",
          select: "_id",
        },
      });
    if (!user) {
      return res.json({
        status: false,
        data: null,
        msg: "User not exists",
      });
    }

    return res.json({
      status: true,
      data: user,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

calendarRoute.post("/getUserEvents", async (req, res) => {
  try {
    let { userId } = req.body;
    const checkUser = await CUser.findOne({ clerkUserId: userId });
    if (!checkUser) {
      return res.json({
        status: false,
        data: null,
        msg: "User not exists",
      });
    }
    //find events by userId and sort by createdAt in descending order and count bookings if available

    // const events = await CEvent.find({ userId: userId });

    const events = await CEvent.find({ clerkUserId: userId }).populate({
      path: "bookings",
      select: "startTime endTime",
    });

    return res.json({
      status: true,
      data: {
        events: events.map((event) => ({
          ...event.toObject(),
          id: event._id,
        })),
        username: checkUser.username,
      },
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

calendarRoute.post("/checkUser", async (req, res) => {
  try {
    let { name, imageUrl, email, username, userId } = req.body;

    const checkUser = await CUser.findOne({ clerkUserId: userId });
    if (checkUser) {
      return res.json({
        status: true,
        data: {
          id: checkUser._id,
          clerkUserId: checkUser.clerkUserId,
          username: checkUser.username,
          imageUrl: checkUser.imageUrl,
          email: checkUser.email,
          name: checkUser.name,
        },
        msg: "User Found !",
      });
    }

    const user = await CUser.create({
      clerkUserId: userId,
      name,
      imageUrl,
      email,
      username,
    });

    const availability = await CAvailability.create({
      userId: user._id,
      clerkUserId: userId,
      days: [],
      timeGap: 0,
    });

    user.availability = availability._id;
    user.save();

    return res.json({
      status: true,
      data: user,
      msg: "Success",
    });
  } catch (error) {
    return res.json({
      status: false,
      data: null,
      msg: error.message,
    });
  }
});

async function getEventIdBySlug(slgUrl) {
  const eventDetail = await CEvent.findOne({ slug: slgUrl });
  return eventDetail._id.toString();
}

module.exports = calendarRoute;
