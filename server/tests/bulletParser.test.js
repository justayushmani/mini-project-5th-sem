import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOverview, parseApplicationProcess, parseEligibilityCriteria } from '../../client/src/utils/bulletParser.js';

test('parseOverview splits bullet points and cleans duplicate scraped sections', () => {
  const sampleDesc = `The scheme "National Scholarship" was launched to support students across India.
The scheme covers the following sub-components:
• Sub-Component-I: Direct Scholarship Support
• Sub-Component-II: Technical Equipment Allowance
Eligibility criteria from source:
Students must have 60% marks.
Verification note: this record came from a third-party structured extract.`;

  const parsed = parseOverview(sampleDesc);
  assert.equal(parsed.bullets.length, 3);
  assert.ok(parsed.bullets[1].prefix.includes('Sub-Component-I'));
  assert.ok(parsed.bullets[1].text.includes('Direct Scholarship Support'));
  // Should NOT contain the scraped eligibility or verification note in overview bullets
  assert.ok(!parsed.bullets.some(b => b.text.includes('Verification note')));
  assert.ok(!parsed.bullets.some(b => b.text.includes('Eligibility criteria from source')));
});

test('parseOverview handles Hindi text with bullet points', () => {
  const sampleHi = `• कृषि विकास के लिए किसानों को वित्तीय सहायता प्रदान करना।
• कृषि स्नातकों को नए उद्यम स्थापित करने के लिए ऋण उपलब्ध कराना।
• आधुनिक तकनीकों के उपयोग को बढ़ावा देना।`;

  const parsed = parseOverview(sampleHi);
  assert.equal(parsed.bullets.length, 3);
  assert.equal(parsed.bullets[0].text, 'कृषि विकास के लिए किसानों को वित्तीय सहायता प्रदान करना।');
});

test('parseOverview handles Bengali text with bullet points', () => {
  const sampleBn = `• কৃষকদের অর্থনৈতিক সহায়তা প্রদান করা।
• কৃষি স্নাতকদের নতুন উদ্যোগ স্থাপনে সাহায্য করা।`;

  const parsed = parseOverview(sampleBn);
  assert.equal(parsed.bullets.length, 2);
  assert.equal(parsed.bullets[0].text, 'কৃষকদের অর্থনৈতিক সহায়তা প্রদান করা।');
});

test('parseOverview extracts FAQs if present in description', () => {
  const sampleWithFaq = `A scheme to support elderly citizens.
Frequently asked questions from source:
Q: Who can apply?
A: Any citizen aged 60 or above.
Q: Is there any application fee?
A: No, it is completely free.`;

  const parsed = parseOverview(sampleWithFaq);
  assert.equal(parsed.faqs.length, 2);
  assert.equal(parsed.faqs[0].q, 'Who can apply?');
  assert.equal(parsed.faqs[0].a, 'Any citizen aged 60 or above.');
});

test('parseApplicationProcess extracts mode and numbered steps', () => {
  const sampleProcess = `Mode: Online
Step 01: Visit the official portal at https://example.gov.in.
Step 02: Fill out the application form with correct details.
Step 03: Upload Aadhaar card and bank passbook.
Step 04: Submit the form and download the acknowledgment slip.`;

  const parsed = parseApplicationProcess(sampleProcess);
  assert.equal(parsed.mode, 'Online');
  assert.equal(parsed.steps.length, 4);
  assert.equal(parsed.steps[0].stepLabel, 'Step 01');
  assert.ok(parsed.steps[0].text.includes('Visit the official portal'));
});

test('parseApplicationProcess handles Hindi steps', () => {
  const sampleHiProcess = `मोड: ऑनलाइन
चरण 1: आधिकारिक पोर्टल पर जाएँ।
चरण 2: आवेदन फ़ॉर्म भरें।
चरण 3: दस्तावेज़ अपलोड करें और सबमिट करें।`;

  const parsed = parseApplicationProcess(sampleHiProcess);
  assert.equal(parsed.mode, 'ऑनलाइन');
  assert.equal(parsed.steps.length, 3);
  assert.equal(parsed.steps[0].stepLabel, 'चरण 1');
});

test('parseApplicationProcess handles Bengali steps', () => {
  const sampleBnProcess = `মোড: অনলাইন
ধাপ ১: অফিশিয়াল ওয়েবসাইটে প্রবেশ করুন।
ধাপ ২: আবেদনপত্র পূরণ করুন।
ধাপ ৩: প্রয়োজনীয় নথি আপলোড করুন।`;

  const parsed = parseApplicationProcess(sampleBnProcess);
  assert.equal(parsed.mode, 'অনলাইন');
  assert.equal(parsed.steps.length, 3);
  assert.equal(parsed.steps[0].stepLabel, 'ধাপ ১');
});

test('parseEligibilityCriteria splits multi-bullet strings into distinct items', () => {
  const sampleEligibility = [
    {
      id: 'elig-1',
      description: 'Applicant must be an Indian citizen. • Annual family income must be under ₹2,50,000. • Age must be between 18 and 35.',
      isRequired: true,
    },
    {
      id: 'elig-2',
      description: 'Must possess a valid land title deed.',
      isRequired: false,
    },
  ];

  const parsed = parseEligibilityCriteria(sampleEligibility);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].isRequired, true);
  assert.ok(parsed[0].description.includes('Indian citizen'));
  assert.ok(parsed[1].description.includes('Annual family income'));
  assert.ok(parsed[3].description.includes('land title deed'));
});
