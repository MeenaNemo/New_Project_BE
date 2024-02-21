const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const db = require('../config');

moment.tz.setDefault("Asia/Kolkata");

const router = express.Router();

const createUserTableQuery = `
  CREATE TABLE IF NOT EXISTS User_Inventory (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_first_name VARCHAR(255),
    user_last_name VARCHAR(255),
    user_email VARCHAR(255) UNIQUE,
    user_mobile_number VARCHAR(20),
    user_role VARCHAR(20),
    user_password VARCHAR(255),
    user_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_department VARCHAR(255)
  )
`;


const createEventHistoryTableQuery = `
CREATE TABLE IF NOT EXISTS Event_History (
  event_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_first_name VARCHAR(255),
  user_last_name VARCHAR(255),
  user_role VARCHAR(20),
  event_type ENUM('login', 'logout') NOT NULL,
  event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

db.query(createUserTableQuery, (error, result) => {
  if (error) {
    console.error("Error creating User_Inventory table: " + error.message);
  } else {
    console.log("Table 'User_Inventory' created successfully");
  }
});

db.query(createEventHistoryTableQuery, (error, result) => {
  if (error) {
    console.error("Error creating Event_History table: " + error.message);
  } else {
    console.log("Table 'Event_History' created successfully");
  }
});


const privateKey = "YourPrivateKeyHere";

router.post("/register", async (req, res) => {
  try {
    const reqData = req.body;

    if (!reqData || Object.keys(reqData).length === 0) {
      throw new Error("Please provide data.");
    }

    const existingEmailQuery =
      "SELECT COUNT(*) as count FROM User_Inventory WHERE user_email = ?";
    db.query(existingEmailQuery, [reqData.user_email], async (error, results) => {
      if (error) {
        throw new Error("Database error: " + error.message);
      }
      if (results[0].count > 0) {
        return res.status(400).json({
          status: 400,
          message: "Email already exists.",
          error: true,
        });
      }

      const enpPassword = await bcrypt.hash(reqData.user_password, 10);
      const istTimestamp = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

      const insertUserQuery = `
          INSERT INTO User_Inventory (user_first_name, user_last_name, user_email, user_mobile_number, user_role, user_password, user_timestamp, user_department)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

      const values = [
        reqData.user_first_name,
        reqData.user_last_name,
        reqData.user_email,
        reqData.user_mobile_number,
        reqData.user_role,
        enpPassword,
        istTimestamp,
        reqData.user_department
      ];

      db.query(insertUserQuery, values, (error, result) => {
        if (error) {
          throw new Error("Error inserting user: " + error.message);
        }

        res.status(200).json({
          status: 200,
          data: result,
          message: "User added successfully",
          error: false,
        });
      });
    });

  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ status: 500, message: "Internal server error.", error: true });
  }
});

router.get("/check-email", async (req, res) => {
  try {
    const userEmail = req.query.email;

    const existingEmailQuery =
      "SELECT COUNT(*) as count FROM User_Inventory WHERE user_email = ?";

    db.query(existingEmailQuery, [userEmail], (error, results) => {
      if (error) {
        return res.status(500).json({ status: 500, message: "Database error", error: true });
      }

      if (results[0].count > 0) {
        // Email exists
        return res.status(200).json({ status: 400, message: "Email already exists", error: true });
      } else {
        // Email does not exist
        return res.status(200).json({ status: 200, message: "Email available", error: false });
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 500, message: error.message, error: true });
  }
});



router.post("/login", async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;

    const getUserQuery = `
    SELECT * FROM User_Inventory WHERE user_email = ? OR user_mobile_number = ?
  `;

    db.query(
      getUserQuery,
      [loginIdentifier, loginIdentifier],
      async (error, results) => {
        if (error) {
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: "Invalid username and password" });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(
          password,
          user.user_password
        );

        if (!passwordMatch) {
          return res.status(401).json({ message: "Invalid password" });
        }

        if (results.length === 0 && !passwordMatch) {
          return res
            .status(401)
            .json({ message: "Invalid username and password" });
        }

        const token = jwt.sign({ user_id: user.user_id }, privateKey);


        const insertLoginEventQuery = `
        INSERT INTO Event_History (user_first_name, user_last_name, user_role, event_type, event_timestamp)
        VALUES (?, ?, ?, 'login', CONVERT_TZ(CURRENT_TIMESTAMP, 'UTC', 'Asia/Kolkata'))
      `;

        const loginEventValues = [user.user_first_name, user.user_last_name, user.user_role];

        db.query(insertLoginEventQuery, loginEventValues, (error, result) => {
          if (error) {
            console.error("Error inserting login event: " + error.message);
          }
        });


        res.status(200).json({
          status: 200,
          data: { token, user },
          message: "Login successful",
          error: false,
        });
      }
    );
  } catch (error) {
    res.status(400).json({ status: 400, message: error.message, error: true });
  }
});


router.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    const getUserQuery = `
      SELECT user_first_name, user_last_name, user_role
      FROM User_Inventory
      WHERE user_id = ?
    `;

    db.query(getUserQuery, [userId], async (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];

      const insertLogoutEventQuery = `
INSERT INTO Event_History (user_first_name, user_last_name, user_role, event_type, event_timestamp)
VALUES (?, ?, ?, 'logout', CONVERT_TZ(CURRENT_TIMESTAMP, 'UTC', 'Asia/Kolkata'))
`;



      const logoutEventValues = [user.user_first_name, user.user_last_name, user.user_role];

      db.query(insertLogoutEventQuery, logoutEventValues, (error, result) => {
        if (error) {
          console.error("Error inserting logout event: " + error.message);
        }
      });

      res.status(200).json({
        status: 200,
        message: "Logout successful",
        error: false,
      });
    });
  } catch (error) {
    res.status(400).json({ status: 400, message: error.message, error: true });
  }
});


router.get("/event-history", (req, res) => {
  const getEventHistoryQuery = `
    SELECT * FROM Event_History
    ORDER BY event_timestamp DESC;
  `;

  db.query(getEventHistoryQuery, (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Database error", error: true });
    }

    res.status(200).json({
      status: 200,
      data: results,
      message: "Event history retrieved successfully",
      error: false,
    });
  });
});


module.exports = router;