How to use API (endpoints in server.js)

Endpoints:

right now only supports GET requests
gets data from federal register about executive orders, and also congress.gov for congress bill actions

/data
- return latest data via api call

/data/lastest
- return latest data via api call

/data/yyyy-mm-dd
- return data from specific date

/data/yyyy-mm-dd..yyyy-mm-dd
- return data from date range
- for now DO NOT USE with range greater than 1 week

TODO:
- make work with database instead of API call every time
  - if exists in database, get from there. else, new api call and store in database and serve to user