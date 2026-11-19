import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const translations = [
  // 1. PM-KISAN
  {
    schemeSlug: 'pm-kisan-samman-nidhi',
    language: 'hi',
    name: 'प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)',
    description: 'सभी भूमिधारक किसान परिवारों को प्रति चार माह में ₹2,000 की तीन समान किस्तों में ₹6,000 प्रति वर्ष की आय सहायता प्रदान करता है।',
    applicationProcess: 'pmkisan.gov.in पर या कॉमन सर्विस सेंटर (CSC) के माध्यम से ऑनलाइन आवेदन करें। पोर्टल पर स्व-पंजीकरण उपलब्ध है।',
  },
  {
    schemeSlug: 'pm-kisan-samman-nidhi',
    language: 'bn',
    name: 'প্রধানমন্ত্রী কিষাণ সম্মান নিধি (PM-KISAN)',
    description: 'সমস্ত জমিধারী কৃষক পরিবারকে প্রতি চার মাসে ₹২,০০০ টাকার তিনটি সমান কিস্তিতে বছরে ₹৬,০০০ টাকার আর্থিক সহায়তা প্রদান করে।',
    applicationProcess: 'pmkisan.gov.in-এ অথবা কমন সার্ভিস সেন্টারের (CSC) মাধ্যমে অনলাইনে আবেদন করুন। পোর্টালে নিজস্ব নিবন্ধনের সুবিধা রয়েছে।',
  },

  // 2. PM-JAY
  {
    schemeSlug: 'ayushman-bharat-pm-jay',
    language: 'hi',
    name: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (PM-JAY)',
    description: 'आर्थिक रूप से कमजोर परिवारों को द्वितीयक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5 लाख का स्वास्थ्य कवर प्रदान करता है।',
    applicationProcess: 'pmjay.gov.in पर पात्रता जांचें। ई-कार्ड बनाने के लिए पैनलबद्ध अस्पताल या कॉमन सर्विस सेंटर पर जाएं।',
  },
  {
    schemeSlug: 'ayushman-bharat-pm-jay',
    language: 'bn',
    name: 'আয়ুষ্মান ভারত প্রধানমন্ত্রী জন আরোগ্য যোজনা (PM-JAY)',
    description: 'অর্থনৈতিকভাবে দুর্বল পরিবারগুলির জন্য মাধ্যমিক ও তৃতীয় স্তরের হাসপাতালে ভর্তির ক্ষেত্রে পরিবার পিছু বছরে ₹৫ লাখ টাকার স্বাস্থ্য বীমা প্রদান করে।',
    applicationProcess: 'pmjay.gov.in-এ যোগ্যতা যাচাই করুন। ই-কার্ড তৈরি করতে তালিকাভুক্ত হাসপাতাল বা কমন সার্ভিস সেন্টারে যান।',
  },

  // 3. PMAY-G
  {
    schemeSlug: 'pmay-gramin',
    language: 'hi',
    name: 'प्रधानमंत्री आवास योजना — ग्रामीण (PMAY-G)',
    description: 'ग्रामीण क्षेत्रों में बेघर और कच्चे/जर्जर घरों में रहने वाले लोगों को पक्के मकान निर्माण के लिए वित्तीय सहायता प्रदान करता है।',
    applicationProcess: 'आवास+ सर्वेक्षण के माध्यम से ग्राम सभाओं द्वारा लाभार्थियों का चयन किया जाता है। आवेदन के लिए अपनी ग्राम पंचायत से संपर्क करें।',
  },
  {
    schemeSlug: 'pmay-gramin',
    language: 'bn',
    name: 'প্রধানমন্ত্রী আবাস যোজনা — গ্রামীণ (PMAY-G)',
    description: 'গ্রামীণ অঞ্চলে গৃহহীন এবং কাঁচা বা জরাজীর্ণ বাড়িতে বসবাসকারী মানুষদের পাকা বাড়ি তৈরির জন্য আর্থিক সহায়তা প্রদান করে।',
    applicationProcess: 'আবাস+ সমীক্ষার মাধ্যমে গ্রামসভা দ্বারা সুবিধাভোগী নির্বাচন করা হয়। আবেদনের জন্য আপনার গ্রাম পঞ্চায়েতে যোগাযোগ করুন।',
  },

  // 4. PMUY
  {
    schemeSlug: 'pradhan-mantri-ujjwala-yojana',
    language: 'hi',
    name: 'प्रधानमंत्री उज्ज्वला योजना (PMUY)',
    description: 'अस्वास्थ्यकर खाना पकाने के ईंधन को बदलने के लिए गरीबी रेखा से नीचे (BPL) परिवारों की महिलाओं को एलपीजी कनेक्शन प्रदान करता है।',
    applicationProcess: 'निकटतम एलपीजी वितरक पर या आधिकारिक पोर्टल pmuy.gov.in के माध्यम से आवेदन करें। केवाईसी दस्तावेज़ जमा करें।',
  },
  {
    schemeSlug: 'pradhan-mantri-ujjwala-yojana',
    language: 'bn',
    name: 'প্রধানমন্ত্রী উজ্জ্বলা যোজনা (PMUY)',
    description: 'অস্বাস্থ্যকর রান্নার জ্বালানির পরিবর্তে দারিদ্র্যসীমার নিচে (BPL) থাকা পরিবারের মহিলাদের এলপিজি গ্যাস সংযোগ প্রদান করে।',
    applicationProcess: 'নিকটতম এলপিজি ডিস্ট্রিবিউটরের কাছে বা অফিশিয়াল পোর্টাল pmuy.gov.in-এর মাধ্যমে আবেদন করুন। কেওয়াইসি নথি জমা দিন।',
  },

  // 5. PM Vishwakarma
  {
    schemeSlug: 'pm-vishwakarma-yojana',
    language: 'hi',
    name: 'पीएम विश्वकर्मा योजना',
    description: 'हाथों और औजारों से काम करने वाले कारीगरों और शिल्पकारों (विश्वकर्मा) को पहचान और सहायता प्रदान करता है। कौशल प्रशिक्षण, टूलकिट सहायता और ऋण सुविधा प्रदान करता है।',
    applicationProcess: 'कॉमन सर्विस सेंटरों या ऑनलाइन पोर्टल के माध्यम से pmvishwakarma.gov.in पर पंजीकरण करें।',
  },
  {
    schemeSlug: 'pm-vishwakarma-yojana',
    language: 'bn',
    name: 'পিএম বিশ্বকর্মা যোজনা',
    description: 'হাত ও যন্ত্রপাতির সাহায্যে কাজ করা কারিগর ও শিল্পীদের (বিশ্বকর্মা) স্বীকৃতি ও সহায়তা প্রদান করে। দক্ষতা প্রশিক্ষণ, টুলকিট সহায়তা এবং ঋণ সুবিধা দেয়।',
    applicationProcess: 'কমন সার্ভিস সেন্টার বা অনলাইন পোর্টালের মাধ্যমে pmvishwakarma.gov.in-এ নিবন্ধন করুন।',
  },
];

async function seedTranslations() {
  console.log('🌐 Seeding Hindi and Bengali scheme translations...');

  for (const t of translations) {
    const scheme = await prisma.scheme.findUnique({
      where: { slug: t.schemeSlug },
    });

    if (!scheme) {
      console.warn(`⚠️ Scheme not found for slug: ${t.schemeSlug}`);
      continue;
    }

    await prisma.schemeTranslation.upsert({
      where: {
        schemeId_language: {
          schemeId: scheme.id,
          language: t.language,
        },
      },
      update: {
        name: t.name,
        description: t.description,
        applicationProcess: t.applicationProcess,
      },
      create: {
        schemeId: scheme.id,
        language: t.language,
        name: t.name,
        description: t.description,
        applicationProcess: t.applicationProcess,
      },
    });

    console.log(`✅ Seeded [${t.language}] translation for: ${scheme.name}`);
  }

  console.log('🎉 Scheme translations seeded successfully!');
}

seedTranslations()
  .catch((e) => {
    console.error('❌ Seeding translations failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
