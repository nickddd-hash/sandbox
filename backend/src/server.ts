import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, dashaEnabled, supabaseEnabled } from './config.js';
import { sessionRoutes } from './routes/session.js';
import { leadRoutes } from './routes/lead.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: config.frontendOrigin || true,
  methods: ['GET', 'POST'],
});

app.get('/api/health', async () => ({
  ok: true,
  dasha: dashaEnabled() ? 'enabled' : 'simulator',
  supabase: supabaseEnabled() ? 'enabled' : 'disabled',
}));

await app.register(sessionRoutes);
await app.register(leadRoutes);

// Раздача собранного фронта (прод): задать STATIC_DIR=../frontend/dist.
if (config.staticDir) {
  const { default: fastifyStatic } = await import('@fastify/static');
  const { resolve } = await import('node:path');
  await app.register(fastifyStatic, { root: resolve(config.staticDir), wildcard: false });
  // SPA-фоллбэк: любой не-API путь отдаёт index.html.
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api')) return reply.code(404).send({ error: 'not_found' });
    return reply.sendFile('index.html');
  });
}

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(
    `sales-sandbox backend на :${config.port} (dasha: ${dashaEnabled() ? 'on' : 'simulator'})`,
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
