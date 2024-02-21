const express = require('express');
const db = require('../config');
const router = express.Router();

const createDoctorTableQuery = `
  CREATE TABLE IF NOT EXISTS Medicine_Table(
    Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uhid VARCHAR(20),
    patientname VARCHAR(50),
    mobile_number VARCHAR(20),
    gender VARCHAR(20),  
    age VARCHAR(10),
    doctor_name VARCHAR(20),
    date DATE,
    medicalaffiction TEXT,
    prescription JSON

  )
`;

db.query(createDoctorTableQuery, (error, result) => {
  if (error) {
    console.error("Error creating Doctor_table: " + error.message);
  } else {
    console.log("Table Medicine_Table created successfully");
  }
});

router.post('/saveprescription', async (req, res) => {
  const formData = req.body;
  console.log('Received form data:', formData); // Log the received form data

  const currentDate = new Date().toISOString().slice(0, 10);

  try {
    // Insert data into Medicine_Table
    const insertQuery = 'INSERT INTO Medicine_Table (uhid, patientname, mobile_number, gender, age, doctor_name, date,medicalaffiction, prescription) VALUES (?,?,?,?,?,?,?,?,?)';
    const insertValues = [
      formData.uhid,
      formData.patientName,
      formData.mobileNumber,
      formData.gender,
      formData.age,
      formData.doctorName,
      currentDate,
      formData.medicalaffiction,
      JSON.stringify(formData.prescription)
    ];

    console.log('Inserting data into Medicine_Table:', insertValues);

    await db.query(insertQuery, insertValues);

    console.log('Form data saved successfully');
    res.status(200).json({ message: 'Form data saved successfully' });
  } catch (error) {
    console.error('Error during transaction:', error.message);

    res.status(500).json({ error: 'An error occurred while saving the form data', details: error.message });
  }
});


router.get('/getprescription/all', async (req, res) => {
  try {
    const selectQuery = 'SELECT * FROM Medicine_Table';
    console.log('Executing query:', selectQuery); 

    db.query(selectQuery, (error, result) => {
      if (error) {
        console.error('Error while executing query:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching prescription data' });
      } else {
        console.log('Query result:', result); 
        if (result.length > 0) {
          res.status(200).json({ historyData: result });
        } else {
          res.status(404).json({ error: 'No prescription data found' });
        }
      }
    });
  } catch (error) {
    console.error('Error while fetching prescription:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching prescription data' });
  }
});

router.get('/getprescription/:uhid', async (req, res) => {
  const { uhid } = req.params; // Use req.params to get the value from the route parameter
  console.log(uhid);

  const selectQuery = 'SELECT * FROM Medicine_Table WHERE uhid = ?';

  db.query(selectQuery, [uhid], (error, result) => {
    if (error) {
      console.error('Error fetching prescription data:', error.message);
      res.status(500).json({ error: 'An error occurred while fetching prescription data' });
    } else {
      if (result.length > 0) {
        res.status(200).json({ prescriptionData: result });
      } else {
        res.status(404).json({ error: 'No prescription data found' });
      }
    }
  });
});







router.get('/patient/searchname', (req, res) => {
  const { uhid } = req.query;

  const searchQuery = `
    SELECT title, first_Name, last_Name, age, age_Unit, gender, Mobile_number FROM Patient_Data_Registration 
    WHERE uhid = ? LIMIT 1
  `;

  db.query(searchQuery, [uhid], (error, result) => {
    if (error) {
      console.error('Error searching for patient:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (result.length > 0) {
        const patientData = result[0];
        // Concatenate title, first_Name, and last_Name
        const fullName = `${patientData.title} ${patientData.first_Name} ${patientData.last_Name}`;
        const age = `${patientData.age}${patientData.age_Unit}`;
        
        res.json({ patient_name: fullName, age: age, gender: patientData.gender, Mobile_number: patientData.Mobile_number });
      } else {
        res.status(404).json({ error: 'Patient not found' });
      }
    }
  });
});



module.exports = router;