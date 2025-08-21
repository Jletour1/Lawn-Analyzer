import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create production admin user
  const adminPassword = await bcrypt.hash('Fanduel01', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lawnanalyzer.com' },
    update: {},
    create: {
      email: 'admin@lawnanalyzer.com',
      name: 'Jletz14',
      password_hash: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create sample root causes
  const rootCauses = [
    {
      name: 'Brown Patch Disease',
      category: 'DISEASE' as const,
      description: 'Fungal disease causing circular brown patches with dark outer rings, common in warm, humid conditions.',
      visual_indicators: ['Circular brown patches', 'Dark outer rings', 'Fuzzy patch edges'],
      standard_root_cause: 'Rhizoctonia solani fungal infection causing brown patch disease',
      standard_solutions: [
        'Apply fungicide containing propiconazole or azoxystrobin',
        'Improve air circulation',
        'Reduce watering frequency but increase duration'
      ],
      standard_recommendations: [
        'Avoid nitrogen fertilizer during active infection',
        'Water early morning to reduce leaf wetness',
        'Improve soil drainage'
      ],
      confidence_threshold: 0.8,
      success_rate: 0.85,
      seasonal_factors: ['Spring', 'Summer', 'High humidity periods']
    },
    {
      name: 'White Grub Infestation',
      category: 'PEST' as const,
      description: 'C-shaped white larvae that feed on grass roots, causing sections to die and detach from soil.',
      visual_indicators: ['Grass peels like carpet', 'Soft, spongy areas', 'Animals digging'],
      standard_root_cause: 'White grub larvae feeding on grass root system',
      standard_solutions: [
        'Apply beneficial nematodes for biological control',
        'Use grub-specific insecticide if severe',
        'Maintain proper lawn thickness'
      ],
      standard_recommendations: [
        'Water deeply but less frequently',
        'Monitor for adult beetles in summer',
        'Apply preventive treatment in late spring'
      ],
      confidence_threshold: 0.85,
      success_rate: 0.78,
      seasonal_factors: ['Late summer', 'Early fall', 'Spring emergence']
    },
    {
      name: 'Dog Urine Spots',
      category: 'ENVIRONMENTAL' as const,
      description: 'Circular brown patches with dark green outer rings caused by high nitrogen content in dog urine.',
      visual_indicators: ['Circular brown centers', 'Dark green outer rings', 'Near walkways or trees'],
      standard_root_cause: 'Dog urine burn from concentrated nitrogen and salts',
      standard_solutions: [
        'Water affected areas immediately after urination',
        'Train dog to use designated area',
        'Apply gypsum to neutralize soil pH'
      ],
      standard_recommendations: [
        'Overseed damaged spots after treatment',
        'Consider dog-resistant grass varieties',
        'Install barriers or designated pet areas'
      ],
      confidence_threshold: 0.75,
      success_rate: 0.90,
      seasonal_factors: ['Year-round', 'More visible in growing season']
    }
  ];

  for (const rootCauseData of rootCauses) {
    const rootCause = await prisma.rootCause.upsert({
      where: { name: rootCauseData.name },
      update: {},
      create: rootCauseData
    });

    // Create sample treatment schedule
    await prisma.treatmentSchedule.upsert({
      where: { 
        root_cause_id_name: {
          root_cause_id: rootCause.id,
          name: `${rootCauseData.name} Treatment Plan`
        }
      },
      update: {},
      create: {
        root_cause_id: rootCause.id,
        name: `${rootCauseData.name} Treatment Plan`,
        description: `Comprehensive treatment plan for ${rootCauseData.name.toLowerCase()}`,
        total_duration: '4-6 weeks',
        difficulty_level: 'INTERMEDIATE',
        steps: [
          {
            step_number: 1,
            title: 'Initial Assessment',
            description: 'Identify affected areas and assess severity',
            timing: 'Day 1',
            is_critical: true,
            products_needed: ['Measuring tape', 'Camera for documentation'],
            notes: 'Document all affected areas for tracking progress'
          },
          {
            step_number: 2,
            title: 'Apply Treatment',
            description: rootCauseData.standard_solutions[0],
            timing: 'Week 1',
            is_critical: true,
            products_needed: ['Treatment product'],
            notes: 'Follow label instructions carefully'
          },
          {
            step_number: 3,
            title: 'Monitor Progress',
            description: 'Check for improvement and adjust treatment if needed',
            timing: 'Week 2-3',
            is_critical: false,
            products_needed: [],
            notes: 'Take photos to track progress'
          }
        ],
        success_indicators: [
          'Reduced brown/dead areas',
          'New green growth visible',
          'No spreading of affected areas'
        ]
      }
    });
  }

  console.log('✅ Database seeded successfully');
  console.log(`👤 Admin user: Jletz14 (username) / Fanduel01 (password)`);
  console.log(`🌿 Created ${rootCauses.length} root causes with treatment schedules`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });