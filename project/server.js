import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { body, validationResult } from 'express-validator';
import { apiCall as execOrderAPI } from './apiCalls/execOrderAPI.js';
import { apiCall as congressAPI } from './apiCalls/congressAPI.js';
import { apiCall as regulationAPI } from './apiCalls/regulationAPI.js';
import { apiCall as geminiAPI } from './apiCalls/geminiAPI.js'; // import gemini api function
import bcrypt from 'bcrypt';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

//Our app
const app = express();
const port = 3000;


//Serve frontend files
app.use(express.static('/public'));
app.use(express.json());

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

// checks if db is up to date
async function isDBUpdated() {
  console.log("Checking if database is updated...");


  const metaDataCollection = db.collection("metadata");
  const dbUpdated = await metaDataCollection.findOne({ id: "dbUpdate" });
  const now = new Date();
  // testing purposes 04/11/2025
  // const now = new Date('2025-04-11T00:00:00Z');
  const lastUpdated = dbUpdated.lastUpdated;

  console.log(`Last updated: ${lastUpdated}`);
  console.log(`Current Time: ${now}`);

  const returnVal = {
    lastUpdated: lastUpdated,
    isUpdated: true,
    now: now
  }

  // check document exists. if not, make it
  if (!dbUpdated) {
    const newDoc = {
      id: "dbUpdate",
      lastUpdated: new Date()
    }
    await metaDataCollection.insertOne(newDoc);
    returnVal.isUpdated = true;
  }

  //check if document older than 12 hours
  const diff = Math.abs(now - lastUpdated);
  // console.log(`Difference: ${diff}`);
  const diffHours = Math.floor((diff / (1000 * 60 * 60)));

  console.log(`Last updated ${diffHours} hours ago...`);

  // if db older than 12 hours, needs update
  if (diffHours >= 12) {
    returnVal.isUpdated = false;
  }

  return returnVal;
}

//Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: connString,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}));




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

async function apiCalls(fromDateTimeD, toDateTimeD) {
  // split by '.' to remove milliseconds, add back Z
  const fromDateTime = fromDateTimeD.toISOString().split('.')[0] + 'Z'; // YYYY-MM-DDTHH:MM:SSZ 
  const toDateTime = toDateTimeD.toISOString().split('.')[0] + 'Z'; // YYYY-MM-DDTHH:MM:SSZ

  // date is just YYYY-MM-DD, dateTime is YYYY-MM-DDTHH:MM:SSZ
  const fromDate = fromDateTime.split('T')[0];  // YYYY-MM-DD
  const toDate = toDateTime.split('T')[0]; // YYYY-MM-DD



  // api calls are async functions, so need to wait for both to finish before sending data
  try {
    const [execOrders, bills, { rules: regs, proposedRules: proRegs }] = await Promise.all([
      execOrderAPI(fromDate, toDate),
      congressAPI('bill', fromDateTime, toDateTime),
      regulationAPI(fromDate, toDate, '&filter[documentType]=Rule,Proposed%20Rule'),
    ]);
    return { execOrders, bills, regs, proRegs };
  } catch (err) {
    console.log('error:', err);
    return { error: err };
  }

  return { error: 'something went horribly wrong' };
}

async function addAllToDB(fromDateTime, toDateTime) {
  const { execOrders, bills, regs, proRegs } = await apiCalls(fromDateTime, toDateTime);

  await Promise.all([
    addToDB('Exec_Orders', execOrders[0], ['title', 'signing_date']),
    addToDB('Congress_Bills', bills[0], ['title', 'action_text']),
    addToDB('Regulations', regs, ['title', 'docketId']),
    addToDB('Proposed_Regulations', proRegs, ['title', 'docketId'])
  ]);

  console.log("All collections updated!");
}

