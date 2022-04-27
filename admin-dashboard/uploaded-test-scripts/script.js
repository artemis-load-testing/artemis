import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '1m30s',
};

export default () => {
    http.get('https://api.tortoise.team/books');
    sleep(1);
    http.get('https://bin.tortoise.team/');
    sleep(1);
};

