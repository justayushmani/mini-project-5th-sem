import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Prisma Seed Script
 *
 * Seeds verified, publicly known government scheme data for development.
 * Source: myScheme portal (https://www.myscheme.gov.in/) and official ministry pages.
 *
 * HOW TO RUN:
 *   npm run db:seed
 *
 * NOTE: All scheme data here is based on publicly available information.
 * Always verify against the official source before using in production.
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // ── Seed Schemes ────────────────────────────────────────────────────────────

  const schemes = [
    {
      name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      slug: 'pm-kisan-samman-nidhi',
      description:
        'Provides income support of ₹6,000 per year to all land-holding farmer families in three equal instalments of ₹2,000 every four months.',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      category: 'Agriculture',
      state: null, // Central scheme
      level: 'Central',
      applicationProcess:
        'Apply online at pmkisan.gov.in or through Common Service Centres (CSCs). Self-registration available on the portal.',
      officialUrl: 'https://pmkisan.gov.in',
      status: 'Active',
      lastVerifiedAt: new Date('2024-10-01'),
      eligibility: {
        create: [
          {
            criteriaType: 'occupation',
            operator: 'eq',
            value: 'Farmer',
            description: 'Must be a land-holding farmer family',
            isRequired: true,
          },
          {
            criteriaType: 'income',
            operator: 'exclude',
            value: 'institutional',
            description: 'Institutional land holders are excluded',
            isRequired: true,
          },
        ],
      },
      benefits: {
        create: [
          {
            benefitType: 'Financial',
            description: 'Direct income support',
            amount: '₹6,000 per year (₹2,000 per instalment, 3 instalments)',
          },
        ],
      },
      documents: {
        create: [
          { documentName: 'Aadhaar Card', isRequired: true },
          { documentName: 'Land ownership documents', isRequired: true },
          { documentName: 'Bank account details', isRequired: true },
        ],
      },
      source: {
        create: {
          sourceName: 'Official PM-KISAN Portal',
          sourceUrl: 'https://pmkisan.gov.in',
          lastVerifiedAt: new Date('2024-10-01'),
        },
      },
    },
    {
      name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
      slug: 'ayushman-bharat-pm-jay',
      description:
        'Provides health cover of ₹5 lakh per family per year for secondary and tertiary care hospitalisation to economically vulnerable families.',
      ministry: 'Ministry of Health and Family Welfare',
      category: 'Health',
      state: null,
      level: 'Central',
      applicationProcess:
        'Check eligibility on pmjay.gov.in. Visit an empanelled hospital or Common Service Centre to generate e-card.',
      officialUrl: 'https://pmjay.gov.in',
      status: 'Active',
      lastVerifiedAt: new Date('2024-10-01'),
      eligibility: {
        create: [
          {
            criteriaType: 'category',
            operator: 'in',
            value: 'SECC,BPL',
            description: 'Must be listed in SECC 2011 database or meet state criteria',
            isRequired: true,
          },
        ],
      },
      benefits: {
        create: [
          {
            benefitType: 'Insurance',
            description: 'Cashless health coverage for hospitalisation',
            amount: '₹5 lakh per family per year',
          },
        ],
      },
      documents: {
        create: [
          { documentName: 'Aadhaar Card', isRequired: true },
          { documentName: 'Ration Card (for SECC beneficiaries)', isRequired: false },
          { documentName: 'Ayushman Card (issued after eligibility check)', isRequired: false },
        ],
      },
      source: {
        create: {
          sourceName: 'National Health Authority — PM-JAY',
          sourceUrl: 'https://pmjay.gov.in',
          lastVerifiedAt: new Date('2024-10-01'),
        },
      },
    },
    {
      name: 'Pradhan Mantri Awas Yojana — Gramin (PMAY-G)',
      slug: 'pmay-gramin',
      description:
        'Provides financial assistance for construction of pucca houses to homeless and those living in kutcha/dilapidated houses in rural areas.',
      ministry: 'Ministry of Rural Development',
      category: 'Housing',
      state: null,
      level: 'Central',
      applicationProcess:
        'Beneficiary selection is done by Gram Sabhas through Awaas+ survey. Contact your Gram Panchayat for application.',
      officialUrl: 'https://pmayg.nic.in',
      status: 'Active',
      lastVerifiedAt: new Date('2024-10-01'),
      eligibility: {
        create: [
          {
            criteriaType: 'housing',
            operator: 'eq',
            value: 'kutcha_or_homeless',
            description: 'Must be homeless or living in kutcha/dilapidated house',
            isRequired: true,
          },
          {
            criteriaType: 'area',
            operator: 'eq',
            value: 'rural',
            description: 'Must be a rural area resident',
            isRequired: true,
          },
          {
            criteriaType: 'income',
            operator: 'exclude',
            value: 'income_tax_payer',
            description: 'Income tax payers are excluded',
            isRequired: true,
          },
        ],
      },
      benefits: {
        create: [
          {
            benefitType: 'Financial',
            description: 'Construction assistance for pucca house',
            amount: '₹1.20 lakh (plain areas) / ₹1.30 lakh (hilly/difficult areas)',
          },
          {
            benefitType: 'Financial',
            description: 'Toilet construction under Swachh Bharat Mission',
            amount: '₹12,000',
          },
        ],
      },
      documents: {
        create: [
          { documentName: 'Aadhaar Card', isRequired: true },
          { documentName: 'Bank account linked to Aadhaar', isRequired: true },
          { documentName: 'Job Card (MGNREGS)', isRequired: false },
        ],
      },
      source: {
        create: {
          sourceName: 'PMAY-G Official Portal',
          sourceUrl: 'https://pmayg.nic.in',
          lastVerifiedAt: new Date('2024-10-01'),
        },
      },
    },
    {
      name: 'Pradhan Mantri Ujjwala Yojana (PMUY)',
      slug: 'pradhan-mantri-ujjwala-yojana',
      description:
        'Provides LPG connections to women from Below Poverty Line (BPL) households to replace unhealthy cooking fuels.',
      ministry: 'Ministry of Petroleum and Natural Gas',
      category: 'Social Welfare',
      state: null,
      level: 'Central',
      applicationProcess:
        'Apply at nearest LPG distributor or through the official portal pmuy.gov.in. Submit KYC documents.',
      officialUrl: 'https://pmuy.gov.in',
      status: 'Active',
      lastVerifiedAt: new Date('2024-10-01'),
      eligibility: {
        create: [
          {
            criteriaType: 'gender',
            operator: 'eq',
            value: 'Female',
            description: 'Applicant must be an adult woman',
            isRequired: true,
          },
          {
            criteriaType: 'income',
            operator: 'eq',
            value: 'BPL',
            description: 'Must belong to a BPL household',
            isRequired: true,
          },
          {
            criteriaType: 'age',
            operator: 'gte',
            value: '18',
            description: 'Must be 18 years or older',
            isRequired: true,
          },
        ],
      },
      benefits: {
        create: [
          {
            benefitType: 'Subsidy',
            description: 'Free LPG connection with stove and first refill',
            amount: '₹1,600 assistance per connection',
          },
        ],
      },
      documents: {
        create: [
          { documentName: 'Aadhaar Card', isRequired: true },
          { documentName: 'BPL Ration Card / SECC 2011 list', isRequired: true },
          { documentName: 'Bank account details', isRequired: true },
          { documentName: 'Passport-size photograph', isRequired: true },
        ],
      },
      source: {
        create: {
          sourceName: 'PMUY Official Portal',
          sourceUrl: 'https://pmuy.gov.in',
          lastVerifiedAt: new Date('2024-10-01'),
        },
      },
    },
    {
      name: 'PM Vishwakarma Yojana',
      slug: 'pm-vishwakarma-yojana',
      description:
        'Provides recognition and support to artisans and craftspeople (vishwakarmas) who work with their hands and tools. Offers skill training, toolkit support, and credit access.',
      ministry: 'Ministry of Micro, Small and Medium Enterprises',
      category: 'Skill Development',
      state: null,
      level: 'Central',
      applicationProcess:
        'Register on pmvishwakarma.gov.in through Common Service Centres or online portal.',
      officialUrl: 'https://pmvishwakarma.gov.in',
      status: 'Active',
      lastVerifiedAt: new Date('2024-10-01'),
      eligibility: {
        create: [
          {
            criteriaType: 'occupation',
            operator: 'in',
            value: 'Carpenter,Boat Maker,Armourer,Blacksmith,Hammer and Tool Kit Maker,Locksmith,Goldsmith,Potter,Sculptor,Cobbler,Mason,Basket/Mat/Broom Maker,Doll/Toy Maker,Barber,Garland Maker,Washerman,Tailor,Fishing Net Maker',
            description: 'Must belong to one of the 18 recognised traditional artisan/craftsperson trades',
            isRequired: true,
          },
          {
            criteriaType: 'age',
            operator: 'gte',
            value: '18',
            description: 'Must be 18 years or older',
            isRequired: true,
          },
        ],
      },
      benefits: {
        create: [
          {
            benefitType: 'Financial',
            description: 'Collateral-free credit (first tranche)',
            amount: '₹1 lakh',
          },
          {
            benefitType: 'Financial',
            description: 'Credit (second tranche after satisfactory repayment)',
            amount: '₹2 lakh',
          },
          {
            benefitType: 'Training',
            description: 'Skill training with stipend',
            amount: '₹500/day during training',
          },
          {
            benefitType: 'Equipment',
            description: 'Toolkit incentive',
            amount: '₹15,000',
          },
        ],
      },
      documents: {
        create: [
          { documentName: 'Aadhaar Card', isRequired: true },
          { documentName: 'Mobile number linked to Aadhaar', isRequired: true },
          { documentName: 'Bank account details', isRequired: true },
          { documentName: 'Ration Card', isRequired: false },
        ],
      },
      source: {
        create: {
          sourceName: 'PM Vishwakarma Official Portal',
          sourceUrl: 'https://pmvishwakarma.gov.in',
          lastVerifiedAt: new Date('2024-10-01'),
        },
      },
    },
  ];

  for (const schemeData of schemes) {
    // Use upsert to avoid errors on re-seeding
    await prisma.scheme.upsert({
      where: { slug: schemeData.slug },
      update: {},
      create: schemeData,
    });
    console.log(`✅ Seeded: ${schemeData.name}`);
  }

  console.log('\n🎉 Seed complete! Seeded', schemes.length, 'government schemes.');
  console.log('💡 All data sourced from official government portals.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