// makes api calls 
async function updateDB() {
  const updated = await isDBUpdated();

  const toDateTime = updated.now // YYYY-MM-DDTHH:MM:SSZ
  const fromDateTime = updated.lastUpdated


  if (updated.isUpdated) {
    console.log("Database already up to date!\n");
    return;
  }

  console.log("Updating database...");

  try {
    await addAllToDB(fromDateTime, toDateTime);

    // update metadata collection with last updated date
    // commented out for testing
    const metaDataCollection = db.collection("metadata");
    const dbUpdated = await metaDataCollection.findOne({ id: "dbUpdate" });
    dbUpdated.lastUpdated = updated.now;
    await metaDataCollection.updateOne({ id: "dbUpdate" }, { $set: dbUpdated });

  } catch (err) {
    console.log("Error updating database: ", err);
    // console.error("Error updating database.");
    return err;
  }
}

// INITIALIZE DB AND SERVER -----------------------------------------------------------------------------

async function init() {
  try {
    await connectDB();
    console.log("Connected to MongoDB!");

    await updateDB();
    console.log("Database up to date!");

    // serve frontend files
    app.use(express.static('public'));

    // start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}!\n`);
    });

  } catch (err) {
    console.log("Error: ", err);
    process.exit(1);
  }
}

await init();

// GET DATA FROM DB -----------------------------------------------------------------------------------

// input date or dateTime depending on what is necessary
async function getDBData(collection, filter = {}) {
  try {
    if (!db) {
      throw new Error("Database not connected!");
    }

    const collObj = db.collection(collection);
    const docs = await collObj.find(filter);//.toArray();

    // docs.toArray()

    if (!docs) {
      throw new Error("No documents found in collection!");
    }
    // console.log(docs);

    return docs.toArray();

  } catch (err) {
    console.log("Error getting data from DB: ", err);
    return { error: err };
  }
}

// implementation to get today's data
async function dateRange(collection = 'all', fromDate, toDate, dateField = 'signing_date', filter = { $gte: fromDate, $lte: toDate }) {
  var data = {};

  await updateDB();
  console.log(`Fetching latest in ${collection}...`);


  if (collection == 'all') {
    const [execOrders, bills, regulations, proposedRegulations] = await Promise.all([
      getDBData('Exec_Orders', { signing_date: filter }),
      getDBData('Congress_Bills', { action_date: filter }),
      getDBData('Regulations', { postedDate: filter }),
      getDBData('Proposed_Regulations', { postedDate: filter })
    ]);

    data = {
      execOrders,
      bills,
      regulations,
      proposedRegulations
    };

  } else {
    data = await getDBData(collection, { [dateField]: filter });
  }

  // var data = await apiCalls(date, date, date1Congress, date2Congress);
  return data;
}


// DATA ENDPOINTS -------------------------------------------------------------------------------------------------------

const validCollections = {
  'execOrders': 'Exec_Orders',
  'bills': 'Congress_Bills',
  'regulations': 'Regulations',
  'proposedRegulations': 'Proposed_Regulations',
  'all': 'all'
};

const dateFields = {
  'execOrders': 'signing_date',
  'bills': 'action_date',
  'regulations': 'postedDate',
  'proposedRegulations': 'postedDate',
};

async function getCollections(req, fromDate, toDate) {
  const collections = req.query.collections
    ? req.query.collections.split(',')
    : ['all'];

  // console.log(collections);
  // console.log(Array.isArray(collections));

  var data = {};

  if (collections.includes('all')) {
    data = await dateRange('all', fromDate, toDate);

  } else {

    for (const collection of collections) {
      if (!(collection in validCollections)) {
        return { error: `Invalid collection: ${collection}` };
      }

      data[collection] = await dateRange(validCollections[collection], fromDate, toDate, dateFields[collection]);
    }
  }
  return data;
}

// default return most recent 250 items, with pagination
app.get('/data', async (req, res) => {
  // var data = await dateRange();

  const data = { TEST: "THIS IS A TEST RETURN FOR /data, FIX THIS LATER!!!!!!!!!!!!!" };

  if (data.error) {
    res.status(500).json({ error: data.error });
  } else {
    console.log(data);
    res.json(data);
  }
});

