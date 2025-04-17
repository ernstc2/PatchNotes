import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { apiCall as execOrderAPI } from '../apiCalls/execOrderAPI.js';
import dotenv from 'dotenv';
dotenv.config({ path: "../apiCalls/.env" });

//MongoDB Connection string
const connString = process.env.DB_CONN;
const client = new MongoClient(connString, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//Connect to mongo
let db;
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


// takes array of strings to check if entry already exists in db
// array so that multiple filters can be used to check for duplicates
// for example, bills would be title and action_text, whereas exec orders might just be title or doc number
async function addToDB(collection, data, uniqueFields = ['title']) {
  console.log(`Updating collection ${collection}...`);
  // console.log(`${JSON.stringify(data)}`)
  const collObj = db.collection(collection);

  // check if data is empty
  if (data === undefined || !Array.isArray(data) || data[0] == null) {
    console.log(`No new data to update for ${collection}!`);
    return;
  }

  const operations = data.map((item) => {
    item = formatDates(item); // format dates to Date() objects
    const filter = {};

    // build filter
    uniqueFields.forEach((field) => {
      filter[field] = item[field];
    });

    return {
      updateOne: {
        filter,
        update: { $setOnInsert: item },
        upsert: true // if not found, insert
      }
    }
  });

  const result = await collObj.bulkWrite(operations);
  console.log(`Inserted ${result.upsertedCount} documents into ${collection}`);
}


await connectDB();
const fromDate = new Date('2025-01-01');
const toDate = new Date('2025-04-14');

const data = await execOrderAPI(fromDate, toDate);
// console.log(data);
await addToDB('Exec_Orders', data[0], ['title', 'signing_date']);

console.log("Database updated!\n");

process.exit(0);
