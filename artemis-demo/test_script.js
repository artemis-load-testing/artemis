import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  vus: 10,
  duration: '5m12s',
};

export default function () {
  http.get('https://pokeapi.co/api/v2/pokemon/ditto');
  sleep(1);
}
