// OpenAI Vision API endpoint for lawn image analysis
// This would be implemented as a serverless function or API route

export async function POST(request: Request) {
  try {
    const { image, prompt } = await request.json();
    
    // In a real implementation, this would call OpenAI's Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API call failed');
    }

    const result = await response.json();
    const analysis = result.choices[0].message.content;

    // Parse the analysis and structure the response
    return Response.json({
      description: analysis,
      problems: extractProblems(analysis),
      confidence: calculateConfidence(analysis),
      recommendations: extractRecommendations(analysis),
      grassType: extractGrassType(analysis),
      seasonalFactors: extractSeasonalFactors(analysis),
      environmentalConditions: extractEnvironmentalConditions(analysis),
      urgency: determineUrgency(analysis)
    });

  } catch (error) {
    console.error('Vision API error:', error);
    
    // Return fallback analysis
    return Response.json({
      description: 'AI vision analysis temporarily unavailable',
      problems: ['Unable to analyze - please try again'],
      confidence: 0.3,
      recommendations: ['Consider professional lawn assessment'],
      grassType: 'Unknown',
      seasonalFactors: [],
      environmentalConditions: [],
      urgency: 'medium'
    });
  }
}

function extractProblems(analysis: string): string[] {
  // Extract identified problems from AI analysis
  const problems = [];
  const lowerAnalysis = analysis.toLowerCase();
  
  if (lowerAnalysis.includes('brown patch') || lowerAnalysis.includes('fungal')) {
    problems.push('Brown Patch Disease');
  }
  if (lowerAnalysis.includes('weed') || lowerAnalysis.includes('dandelion')) {
    problems.push('Weed Infestation');
  }
  if (lowerAnalysis.includes('drought') || lowerAnalysis.includes('dry')) {
    problems.push('Drought Stress');
  }
  if (lowerAnalysis.includes('fertilizer') || lowerAnalysis.includes('burn')) {
    problems.push('Fertilizer Burn');
  }
  
  return problems;
}

function calculateConfidence(analysis: string): number {
  // Calculate confidence based on specificity of analysis
  const specificTerms = [
    'clearly', 'definitely', 'obvious', 'evident', 'certain',
    'likely', 'appears', 'suggests', 'indicates', 'shows'
  ];
  
  let confidence = 0.5; // baseline
  const lowerAnalysis = analysis.toLowerCase();
  
  for (const term of specificTerms) {
    if (lowerAnalysis.includes(term)) {
      confidence += 0.1;
    }
  }
  
  return Math.min(0.95, confidence);
}

function extractRecommendations(analysis: string): string[] {
  // Extract treatment recommendations
  const recommendations = [];
  const lowerAnalysis = analysis.toLowerCase();
  
  if (lowerAnalysis.includes('water')) {
    recommendations.push('Adjust watering schedule');
  }
  if (lowerAnalysis.includes('fertiliz')) {
    recommendations.push('Apply appropriate fertilizer');
  }
  if (lowerAnalysis.includes('fungicide')) {
    recommendations.push('Consider fungicide treatment');
  }
  if (lowerAnalysis.includes('aerat')) {
    recommendations.push('Aerate compacted soil');
  }
  
  return recommendations.length > 0 ? recommendations : ['Professional assessment recommended'];
}

function extractGrassType(analysis: string): string {
  const grassTypes = ['bermuda', 'fescue', 'kentucky blue', 'zoysia', 'st. augustine'];
  const lowerAnalysis = analysis.toLowerCase();
  
  for (const type of grassTypes) {
    if (lowerAnalysis.includes(type)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  
  return 'Mixed/Unknown';
}

function extractSeasonalFactors(analysis: string): string[] {
  const factors = [];
  const lowerAnalysis = analysis.toLowerCase();
  
  if (lowerAnalysis.includes('spring')) factors.push('Spring growth period');
  if (lowerAnalysis.includes('summer')) factors.push('Summer heat stress');
  if (lowerAnalysis.includes('fall')) factors.push('Fall recovery time');
  if (lowerAnalysis.includes('winter')) factors.push('Winter dormancy');
  
  return factors;
}

function extractEnvironmentalConditions(analysis: string): string[] {
  const conditions = [];
  const lowerAnalysis = analysis.toLowerCase();
  
  if (lowerAnalysis.includes('shade')) conditions.push('Shaded area');
  if (lowerAnalysis.includes('sun')) conditions.push('Full sun exposure');
  if (lowerAnalysis.includes('wet') || lowerAnalysis.includes('moist')) conditions.push('High moisture');
  if (lowerAnalysis.includes('dry')) conditions.push('Dry conditions');
  
  return conditions;
}

function determineUrgency(analysis: string): 'low' | 'medium' | 'high' {
  const lowerAnalysis = analysis.toLowerCase();
  
  if (lowerAnalysis.includes('severe') || lowerAnalysis.includes('urgent') || lowerAnalysis.includes('immediate')) {
    return 'high';
  }
  if (lowerAnalysis.includes('moderate') || lowerAnalysis.includes('soon')) {
    return 'medium';
  }
  
  return 'low';
}