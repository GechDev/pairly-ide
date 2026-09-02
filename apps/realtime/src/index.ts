import { buildServer } from './server.js';

const PORT = Number(process.env.PORT) || 4001;
const HOST = process.env.HOST || '0.0.0.0';

const server = buildServer({ logger: true });

async function main() {
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`[Pairly Realtime] Service listening on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
