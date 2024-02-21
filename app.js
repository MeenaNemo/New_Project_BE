const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const moment = require("moment-timezone");
const db = require('./config.js');

moment.tz.setDefault("Asia/Kolkata");

const userRoute = require('./src/user.js');
const registrationRoute = require('./src/registration.js'); 
const doctorRoute = require('./src/doctor.js'); 
const appointmentRoute = require('./src/appointment.js'); 


const app = express();
const port = 5000;

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/user', userRoute);
app.use('/registration', registrationRoute);
app.use('/doctor', doctorRoute);
app.use('/appointment', appointmentRoute);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
