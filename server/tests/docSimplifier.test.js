process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import docSimplifierRoutes from '../src/routes/docSimplifier.routes.js';
import errorHandler from '../src/middleware/errorHandler.js';
import {
  setGeminiClient,
  simplifyDocument,
  validateDocumentSummaryResult,
  DISCLAIMER_EN,
  DISCLAIMER_HI,
} from '../src/services/ai/gemini.service.js';
import env from '../src/config/env.js';
import logger from '../src/utils/logger.js';

// Setup tiny isolated test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/doc-simplifier', docSimplifierRoutes);
app.use(errorHandler);

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/doc-simplifier`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

// Magic bytes helpers
const VALID_PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const VALID_JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const VALID_PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');

const SAMPLE_VALID_RESULT = {
  documentType: 'Legal Notice',
  summary: 'This is a formal legal notice regarding municipal property tax assessment.',
  keyPoints: ['Issued by the City Municipal Corporation', 'Assessment year 2024-25'],
  datesAndAmounts: [{ label: 'Due Date', value: '31 March 2025' }],
  obligations: ['Submit self-assessment declaration within 30 days'],
  redFlags: ['18% annual penalty interest if unpaid by due date'],
  nextSteps: ['Visit the citizen portal or ward office with property tax receipt'],
  unreadable: false,
  lowConfidence: false,
};

test('1. Rejects request with no file (400)', async () => {
  const fd = new FormData();
  fd.append('consent', 'true');
  fd.append('language', 'en');

  const res = await fetch(`${baseUrl}/simplify`, {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /file.*required/i);
});

test('2. Rejects wrong reported mime type (400)', async () => {
  const fd = new FormData();
  fd.append('file', new Blob([Buffer.from('not an image or pdf')], { type: 'text/plain' }), 'test.txt');
  fd.append('consent', 'true');

  const res = await fetch(`${baseUrl}/simplify`, {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /invalid file type/i);
});

test('3. Rejects fake extension with wrong magic bytes (400)', async () => {
  const fd = new FormData();
  // Name ends with .png, but content is arbitrary ASCII
  fd.append('file', new Blob([Buffer.from('This is fake text, not a PNG')], { type: 'image/png' }), 'fake.png');
  fd.append('consent', 'true');

  const res = await fetch(`${baseUrl}/simplify`, {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /magic|invalid file content/i);
});

test('4. Rejects file over 10 MB with 413 Payload Too Large', async () => {
  const fd = new FormData();
  // 10 MB + 1 KB with valid PNG magic header
  const largeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1024);
  VALID_PNG_BYTES.copy(largeBuffer, 0);

  fd.append('file', new Blob([largeBuffer], { type: 'image/png' }), 'large.png');
  fd.append('consent', 'true');

  const res = await fetch(`${baseUrl}/simplify`, {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  assert.strictEqual(res.status, 413);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /exceeds.*10\s*mb/i);
});

test('5. Rejects missing or false consent (400)', async () => {
  // Test missing consent
  const fd1 = new FormData();
  fd1.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'test.png');

  const res1 = await fetch(`${baseUrl}/simplify`, {
    method: 'POST',
    body: fd1,
  });
  assert.strictEqual(res1.status, 400);

  // Test consent = 'false'
  const fd2 = new FormData();
  fd2.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'test.png');
  fd2.append('consent', 'false');

  const res2 = await fetch(`${baseUrl}/simplify`, {
    method: 'POST',
    body: fd2,
  });
  assert.strictEqual(res2.status, 400);
});

test('6. Rejects unsupported language parameter (400)', async () => {
  const fd = new FormData();
  fd.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'test.png');
  fd.append('consent', 'true');
  fd.append('language', 'fr'); // French not supported

  const res = await fetch(`${baseUrl}/simplify`, {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.success, false);
  assert.match(data.message, /invalid language/i);
});

test('7. Missing key gives 503 "not configured" with rest of app unaffected', async () => {
  const origKey = env.geminiApiKey;
  env.geminiApiKey = '';
  setGeminiClient(null);

  try {
    const fd = new FormData();
    fd.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'test.png');
    fd.append('consent', 'true');

    const res = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    assert.strictEqual(res.status, 503);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /not configured/i);
  } finally {
    env.geminiApiKey = origKey;
  }
});

test('8. Fake success gives correct disclaimer in en and hi', async () => {
  // Mock fake client
  const fakeClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify(SAMPLE_VALID_RESULT),
      }),
    },
  };
  setGeminiClient(fakeClient);

  try {
    // English request
    const fdEn = new FormData();
    fdEn.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'doc.png');
    fdEn.append('consent', 'true');
    fdEn.append('language', 'en');

    const resEn = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fdEn,
    });
    const dataEn = await resEn.json();
    assert.strictEqual(resEn.status, 200);
    assert.strictEqual(dataEn.success, true);
    assert.strictEqual(dataEn.data.documentType, 'Legal Notice');
    assert.strictEqual(dataEn.data.disclaimer, DISCLAIMER_EN);

    // Hindi request
    const fdHi = new FormData();
    fdHi.append('file', new Blob([VALID_PDF_BYTES], { type: 'application/pdf' }), 'doc.pdf');
    fdHi.append('consent', 'true');
    fdHi.append('language', 'hi');

    const resHi = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fdHi,
    });
    const dataHi = await resHi.json();
    assert.strictEqual(resHi.status, 200);
    assert.strictEqual(dataHi.success, true);
    assert.strictEqual(dataHi.data.disclaimer, DISCLAIMER_HI);
  } finally {
    setGeminiClient(null);
  }
});

test('9. Fake 429 gives 429 friendly message and exactly 1 call', async () => {
  let callCount = 0;
  const fakeClient = {
    models: {
      generateContent: async () => {
        callCount++;
        const err = new Error('Resource exhausted: quota exceeded (429)');
        err.status = 429;
        throw err;
      },
    },
  };
  setGeminiClient(fakeClient);

  try {
    const fd = new FormData();
    fd.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'doc.png');
    fd.append('consent', 'true');

    const res = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    assert.strictEqual(callCount, 1, '429 must not be retried (exactly 1 call)');
    assert.strictEqual(res.status, 429);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /busy.*retry/i);
  } finally {
    setGeminiClient(null);
  }
});

test('10. Fake 404 gives 502 Bad Gateway', async () => {
  const fakeClient = {
    models: {
      generateContent: async () => {
        const err = new Error('Model not found (404)');
        err.status = 404;
        throw err;
      },
    },
  };
  setGeminiClient(fakeClient);

  try {
    const fd = new FormData();
    fd.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'doc.png');
    fd.append('consent', 'true');

    const res = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    assert.strictEqual(res.status, 502);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /unavailable/i);
  } finally {
    setGeminiClient(null);
  }
});

test('11. Invalid model JSON is retried once, then returns 502', async () => {
  let callCount = 0;
  const fakeClient = {
    models: {
      generateContent: async () => {
        callCount++;
        // Return broken non-JSON string
        return { text: 'I cannot parse this document' };
      },
    },
  };
  setGeminiClient(fakeClient);

  try {
    const fd = new FormData();
    fd.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'doc.png');
    fd.append('consent', 'true');

    const res = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    assert.strictEqual(callCount, 2, 'Must retry exactly once (total 2 attempts)');
    assert.strictEqual(res.status, 502);
    assert.strictEqual(data.success, false);
  } finally {
    setGeminiClient(null);
  }
});

test('12. Mock mode returns mock: true', async () => {
  const origMock = env.docSimplifierMock;
  env.docSimplifierMock = true;

  try {
    const fd = new FormData();
    fd.append('file', new Blob([VALID_JPEG_BYTES], { type: 'image/jpeg' }), 'doc.jpg');
    fd.append('consent', 'true');

    const res = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.mock, true);
    assert.ok(data.data.documentType);
    assert.ok(data.data.disclaimer);
  } finally {
    env.docSimplifierMock = origMock;
  }
});

test('13. No log output contains file bytes, base64, or extracted text', async () => {
  const capturedLogs = [];
  const origError = logger.error;
  const origWarn = logger.warn;
  const origInfo = logger.info;

  const intercept = (msg) => {
    capturedLogs.push(String(msg));
  };

  logger.error = intercept;
  logger.warn = intercept;
  logger.info = intercept;

  const secretString = 'SECRET_TOKEN_IN_FILE_DO_NOT_LOG_XYZ123';
  const fileBytes = Buffer.from(`%PDF-1.4\n${secretString}\n%%EOF`);

  const fakeClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify(SAMPLE_VALID_RESULT),
      }),
    },
  };
  setGeminiClient(fakeClient);

  try {
    const fd = new FormData();
    fd.append('file', new Blob([fileBytes], { type: 'application/pdf' }), 'secret.pdf');
    fd.append('consent', 'true');

    const res = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fd,
    });
    assert.strictEqual(res.status, 200);

    const fullLogText = capturedLogs.join(' ');
    assert.ok(!fullLogText.includes(secretString), 'Log must not contain file contents');
    assert.ok(!fullLogText.includes(fileBytes.toString('base64')), 'Log must not contain base64 bytes');
  } finally {
    setGeminiClient(null);
    logger.error = origError;
    logger.warn = origWarn;
    logger.info = origInfo;
  }
});

test('14. Fake API 500 gives exactly 1 call then 502 Bad Gateway', async () => {
  let callCount = 0;
  const fakeClient = {
    models: {
      generateContent: async () => {
        callCount++;
        const err = new Error('Internal Server Error (500)');
        err.status = 500;
        throw err;
      },
    },
  };
  setGeminiClient(fakeClient);

  try {
    const fd = new FormData();
    fd.append('file', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'doc.png');
    fd.append('consent', 'true');

    const res = await fetch(`${baseUrl}/simplify`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    assert.strictEqual(callCount, 1, 'API 500 must not be retried (exactly 1 call)');
    assert.strictEqual(res.status, 502);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, 'Failed to analyze document with AI service.');
  } finally {
    setGeminiClient(null);
  }
});
