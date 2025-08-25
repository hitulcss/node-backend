const url = require("url");
const axios = require("axios");
const moment = require("moment");
const { ytTokenTable } = require("../models/ytToken");
const getChatIdFromUrl = async (ytUrl, token) => {
  const urlObj = url.parse(ytUrl, true);
  const videoId = urlObj.query.v;
  if (videoId) {
    const queryParams = {
      part: "id,snippet,contentDetails, status, statistics",
      id: videoId,
    };
    // const token =
    //   "ya29.a0Ael9sCMoFm_mlvNk1eNQ_9v0REY8CzmR7kdg2YEvmApYlr119lce1YGjtNcc-qrZNADkzDEJRORzzZSVXGKwMaZuOfYI2JJ3CN_EmZacQMtCjFQeoJYX3-AZ0K8gCVWPSEWqZwOsRYUlPI-gBTDA5_-1aSfULBgaCgYKAXESARESFQF4udJhh542eUTE__FpqeStFndaAg0166";
    try {
      const response = await axios.get(
        "https://youtube.googleapis.com/youtube/v3/liveBroadcasts?",
        {
          params: queryParams,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.items[0].snippet.liveChatId;
    } catch (error) {
      //console.error(error);
    }
  }
};

const saveYtToken = async (ytToken, userId) => {
  if (ytToken && userId) {
    try {
      const tokenYT = new ytTokenTable({
        user: userId,
        token: ytToken,
        createdAt: moment().add(5, "hours").add(30, "minutes"),
      });

      const data = await tokenYT.save();
      return data;
    } catch (error) {
      throw new Error("Failed to save token");
    }
  } else {
    throw new Error("ytToken or userId not found");
  }
};
const getYtToken = async (userId) => {
  try {
    const tokenData = await ytTokenTable
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(1);

    if (tokenData.length !== 0) {
      const token = tokenData[0]?.token;
      return { status: true, token: token, msg: "Token Found" };
    } else {
      return { status: false, token: null, msg: "Token Not Found" };
    }
  } catch (error) {
    console.log(error);
    return { status: false, token: null, msg: "Error retrieving token" };
  }
};

module.exports = {
  getChatIdFromUrl,
  saveYtToken,
  getYtToken,
};
