import https from 'node:https';
import Groq from 'groq-sdk';
import env from '../config/env.js';

// Force IPv4 to prevent connection timeouts on networks with unrouted IPv6
const ipv4Agent = new https.Agent({
  family: 4,
  keepAlive: true,
});

const groq = env.groqApiKey
  ? new Groq({
      apiKey: env.groqApiKey,
      httpAgent: ipv4Agent,
    })
  : null;

export default groq;
