// this is a one time script to migrate dates from strings to all be the same Date() obj format
import { MongoClient, ServerApiVersion } from 'mongodb';

import dotenv from 'dotenv';
dotenv.config({ path: "../apiCalls/.env" });

const connString = process.env.DB_CONN;
const client = new MongoClient(connString, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
var db;


async function connectDB() {
  console.log("Connecting to MongoDB...");

  try {
    await client.connect();
    db = client.db("PatchNotes");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

// convert date strings from api call into Date() objects
function formatDates(doc) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}(\T\d{2}:\d{2}:\d{2}Z)?$/;

  Object.keys(doc).forEach((key) => {
    const val = doc[key];

    if (typeof val === 'string' && dateRegex.test(val)) {
      // convert the string to a Date object if it matches the pattern
      doc[key] = new Date(val);
    }
  });

  return doc;
}

async function migrate(collection) {
  const coll = db.collection(collection);
  const docs = await coll.find({}).toArray();

  const ops = docs.map(doc => {
    const updatedDoc = formatDates(doc);
    return {
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: updatedDoc },

      }
    }
  });

  if (ops.length > 0) {
    const result = await coll.bulkWrite(ops);
    console.log(`Updated documents in ${collection}`);
  }
  return
}

await connectDB()
await Promise.all([
  migrate("Congress_Bills"),
  migrate("Exec_Orders"),
  migrate("Regulations"),
  migrate("Proposed_Regulations")
])
process.exit(0);
