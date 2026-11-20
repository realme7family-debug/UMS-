const mongoose = require("mongoose");

let mongod = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.warn(`Local MongoDB connection failed (${err.message}). Starting embedded MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      mongod = await MongoMemoryServer.create({
        instance: { dbName: "ums" },
      });
      const uri = mongod.getUri();
      process.env.MONGO_URI = uri;
      const conn = await mongoose.connect(uri);
      console.log(`Embedded MongoDB connected: ${uri}`);
    } catch (memErr) {
      console.error("Failed to start embedded MongoDB:", memErr.message);
      process.exit(1);
    }
  }

  // Auto-seed if database is empty
  try {
    const Admin = require("../models/Admin");
    const count = await Admin.countDocuments();
    if (count === 0) {
      console.log("Database is empty. Seeding initial demo data...");
      const seed = require("../utils/seed");
      await seed(true);
      console.log("Database seeded successfully!");
    }
  } catch (seedErr) {
    console.warn("Auto-seed notice:", seedErr.message);
  }
};

module.exports = connectDB;
