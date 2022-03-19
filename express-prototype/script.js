import http from 'k6/http';
// import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";


export let options = {
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  vus: 50,
  duration: '30s',
};

export default () => {
  http.get('https://api.tortoise.team/books');
};

// export function handleSummary(data) {
//   return {
//     "summary.html": htmlReport(data),
//   };
// }