// function generateData() {
//   const dataPoints = {};
//   const startDate = new Date("2020-01-01T00:00:00Z");
//   const endDate = new Date("2020-12-31T23:59:59Z");

//   let currentDate = new Date(startDate);
//   while (currentDate <= endDate) {
//     const timestamp = currentDate.getTime() / 1000;
//     const value = Math.floor(Math.random() * 100);
//     dataPoints[timestamp] = value;
//     currentDate.setDate(currentDate.getDate() + 1);
//   }

//   return {
//     dataPoints,
//     start: startDate,
//     end: endDate,
//   };
// }


// console.log(generateData());

function generateData(baseval, count, yrange) {
  var i = 0;
  var series = [];
  while (i < count) {
    var x = baseval;
    var y =
      Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

    series.push([x, y]);
    baseval += 86400000;
    i++;
  }
  return series;
}

console.log(generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
  min: 10,
  max: 60,
}));