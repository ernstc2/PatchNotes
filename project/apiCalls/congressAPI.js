import dotenv from 'dotenv';
dotenv.config({ path: "./apiCalls/.env" });
// dotenv.config({ path: "./.env" });


const baseURL = "https://api.congress.gov/v3/"; // https://gpo.congress.gov
const apiKey = process.env.CONGRESS_API_KEY;
// console.log(apiKey);
var endpoint = "bill";

// console.log(process.env)

async function apiCall(endpoint = 'bill', dateTime1, dateTime2) {
  console.log(`Fetching Congress ${endpoint}s...`)
  // console.log(`apiKey: ${apiKey}`);

  // console.log(dateTime1, dateTime2);

  // date: YYYY-MM-DDT00:00:00Z
  var url = `${baseURL}${endpoint}?api_key=${apiKey}&limit=250&fromDateTime=${dateTime1}&toDateTime=${dateTime2}&format=json`;
  var hasNext = false;
  var offset = 0;

  // console.log(url);

  var newData = [];

  do {
    const urlPage = url + `&offset=${offset}`;
    // console.log(`Fetching data from ${urlPage}`);

    const res = await fetch(urlPage);
    const data = await res.json();

    if(!data.error)

    // future proofing if other congress changes get added
    // also the endpoint is singular, but results are plural for some reason
    switch (endpoint) {
      case 'bill':
        newData.push(data.bills);
        break;
      case 'law':
        newData.push(data.laws);
        break;
      case 'amendment':
        newData.push(data.amendments);
        break;
      case summaries:
        newData.push(data.summaries);
        break;
      case 'congress':
        newData.push(data.congresses);
        break;
      case 'member':
        newData.push(data.members);
        break;
      case 'committee':
        newData.push(data.committees);
        break;
      case 'hearing':
        newData.push(data.hearings);
        break;
      case 'treaty':
        newData.push(data.treaties);
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    offset += 250;
    // console.log(data);
    // console.log(data.pagination.count);
    // if (data.pagination.next) {
    //   console.log(data.pagination.next);
    // }
  
    // console.log(offset);
    hasNext = (data.pagination.next && offset >= 1000) ? true : false;

    // hasNext = false; // testing, remove later

  } while (hasNext);


  console.log(`Fetched ${newData.length} ${endpoint} records!`);
  return newData;

}

// console.log(await apiCall('bill', '2025-04-10T00:00:00Z', '2025-04-13T00:00:00Z'));

// module.exports = {apiCall};

export { apiCall };
