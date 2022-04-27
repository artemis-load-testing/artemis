import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 20,
  duration: '1m30s',
};

export default () => {
  http.get('https://test.k6.io');
  sleep(1);
  http.get('https://test.k6.io/news.php');
  sleep(1);
};
