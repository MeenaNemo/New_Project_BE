const express = require('express');
const db = require('../config');
const router = express.Router();

const createDoctorTableQuery = `
  CREATE TABLE IF NOT EXISTS Doctor_table (
    Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uhid VARCHAR(20),
    patientname VARCHAR(20),
    mobile_number VARCHAR(20),  -- Change data type to VARCHAR
    age INT(5),
    doctor_name VARCHAR(20),
    date DATE,
    height INT,
    weight INT,
    bp INT,
    temperature INT,
    prescription JSON,
    report JSON
  )
`;

db.query(createDoctorTableQuery, (error, result) => {
  if (error) {
    console.error("Error creating Doctor_table: " + error.message);
  } else {
    console.log("Table 'Doctor_table' created successfully");
  }
});


router.post('/saveprescription', (req, res) => {
    const formData = req.body;

  const insertQuery = 'INSERT INTO Doctor_table (uhid, patientname, mobile_number, age, doctor_name, date, height, weight, bp, temperature, prescription, report) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';

  db.query(insertQuery, [
    formData.uhid,
    formData.patientName,
    formData.mobileNumber,
    formData.age,
    formData.doctorName,
    formData.date,
    formData.height,
    formData.weight,
    formData.bp,
    formData.temperature,
    JSON.stringify(formData.prescription), // Assuming prescription is an object
    JSON.stringify(formData.report), // Assuming report is an object
  ], (err, result) => {
    if (err) {
      console.error('Error executing insert query:', err);
      res.status(500).json({ error: 'An error occurred while saving the form data' });
      return;
    }

    console.log('Form data saved successfully');
    res.status(200).json({ message: 'Form data saved successfully' });
  });
});


module.exports = router;