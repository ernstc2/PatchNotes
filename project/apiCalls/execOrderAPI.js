const fields = [
  'citation',
  'document_number',
  'end_page',
  'html_url',
  'pdf_url',
  // 'type',
  // 'subtype',
  // 'publication_datdse',
  'signing_date',
  'title',
  // 'disposition_notes',
  'executive_order_number',
  'not_received_for_publication',
  // 'full_text_xml_url',
  'body_html_url',
  'json_url'
];

// var pres = 'donald-trump';

const baseURL = 'https://www.federalregister.gov/api/v1/documents.json?';

async function apiCall(dateStart = '2000-01-20', dateEnd = '2029-01-20') {
  console.log(`Fetching Executive Orders from ${dateStart} to ${dateEnd}...`);
  // api takes both date formats MM/DD/YYYY and YYYY-MM-DD. using second for consistency in server.js

  var params = new URLSearchParams({
    'conditions[correction]': 0,
    // 'conditions[president]': pres,
    'conditions[presidential_document_type]': 'executive_order',
    'conditions[signing_date][gte]': dateStart,
    'conditions[signing_date][lte]': dateEnd,
    'conditions[type][]': 'PRESDOCU',
    'include_pre_1994_docs': true,
    'maximum_per_page': 10000,
    'order': 'executive_order',
    'per_page': 2000 // 2000 is teh max per page, even if you set maximum_per_page to 10000. idk why its like this
  });

  // need to append each fields[] to params, bc for whatever reason putting it in the params declaration causes there to only be one
  fields.forEach((field) => {
    params.append('fields[]', field);
  });

  const url = baseURL + params.toString();

  // console.log(url);

  var newData = [];
  var hasNext = false;
  var newURL = url;

  do {
    const res = await fetch(newURL);
    const data = await res.json();

    newData.push(data.results);

    if (data.next_page_url){
      newURL = data.next_page_url;
      hasNext = true;
    } else {
      hasNext = false;
    }

  } while(hasNext);


  console.log(`Fetched ${newData.length} Executive Orders!`);
  // console.log(newData);
  return newData;
}

// console.log(await apiCall('2021-01-20', '2025-01-20'));

// await apiCall('2021-01-20', '2025-01-20');

export { apiCall };

// var data = await apiCall();
// console.log(data);

// https://www.federalregister.gov/api/v1/documents.json?
// conditions%5Bcorrection%5D=0&
// conditions%5Bpresident%5D=joe-biden&
// conditions%5Bpresidential_document_type%5D=executive_order&
// conditions%5Bsigning_date%5D%5Bgte%5D=01%2F20%2F2021&
// conditions%5Bsigning_date%5D%5Blte%5D=01%2F20%2F2025&
// conditions%5Btype%5D%5B%5D=PRESDOCU&
// fields%5B%5D=citation&
// fields%5B%5D=document_number&
// fields%5B%5D=end_page&
// fields%5B%5D=html_url&
// fields%5B%5D=pdf_url&
// fields%5B%5D=type&
// fields%5B%5D=subtype&
// fields%5B%5D=publication_date&
// fields%5B%5D=signing_date&
// fields%5B%5D=start_page&
// fields%5B%5D=title&
// fields%5B%5D=disposition_notes&
// fields%5B%5D=executive_order_number&
// fields%5B%5D=not_received_for_publication&
// fields%5B%5D=full_text_xml_url&
// fields%5B%5D=body_html_url&
// fields%5B%5D=json_url&
// include_pre_1994_docs=true&
// maximum_per_page=10000&
// order=executive_order&
// per_page=10000&
// page=9