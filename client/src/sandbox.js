// function convertToUnixTimestamp(timestamp) {
//   // const date = new Date(timestamp);
//   return Math.floor(Date.parse(timestamp) / 1000);
// }

// console.log(convertToUnixTimestamp('2023-03-05T09:32:48.156Z'));


// const statuses = ['Hadir', 'Sakit', 'Alfa'];
// const startDate = new Date('2023-01-01T00:00:00.000Z').getTime();
// const endDate = new Date('2023-07-01T23:59:59.999Z').getTime();

// const data = [];

// let currentDate = startDate;
// while (currentDate <= endDate) {
//   const studentId = 2;
//   const statusIndex = Math.floor(Math.random() * 3);
//   const status = statuses[statusIndex];
//   const createdAt = new Date(currentDate).toISOString();
//   data.push({ studentId, status, createdAt });
  
//   // tambahkan 1 hari ke currentDate
//   currentDate += 24 * 60 * 60 * 1000;
// }

// const ope = []

// data.forEach((each, index) => {
//   if(index >= 100) {
//     ope.push(each)
//   }
// })

// console.log(ope);

 
  
const daysInIndonesian = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu"
};

const date = new Date();
const day = date.getDay(); // mengembalikan nilai antara 0 (Minggu) dan 6 (Sabtu)

const hariIni = daysInIndonesian[day]; // memetakan nilai day ke dalam bahasa Indonesia

console.log(hariIni); // output: "Senin" (jika saat ini hari Senin)
