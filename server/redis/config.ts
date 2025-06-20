import { createClient } from 'redis';
// TODO handle when active session exists

const client = createClient();
client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
	await client.connect();
})();

export default client
