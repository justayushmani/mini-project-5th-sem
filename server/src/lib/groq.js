import Groq from 'groq-sdk';
import env from '../config/env.js';

const groq = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

export default groq;
