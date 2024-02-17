const express = require('express');
const db = require('../config');
const router = express.Router();

const createPatientDataTableQuery = `
  CREATE TABLE IF NOT EXISTS Patient_Data_Registration (
    uhid VARCHAR(20),
    Title VARCHAR(20),
    first_Name VARCHAR(50),
    last_Name VARCHAR(50),
    father_name VARCHAR(50),
    date_of_birth DATE,
    age INT,
    age_Unit VARCHAR(30),
    gender VARCHAR(20),
    Mobile_number VARCHAR(15),
    aadhar_number VARCHAR(16) UNIQUE,
    street1 VARCHAR(255),
    street2 VARCHAR(255),
    city_village VARCHAR(255),
    district VARCHAR(50),  
    state VARCHAR(50),
    country VARCHAR(50),
    registration_date DATE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (uhid, aadhar_number)
)`;

db.query(createPatientDataTableQuery, (error, result) => {
  if (error) {
    console.error("Error creating Patient_Data_Registration table: " + error.message);
  } else {
    console.log("Table 'Patient_Data_Registration' created successfully");
  }
});

function getNextUHID(callback) {
  const getLastUHIDQuery = 'SELECT MAX(SUBSTRING(uhid, 3) * 1) AS maxUHID FROM Patient_Data_Registration';
  db.query(getLastUHIDQuery, (error, result) => {
    if (error) {
      callback(error, null);
    } else {
      const lastUHIDNumber = result[0].maxUHID || 0;
      const nextUHIDNumber = lastUHIDNumber + 1;
      const nextUHID = 'DK' + nextUHIDNumber.toString().padStart(3, '0');
      callback(null, nextUHID);
    }
  });
}

router.post('/patient', (req, res) => {
  try {
    const patientData = req.body;

    getNextUHID((error, nextUHID) => {
      if (error) {
        console.error("Error getting next UHID: " + error.message);
        return res.status(500).json({ error: 'Error getting next UHID' });
      }

      patientData.uhid = nextUHID;

      const insertPatientDataQuery = `
      INSERT INTO Patient_Data_Registration SET ?  `;
      

      db.query(insertPatientDataQuery, patientData, (error, result) => {
        if (error) {
          console.error("Error inserting data into the database: " + error.message);
          if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Aadhar number already exists' });
          } else {
            res.status(500).json({ error: 'Error inserting data into the database' });
          }
        } else {
          console.log("Data inserted successfully");
          res.status(200).json({ uhid: nextUHID, message: 'Data inserted successfully' });
        }
      });
    });
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/patient/all', (req, res) => {
       const getAllPatientsQuery = 'SELECT * FROM Patient_Data_Registration';

    db.query(getAllPatientsQuery, (error, results) => {
      if (error) {
        console.error("Error fetching registered patients: " + error.message);
        return res.status(500).json({ error: 'Error fetching registered patients' });
      }

      res.status(200).json(results);
    });
  });

router.get('/patient/search', (req, res) => {
  const { uhidOrPhoneNumber } = req.query;

  const searchQuery = `
    SELECT * FROM Patient_Data_Registration 
    WHERE uhid = ? OR mobile_number = ? LIMIT 1
  `;

  db.query(searchQuery, [uhidOrPhoneNumber, uhidOrPhoneNumber], (error, result) => {
    if (error) {
      console.error("Error searching for patient:", error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (result.length > 0) {
        const patientData = result[0];
        res.json(patientData);
      } else {
        res.status(404).json({ error: 'Patient not found' });
      }
    }
  });
});

router.put('/patient/:identifier', (req, res) => {
  const identifier = req.params.identifier;
  const updatedPatientData = req.body;

  
  const updatePatientDataQuery = 'UPDATE Patient_Data_Registration SET ? WHERE uhid = ? OR Mobile_number = ?';

  db.query(updatePatientDataQuery, [updatedPatientData, identifier, identifier], (error, result) => {
    if (error) {
      console.error("Error updating data in the database: " + error.message);
      res.status(500).json({ error: 'Error updating data in the database' });
    } else {
      console.log("Data updated successfully");
      res.status(200).json({ identifier: identifier, message: 'Data updated successfully' });
    }
  });
});


module.exports = router;