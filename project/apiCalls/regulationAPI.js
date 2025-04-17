// open GSA congress regulation API
import dotenv from 'dotenv';
dotenv.config({ path: "./apiCalls/.env" });
// dotenv.config({ path: "./.env" });

var apiKey = process.env.REGULATION_API_KEY;
const baseURL = "https://api.regulations.gov/v4/";
// https://api.regulations.gov/v4/documents?api_key=DEMO_KEY

var endpoint = "documents";
// filter rules and proposed rules
// https://api.regulations.gov/v4/documents?filter[documentType]=RULE&filter[documentType]=PRORULE&api_key=DEMO_KEY

// filter date range
// https://api.regulations.gov/v4/documents?filter[postedDate][ge]=2020-09-01&filter[postedDate][le]=2020-09-01&api_key=DEMO_KEY

// filter search term
// https://api.regulations.gov/v4/documents?filter[searchTerm]=water&api_key=DEMO_KEY

// filter agency
// https://api.regulations.gov/v4/documents?filter[agencyId]=EPA&api_key=DEMO_KEY



// do range of today up to 5 days ago, and if scroll further, go further back. for populating database, do 2 years

async function apiCall(date1, date2, query = '') {
  console.log(`Fetching Regulations with ${query}...`)

  var url = `${baseURL}${endpoint}?api_key=${apiKey}`;

  // const ruleRegFilter = '&filter[documentType]=Rule,Proposed%20Rule'
  // url += ruleRegFilter;

  if (date1 && date2) {
    url += `&filter[postedDate][ge]=${date1}&filter[postedDate][le]=${date2}&page[size]=250`;
  }

  url += query;

  // console.log(url);

  // transform data
  var rules = [];
  var proposedRules = [];

  let pageNum = 1;
  let hasNext = false;

  do {
    const urlPage = url + `&page[number]=${pageNum}`;
    const res = await fetch(urlPage);
    const data = await res.json();

    // console.log(data);

    // initial bulk get doesnt contain all the data i want, so do a second fetch for each doc to get
    // the CFR part and the full text files (pdf and/or htm)
    for await (const doc of data.data) {
      const docMore = await fetch(`${doc.links.self}?api_key=${apiKey}`);
      const docMoreJson = await docMore.json();

      // console.log(docMoreJson);
      // console.log(docMoreJson.attributes);

      const fileFormats = docMoreJson.data.attributes.fileFormats || [];
      const pdfUrl = fileFormats.length > 0 ? fileFormats[0].fileUrl : null;
      const htmUrl = fileFormats.length > 1 ? fileFormats[1].fileUrl : null;
      const docType = doc.attributes.documentType;

      var newDoc = {
        docType: docType,
        id: doc.id,
        docketId: doc.attributes.docketId,
        title: doc.attributes.title,
        postedDate: doc.attributes.postedDate,
        agencyId: doc.attributes.agencyId,
        cfrPart: docMoreJson.data.attributes.cfrPart,
        pdfUrl: pdfUrl,
        htmUrl: htmUrl,
      }

      if (docType === 'Rule') {
        rules.push(newDoc);
      } else if (docType === 'Proposed Rule') {
        proposedRules.push(newDoc);
      }
    }
    pageNum++;
    hasNext = data.meta.hasNextPage;

  } while (hasNext);

  var newData = {};
  if(rules.length > 0) newData.rules = rules;
  if(proposedRules.length > 0) newData.proposedRules = proposedRules;
  
  // newData.rules = rules;
  // newData.proposedRules = proposedRules;

  // console.log(JSON.stringify(newData, null, 2));
  console.log(`Fetched ${rules.length + proposedRules.length} items from Regulations under ${query}!`);
  return newData;
}

// apiCall('2024-01-01', '2024-01-15', '&filter[documentType]=Rule');

export { apiCall };