// latest data (last 1 week), no pagination
app.get('/data/latest', async (req, res) => {
  const now = new Date()
  const fromDate = new Date(now - (7 * 24 * 60 * 60 * 1000));

  const data = await getCollections(req, fromDate, now);

  if (data.error) {
    res.status(500).json({ error: data.error });
  } else {
    // console.log(data);
    res.json(data);
  }
});

// latest data (last however many days), no pagination
app.get('/data/latest/:days', async (req, res) => {
  const now = new Date()
  const fromDate = new Date(now - (req.params.days * 24 * 60 * 60 * 1000)); // default 7 days ago

  // const dbQuery = {};
  const data = await dateRange('all', fromDate, now);
  if (data.error) {
    res.status(500).json({ error: data.error });
  } else {
    // console.log(data);
    res.json(data);
  }
});

// data for specific date range. stole the way frankfurter api handles date ranges
// this one MUST be above single date endpoint, otherwise it will be stupid and treat second date as part of first day
app.get('/data/:yyyy1-:mm1-:dd1..:yyyy2-:mm2-:dd2', async (req, res) => {
  const { yyyy1, mm1, dd1, yyyy2, mm2, dd2 } = req.params;
  var date1 = new Date(`${yyyy1}-${mm1}-${dd1}`);
  var date2 = new Date(`${yyyy2}-${mm2}-${dd2}`);
  date2.setHours(23, 59, 59, 999); // set to end of day

  const data = await getCollections(req, date1, date2);
  
  if (data.error) {
    res.status(500).json({ error: data.error });
  } else {

    res.json(data);
  }
});

// data for specific date
app.get('/data/:yyyy-:mm-:dd', async (req, res) => {
  const { yyyy, mm, dd } = req.params;
  var date1 = new Date(`${yyyy}-${mm}-${dd}`);
  var date2 = new Date(`${yyyy}-${mm}-${dd}`); // for some reason this works but date2 = date1 doesnt work????
  date2.setHours(23, 59, 59, 999); // set to end of day

  const data = await getCollections(req, date1, date2);

  if (data.error) {
    res.status(500).json({ error: data.error });
  } else {
    res.json(data);
  }

});


// USER ENDPOINTS ----------------------------------------------------------------------------

//user registration
app.post('/user/register', [
  // Email validation
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  // Password validation
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')], async (req, res) => {


      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = req.body.email;
      const password = req.body.password;
      try {

        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
          return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
          email,
          password: hashedPassword,
          createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        req.session.userId = result.insertedId;
        req.session.email = email;

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          userId: result.insertedId
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
      }
    });

// Returns true if user is logged in
app.get('/user/authenticated', async (req, res) => {
    res.json({
        authenticated: !!req.session.email  // Convert to boolean
    });
});

//user login
app.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email
    const user = await db.collection('users').findOne({ email });

    // If user doesn't exist or password doesn't match
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare submitted password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Store user information in session
    req.session.userId = user._id;
    req.session.email = user.email;

    // Password is valid, return success with user info (excluding password)
    const userResponse = {
      userId: user._id,
      email: user.email,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

//Logout
app.post('/user/logout', (req, res) => {
    if (!req.session.email) {
        return res.status(509).json({message: "User is not logged in."});
    }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to logout' });
    } 
    res.clearCookie('connect.sid'); // The default name of the session cookie
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
});

// Check if User is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  // User is not authenticated
  res.status(401).json({ success: false, message: 'Authentication required' });
};

