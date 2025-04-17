import dotenv from 'dotenv';
dotenv.config({path: "./apiCalls/.env"});

const baseURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const apiKey = process.env.GEMINI_API_KEY;

// console.log(process.env)

async function apiCall(prompt="") {
    const url = `${baseURL}?key=${apiKey}`;
    
    const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt}
            ]
          }
        ]
      };
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        const data = await res.json();
        return data;
    } catch (err) {
        console.log('error: ', err);
        return err;
    }
}

// var data = await apiCall();
// console.log("Gemini Response", data.candidates[0].content);
// "What is the most recent executive order? Give me a detailed summary. Respond only in plain text, no markup language, paragraph indents, or anything of the sort"
// module.exports = {apiCall};

export {apiCall};
