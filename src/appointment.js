const express = require('express');
const db = require('../config');
const router = express.Router();
const moment = require("moment-timezone");


const createAppointmentsTableQuery = `
CREATE TABLE IF NOT EXISTS Appointments_Ocean (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctorName VARCHAR(255),
  patientName VARCHAR(255),
  mobileNo VARCHAR(20),
  age INT,
  gender VARCHAR(10),
  medicalAffiliation TEXT,
  selectedDate DATE,
  selectedTime TIME,
  createdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;


db.query(createAppointmentsTableQuery, (error, result) => {
    if (error) {
      console.error("Error creating Appointments_Ocean table: " + error.message);
    } else {
      console.log("Table 'Appointments_Ocean' created successfully");
    }
  });

  router.post('/appointment', (req, res) => {
    const { doctorName, patientName, mobileNo, age, gender, medicalAffiliation, selectedDate, selectedTime } = req.body;
    
    const formattedSelectedTime = moment(selectedTime, ['h:mm A']).format('HH:mm:ss');
  
    const appointmentquery = 'INSERT INTO Appointments_Ocean (doctorName, patientName, mobileNo, age, gender, medicalAffiliation, selectedDate, selectedTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(appointmentquery, [doctorName, patientName, mobileNo, age, gender, medicalAffiliation, selectedDate, formattedSelectedTime], (err, result) => {
      if (err) {
        console.error('Error saving data to database:', err);
        res.status(500).send('Error saving data to database');
      } else {
        res.status(200).send('Data saved successfully');
      }
    });
  });



  
  router.get('/appointments', (req, res) => {
    const appointmentQuery = 'SELECT * FROM Appointments_Ocean';
    db.query(appointmentQuery, (err, results) => {
      if (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        // Convert selectedDate from UTC to Indian time format
        const appointmentsWithIndianTime = results.map(appointment => ({
          ...appointment,
          selectedDate: moment.utc(appointment.selectedDate).tz('Asia/Kolkata').format(),
        }));
        res.status(200).json(appointmentsWithIndianTime);
      }
    });
  });


  router.get('/availableTimeSlots', (req, res) => {
    const { selectedDate } = req.query;
    const startTime = '17:00'; 
    const endTime = '20:00';  
  
    const getAppointmentsQuery = `SELECT TIME_FORMAT(selectedTime, '%h:%i %p') AS formattedTime FROM Appointments_Ocean WHERE selectedDate = ?`;
  
    db.query(getAppointmentsQuery, [selectedDate], (err, results) => {
      if (err) {
        console.error('Error retrieving appointments:', err);
        res.status(500).json({ error: 'Error retrieving appointments' });
        return;
      }
  
      const bookedTimeSlots = results.map(appointment => appointment.formattedTime);
  
      const availableTimeSlots = [];
      let currentTime = new Date(`2022-01-01T${startTime}:00`);
  
      while (currentTime <= new Date(`2022-01-01T${endTime}:00`)) {
        const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const formattedTimeWithZero = formattedTime.replace(/^(\d{1}):/, '0$1:'); 
        if (!bookedTimeSlots.includes(formattedTimeWithZero)) {
          availableTimeSlots.push(formattedTimeWithZero);
        }
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      }
  
      res.json(availableTimeSlots);
    });
  });
  

module.exports = router;
