const mysql = require("mysql");

// const db = mysql.createConnection({
//   host: "fivewhyrds.ctxjvxl0k0dq.us-east-1.rds.amazonaws.com",
//   user: "fivewhyadmin",
//   password: "Yayaya#143",
//   database: "HMS_Demo",
//   timezone: '+05:30', 
// });


const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Meena123*",
  database: "Alagar_Clinic_Test",
  timezone: '+05:30', 
});


db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

module.exports = db;