app.post('/data/bookmark', isAuthenticated, async (req, res) => {

  /*
  example body 
  {
      id: (mongo _id object)
      type: bill / order / regulation / proposed 
  }
  */
  const data = req.body;
  const docId = data.id;
  const bookmarkType = data.type;
  const user = req.session.email;

  //get the user object
  const userDocument = await db.collection("users").findOne({ email: user });
  if (!userDocument) {
    return res.status(404).json({ error: "A user with this email could not be found" });
  }
  const bookmarks = userDocument.bookmarks || [];
  const alreadyExists = bookmarks.find(item => item.id.$oid == docId.$oid);
  //remove the bookmark if it is already bookmarked
  if (alreadyExists) {
    const indexToRemove = bookmarks.findIndex(item => item.id == docId);
    bookmarks.splice(indexToRemove, 1);

    const result = await db.collection("users").updateOne(
      { email: user },
      { $set: { bookmarks } }
    );

    return res.json({ message: "Item successfully unbookmarked" });
  }
  //bookmark the document
  const result = await db.collection("users").updateOne(
    { email: user },
    {
      $push: {
        bookmarks: {
          id: docId,
          type: bookmarkType
        }
      }
    }
  );

  if (!result.acknowledged) {
    res.status(500).json({ error: "Something went wrong bookmarking this item." })
  }

  res.json({ success: true, message: 'Item successfully bookmarked' });
});


//get user bookmarks
app.get('/user/bookmarks', isAuthenticated, async (req, res) => {
  const user = req.session.email;
  const userDoc = await db.collection("users").findOne({ email: user });
  if (!userDoc) {
    return res.status(404).json({ error: "User not found" });
  }

  var bookmarksByType = {
    bill: [],
    order: [],
    regulation: [],
    proposed: []
  };

  // Process bookmarks and extract just the ID strings from the $oid objects
  console.log(userDoc.bookmarks);
  for (const b of userDoc.bookmarks) {
    if (bookmarksByType.hasOwnProperty(b.type)) {
      // Extract the string ID from the $oid object
      
      console.log(b.id);
      console.log(b.title);
      const idString = b.id.$oid;
      bookmarksByType[b.type].push(new ObjectId(idString));
    } else {
      console.warn("Unknown bookmark type:", b.type); // For debugging
    }
  }

  const [bill, order, regulation, proposed] = await Promise.all([
    db.collection('Congress_Bills').find({ _id: { $in: bookmarksByType.bill } }).toArray(),
    db.collection('Exec_Orders').find({ _id: { $in: bookmarksByType.order } }).toArray(),
    db.collection('Regulations').find({ _id: { $in: bookmarksByType.regulation } }).toArray(),
    db.collection('Proposed_Regulations').find({ _id: { $in: bookmarksByType.proposed } }).toArray()
  ]);

  res.json({
    bill,
    order,
    regulation,
    proposed
  });
});


// AI SUMMARY ENDPOINTS -----------------------------------------------------------------------

// gemini test
app.post('/test-ai', async (req, res) => {
  const prompt  = req.body.prompt;

  try {
    const data = await geminiAPI(prompt); // Call the geminiAPI function with the prompt
    res.json(data);
  } catch (error) {
    console.error("Error calling geminiAPI:", error);
    res.status(500).json({ error: "An error occurred while calling the AI API" });
  }
});

app.post('/summarize', async (req, res) => {
  const { prompt } = req.body;
  try {
      const geminiRes = await geminiAPI(prompt);
      const text = geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text || "No summary available.";
      res.json({ summary: text });
  } catch (error) {
      console.error("Error summarizing:", error);
      res.status(500).json({ message: "Failed to summarize" });
  }
});

// // gemini exec order summarizer
// app.get('summarize/execorder', async (req, res) => {
//   try {
//     const { prompt } = req.params; // Extract the prompt from the route parameter
//     const data = await apiCall("hello"); // Call the geminiAPI function with the prompt
//     res.json(data);
//   } catch (error) {
//     console.error("Error calling geminiAPI:", error);
//     res.status(500).json({ error: "An error occurred while calling the AI API" });
//   }
// });

// // gemini bill summarizer
// app.get('summarize/bill', async (req, res) => {
//   try {
//     const { prompt } = req.params; // Extract the prompt from the route parameter
//     const data = await apiCall("hello"); // Call the geminiAPI function with the prompt
//     res.json(data);
//   } catch (error) {
//     console.error("Error calling geminiAPI:", error);
//     res.status(500).json({ error: "An error occurred while calling the AI API" });
//   }
// });

