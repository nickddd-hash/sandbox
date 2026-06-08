import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';

// In-memory SSE clients: sessionId → Set of raw response objects
const sseClients = new Map<string, Set<import('node:http').ServerResponse>>();

function broadcast(sessionId: string, data: string): void {
  const clients = sseClients.get(sessionId);
  if (!clients) return;
  const chunk = `data: ${data}\n\n`;
  for (const raw of clients) {
    try { raw.write(chunk); } catch { clients.delete(raw); }
  }
}

export async function toolEventRoutes(app: FastifyInstance): Promise<void> {
  // Dasha webhook: POST /api/tool-event?session=<sessionId>
  // Dasha передаёт toolName, args и sessionId (из additionalData).
  app.post('/api/tool-event', async (req, reply) => {
    const sessionId = (req.query as Record<string, string>).session ?? '';
    const body = (req.body ?? {}) as {
      toolName?: string;
      name?: string;
      args?: Record<string, unknown>;
      id?: string;
    };

    const toolName = body.toolName ?? body.name ?? '';
    if (!sessionId || !toolName) {
      return reply.code(400).send({ error: 'missing session or toolName' });
    }

    const event = { id: body.id ?? randomUUID(), name: toolName, args: body.args ?? {} };
    broadcast(sessionId, JSON.stringify(event));

    return reply.send({ result: { success: true } });
  });

  // SSE stream: GET /api/session/:id/events
  app.get('/api/session/:id/events', (req, reply) => {
    const sessionId = (req.params as { id: string }).id;

    reply.hijack();
    const raw = reply.raw;

    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    raw.write('data: {"type":"connected"}\n\n');

    if (!sseClients.has(sessionId)) sseClients.set(sessionId, new Set());
    sseClients.get(sessionId)!.add(raw);

    const keepAlive = setInterval(() => {
      try { raw.write(':ka\n\n'); } catch { clearInterval(keepAlive); }
    }, 20000);

    req.raw.on('close', () => {
      clearInterval(keepAlive);
      const clients = sseClients.get(sessionId);
      if (clients) {
        clients.delete(raw);
        if (clients.size === 0) sseClients.delete(sessionId);
      }
    });
  });
}
