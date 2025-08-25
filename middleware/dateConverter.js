
function formatDate(date) {
  datehelper = "" + date;
  datehelper = datehelper.split(" ");
  let monthsList = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  let time = datehelper[4];
  let year = datehelper[3];
  let month = `0${(monthsList.indexOf(datehelper[1]) + 1)}`.slice(-2);
  let day = datehelper[2];

  return `${day}-${month}-${year} ${time}`;
}


function formatTime(date) {
  datehelper = "" + date;
  datehelper = datehelper.split(" ");
  let monthsList = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  let time = datehelper[4];
  let year = datehelper[3];
  let month = `0${(monthsList.indexOf(datehelper[1]) + 1)}`.slice(-2);
  let day = datehelper[2];

  return `${time}`;
}



function formatTodaysDate(date) {
  datehelper = "" + date;
  datehelper = datehelper.split(" ");
  let monthsList = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  let time = datehelper[4];
  let year = datehelper[3];
  let month = `0${(monthsList.indexOf(datehelper[1]) + 1)}`.slice(-2);
  let day = datehelper[2];
  return `${day}-${month}-${year}`;
}



const getDateDifference = (inputdate) => {
  const oldDate = inputdate.split(' ')[0];
  const helper = oldDate.split("-");
  const extra = helper[1] + "/" + helper[0] + "/" + helper[2];
  const date1 = new Date(extra)
  const diff = Math.abs(new Date() - date1);
  // const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24))
  const today = new Date();
  // console.log(today)
  // console.log(date1)
  var months;
  months = (today.getFullYear() - date1.getFullYear()) * 12;
  // console.log(months)
  months -= date1.getMonth();
  months += today.getMonth();
  return months <= 0 ? 0 : months;
  // return diffDay;
}



module.exports = {
  formatDate,
  formatTime,
  formatTodaysDate,
  getDateDifference

}
