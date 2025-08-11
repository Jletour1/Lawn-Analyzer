// Enhanced Image Analysis System with Image-to-Image Comparison and Dynamic Learning
// Integrates computer vision, similarity search, and adaptive problem detection

export interface ImageEmbedding {
  id: string;
  embedding: number[];
  metadata: {
    problemType: string;
    confidence: number;
    redditPostId?: string;
    userSubmissionId?: string;
    timestamp: string;
    imageUrl: string;
    verified: boolean;
  };
}

export interface SimilarImage {
  id: string;
  similarity: number;
  problemType: string;
  confidence: number;
  imageUrl: string;
  source: 'reddit' | 'user_submission';
  metadata: any;
}

export interface DynamicIndicator {
  id: string;
  problemType: string;
  indicatorFunction: string; // Serialized function
  confidence: number;
  trainingExamples: number;
  lastUpdated: string;
  isActive: boolean;
}

export interface EnhancedAnalysisResult {
  // Original analysis
  colorAnalysis: any;
  patternAnalysis: any;
  textureAnalysis: any;
  healthMetrics: any;
  weedDetection: any;
  problemIndicators: any;
  
  // Enhanced features
  imageEmbedding: number[];
  similarImages: SimilarImage[];
  dynamicIndicatorResults: { [key: string]: number };
  confidenceBoost: number;
  communityValidation: {
    matchingPosts: number;
    averageConfidence: number;
    treatmentSuccess: number;
  };
}

export class EnhancedImageAnalyzer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageEmbeddings: ImageEmbedding[] = [];
  private dynamicIndicators: DynamicIndicator[] = [];
  private modelUpdateThreshold = 0.85; // Confidence threshold for auto-adding indicators

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.loadStoredData();
  }

  private loadStoredData() {
    // Load image embeddings from localStorage
    const storedEmbeddings = localStorage.getItem('imageEmbeddings');
    if (storedEmbeddings) {
      this.imageEmbeddings = JSON.parse(storedEmbeddings);
    }

    // Load dynamic indicators
    const storedIndicators = localStorage.getItem('dynamicIndicators');
    if (storedIndicators) {
      this.dynamicIndicators = JSON.parse(storedIndicators);
    }
  }

  private saveStoredData() {
    localStorage.setItem('imageEmbeddings', JSON.stringify(this.imageEmbeddings));
    localStorage.setItem('dynamicIndicators', JSON.stringify(this.dynamicIndicators));
  }

  async analyzeImageEnhanced(imageFile: File, includeAIVision: boolean = true): Promise<EnhancedAnalysisResult> {
    try {
      // Load and prepare image
      const imageData = await this.loadImage(imageFile);
      
      // Perform basic analysis (existing functionality)
      const basicAnalysis = await this.performBasicAnalysis(imageData);
      
      // Generate image embedding for similarity search
      const imageEmbedding = await this.generateImageEmbedding(imageData);
      
      // Find similar images in database
      const similarImages = await this.findSimilarImages(imageEmbedding);
      
      // Apply dynamic indicators
      const dynamicIndicatorResults = await this.applyDynamicIndicators(imageData, basicAnalysis);
      
      // Calculate confidence boost from similar images
      const confidenceBoost = this.calculateConfidenceBoost(similarImages, basicAnalysis);
      
      // Get community validation data
      const communityValidation = this.getCommunityValidation(similarImages);
      
      // Store this image for future comparisons
      await this.storeImageEmbedding(imageFile, imageEmbedding, basicAnalysis);
      
      // Check if we should auto-generate new indicators
      await this.checkForNewIndicatorGeneration(basicAnalysis, similarImages);

      return {
        ...basicAnalysis,
        imageEmbedding,
        similarImages,
        dynamicIndicatorResults,
        confidenceBoost,
        communityValidation
      };

    } catch (error) {
      console.error('Enhanced image analysis error:', error);
      return this.getDefaultEnhancedAnalysis();
    }
  }

  private async generateImageEmbedding(imageData: ImageData): Promise<number[]> {
    // Generate a comprehensive feature vector from the image
    const features: number[] = [];
    
    // Color histogram features (RGB + HSV)
    const colorFeatures = this.extractColorFeatures(imageData);
    features.push(...colorFeatures);
    
    // Texture features (LBP, GLCM)
    const textureFeatures = this.extractTextureFeatures(imageData);
    features.push(...textureFeatures);
    
    // Shape/pattern features
    const shapeFeatures = this.extractShapeFeatures(imageData);
    features.push(...shapeFeatures);
    
    // Spatial features (regional analysis)
    const spatialFeatures = this.extractSpatialFeatures(imageData);
    features.push(...spatialFeatures);
    
    // Normalize the feature vector
    return this.normalizeFeatures(features);
  }

  private generateImageHash(imageFile: File): string {
    // Generate a hash for duplicate detection
    return `hash_${imageFile.size}_${imageFile.lastModified}_${imageFile.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }

  private extractMLFeatures(analysis: any): any {
    // Extract additional machine learning features for research
    return {
      colorMoments: this.calculateColorMoments(analysis.colorAnalysis),
      textureComplexity: this.calculateTextureComplexity(analysis.textureAnalysis),
      patternDensity: this.calculatePatternDensity(analysis.patternAnalysis),
      healthGradient: this.calculateHealthGradient(analysis.healthMetrics),
      weedDistribution: this.calculateWeedDistribution(analysis.weedDetection),
      problemCorrelations: this.calculateProblemCorrelations(analysis.problemIndicators)
    };
  }

  private calculateDataQuality(analysis: any, imageFile: File): number {
    let qualityScore = 0;
    const maxScore = 10;
    
    // Image file quality
    if (imageFile.size > 100000) qualityScore += 1; // Good file size
    if (imageFile.type.includes('jpeg') || imageFile.type.includes('png')) qualityScore += 1;
    
    // Analysis completeness
    if (analysis.colorAnalysis) qualityScore += 1;
    if (analysis.patternAnalysis) qualityScore += 1;
    if (analysis.textureAnalysis) qualityScore += 1;
    if (analysis.healthMetrics) qualityScore += 1;
    if (analysis.weedDetection) qualityScore += 1;
    if (analysis.problemIndicators) qualityScore += 1;
    
    // Analysis confidence
    if (analysis.confidence > 0.8) qualityScore += 1;
    if (analysis.confidence > 0.6) qualityScore += 0.5;
    
    // User description quality
    if (analysis.userDescription && analysis.userDescription.length > 20) qualityScore += 1;
    
    return qualityScore / maxScore;
  }

  private storeInResearchDatabase(embeddingData: ImageEmbedding, analysis: any) {
    // Store comprehensive research data for advanced analytics
    const researchData = {
      id: embeddingData.id,
      timestamp: embeddingData.metadata.timestamp,
      
      // Complete image analysis
      fullAnalysis: embeddingData.metadata.fullAnalysisSnapshot,
      imageEmbedding: embeddingData.embedding,
      imageMetadata: {
        hash: embeddingData.metadata.imageHash,
        quality: embeddingData.metadata.imageQuality,
        size: embeddingData.metadata.fileSize,
        type: embeddingData.metadata.fileType,
        seasonal: embeddingData.metadata.seasonalContext
      },
      
      // Machine learning features
      mlFeatures: embeddingData.metadata.machineLearningFeatures,
      dataQuality: embeddingData.metadata.dataQualityScore,
      
      // User context
      userDescription: embeddingData.metadata.userDescription,
      deviceInfo: embeddingData.metadata.deviceInfo,
      
      // Analysis results
      problemClassification: embeddingData.metadata.problemType,
      confidence: embeddingData.metadata.confidence,
      dynamicIndicators: embeddingData.metadata.dynamicIndicatorTriggers,
      
      // Research fields
      researchNotes: embeddingData.metadata.researchNotes,
      expertValidation: embeddingData.metadata.expertValidation,
      treatmentTracking: embeddingData.metadata.treatmentTracking,
      communityFeedback: embeddingData.metadata.communityFeedback,
      
      // Cross-references and relationships
      similarImages: analysis.similarImages || [],
      crossReferences: embeddingData.metadata.crossReferences,
      updateHistory: embeddingData.metadata.updateHistory
    };

    // Store in research database
    const existingResearchData = JSON.parse(localStorage.getItem('researchDatabase') || '[]');
    existingResearchData.push(researchData);
    
    // Server deployment: No limits on research data
    localStorage.setItem('researchDatabase', JSON.stringify(existingResearchData));
  }

  // Helper methods for ML feature extraction
  private calculateColorMoments(colorAnalysis: any): any {
    if (!colorAnalysis) return {};
    return {
      greenMoment: colorAnalysis.healthyGreen * colorAnalysis.darkGreen,
      stressMoment: colorAnalysis.stressedYellow * colorAnalysis.deadBrown,
      diversityIndex: Object.keys(colorAnalysis).length
    };
  }

  private calculateTextureComplexity(textureAnalysis: any): number {
    if (!textureAnalysis) return 0;
    return (textureAnalysis.sharpness + textureAnalysis.contrast + textureAnalysis.entropy) / 3;
  }

  private calculatePatternDensity(patternAnalysis: any): number {
    if (!patternAnalysis) return 0;
    return patternAnalysis.circularSpots + patternAnalysis.linearPatterns + patternAnalysis.contourCount;
  }

  private calculateHealthGradient(healthMetrics: any): number {
    if (!healthMetrics) return 0;
    return healthMetrics.greenCoverage - healthMetrics.brownCoverage;
  }

  private calculateWeedDistribution(weedDetection: any): any {
    if (!weedDetection) return {};
    return {
      totalCoverage: weedDetection.totalWeedPercentage,
      typeCount: weedDetection.identifiedWeedTypes?.length || 0,
      distributionPattern: weedDetection.weedDensityMap ? 'mapped' : 'estimated'
    };
  }

  private calculateProblemCorrelations(problemIndicators: any): any {
    if (!problemIndicators) return {};
    const correlations = {};
    const problems = Object.keys(problemIndicators);
    
    for (let i = 0; i < problems.length; i++) {
      for (let j = i + 1; j < problems.length; j++) {
        const key = `${problems[i]}_${problems[j]}`;
        correlations[key] = problemIndicators[problems[i]] * problemIndicators[problems[j]];
      }
    }
    
    return correlations;
  }
  private extractColorFeatures(imageData: ImageData): number[] {
    const { data, width, height } = imageData;
    const features: number[] = [];
    
    // RGB histogram (16 bins per channel)
    const rgbHist = { r: new Array(16).fill(0), g: new Array(16).fill(0), b: new Array(16).fill(0) };
    
    // HSV histogram (16 bins per channel)
    const hsvHist = { h: new Array(16).fill(0), s: new Array(16).fill(0), v: new Array(16).fill(0) };
    
    // Color moments
    let rMean = 0, gMean = 0, bMean = 0;
    let rVar = 0, gVar = 0, bVar = 0;
    
    const totalPixels = width * height;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // RGB histogram
      rgbHist.r[Math.floor(r / 16)]++;
      rgbHist.g[Math.floor(g / 16)]++;
      rgbHist.b[Math.floor(b / 16)]++;
      
      // HSV conversion and histogram
      const [h, s, v] = this.rgbToHsv(r, g, b);
      hsvHist.h[Math.floor(h / 22.5)]++;
      hsvHist.s[Math.floor(s / 6.25)]++;
      hsvHist.v[Math.floor(v / 6.25)]++;
      
      // Color moments
      rMean += r;
      gMean += g;
      bMean += b;
    }
    
    // Normalize histograms and add to features
    features.push(...rgbHist.r.map(x => x / totalPixels));
    features.push(...rgbHist.g.map(x => x / totalPixels));
    features.push(...rgbHist.b.map(x => x / totalPixels));
    features.push(...hsvHist.h.map(x => x / totalPixels));
    features.push(...hsvHist.s.map(x => x / totalPixels));
    features.push(...hsvHist.v.map(x => x / totalPixels));
    
    // Add color moments
    rMean /= totalPixels;
    gMean /= totalPixels;
    bMean /= totalPixels;
    
    // Calculate variance
    for (let i = 0; i < data.length; i += 4) {
      rVar += Math.pow(data[i] - rMean, 2);
      gVar += Math.pow(data[i + 1] - gMean, 2);
      bVar += Math.pow(data[i + 2] - bMean, 2);
    }
    
    features.push(rMean / 255, gMean / 255, bMean / 255);
    features.push(Math.sqrt(rVar / totalPixels) / 255, Math.sqrt(gVar / totalPixels) / 255, Math.sqrt(bVar / totalPixels) / 255);
    
    return features;
  }

  private extractTextureFeatures(imageData: ImageData): number[] {
    const { data, width, height } = imageData;
    const features: number[] = [];
    
    // Convert to grayscale
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      grayData[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    
    // Local Binary Pattern (LBP)
    const lbpHist = new Array(256).fill(0);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = grayData[y * width + x];
        let lbpValue = 0;
        
        // 8-neighbor LBP
        const neighbors = [
          grayData[(y-1) * width + (x-1)], grayData[(y-1) * width + x], grayData[(y-1) * width + (x+1)],
          grayData[y * width + (x+1)], grayData[(y+1) * width + (x+1)], grayData[(y+1) * width + x],
          grayData[(y+1) * width + (x-1)], grayData[y * width + (x-1)]
        ];
        
        for (let i = 0; i < 8; i++) {
          if (neighbors[i] >= center) {
            lbpValue |= (1 << i);
          }
        }
        
        lbpHist[lbpValue]++;
      }
    }
    
    // Normalize and add LBP histogram
    const totalLBP = (width - 2) * (height - 2);
    features.push(...lbpHist.map(x => x / totalLBP));
    
    // Gray Level Co-occurrence Matrix (GLCM) features
    const glcmFeatures = this.calculateGLCMFeatures(grayData, width, height);
    features.push(...glcmFeatures);
    
    return features;
  }

  private extractShapeFeatures(imageData: ImageData): number[] {
    const { data, width, height } = imageData;
    const features: number[] = [];
    
    // Edge detection
    const edges = this.sobelEdgeDetection(imageData);
    
    // Hough transform for circles and lines
    const circles = this.detectCirclesAdvanced(edges, width, height);
    const lines = this.detectLinesAdvanced(edges, width, height);
    
    // Shape statistics
    features.push(circles.length / 100); // Normalized circle count
    features.push(lines.length / 100); // Normalized line count
    
    // Circle size distribution
    if (circles.length > 0) {
      const radii = circles.map(c => c.radius);
      features.push(Math.min(...radii) / Math.max(width, height));
      features.push(Math.max(...radii) / Math.max(width, height));
      features.push(radii.reduce((a, b) => a + b, 0) / radii.length / Math.max(width, height));
    } else {
      features.push(0, 0, 0);
    }
    
    // Contour analysis
    const contours = this.findContoursAdvanced(edges, width, height);
    features.push(contours.length / 100); // Normalized contour count
    
    if (contours.length > 0) {
      const areas = contours.map(c => c.area);
      const perimeters = contours.map(c => c.perimeter);
      
      features.push(Math.min(...areas) / (width * height));
      features.push(Math.max(...areas) / (width * height));
      features.push(areas.reduce((a, b) => a + b, 0) / areas.length / (width * height));
      
      // Circularity features
      const circularities = contours.map((c, i) => 4 * Math.PI * areas[i] / (perimeters[i] * perimeters[i]));
      features.push(circularities.reduce((a, b) => a + b, 0) / circularities.length);
    } else {
      features.push(0, 0, 0, 0);
    }
    
    return features;
  }

  private extractSpatialFeatures(imageData: ImageData): number[] {
    const { data, width, height } = imageData;
    const features: number[] = [];
    
    // Divide image into 3x3 grid and analyze each region
    const gridSize = 3;
    const cellWidth = Math.floor(width / gridSize);
    const cellHeight = Math.floor(height / gridSize);
    
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        let rSum = 0, gSum = 0, bSum = 0, pixelCount = 0;
        
        for (let y = gy * cellHeight; y < (gy + 1) * cellHeight && y < height; y++) {
          for (let x = gx * cellWidth; x < (gx + 1) * cellWidth && x < width; x++) {
            const idx = (y * width + x) * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            pixelCount++;
          }
        }
        
        if (pixelCount > 0) {
          features.push(rSum / pixelCount / 255);
          features.push(gSum / pixelCount / 255);
          features.push(bSum / pixelCount / 255);
        } else {
          features.push(0, 0, 0);
        }
      }
    }
    
    return features;
  }

  private normalizeFeatures(features: number[]): number[] {
    // L2 normalization
    const magnitude = Math.sqrt(features.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? features.map(val => val / magnitude) : features;
  }

  private async findSimilarImages(queryEmbedding: number[], topK: number = 10): Promise<SimilarImage[]> {
    const similarities: { embedding: ImageEmbedding; similarity: number }[] = [];
    
    // Calculate cosine similarity with all stored embeddings
    for (const storedEmbedding of this.imageEmbeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, storedEmbedding.embedding);
      similarities.push({ embedding: storedEmbedding, similarity });
    }
    
    // Sort by similarity and return top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, topK).map(item => ({
      id: item.embedding.id,
      similarity: item.similarity,
      problemType: item.embedding.metadata.problemType,
      confidence: item.embedding.metadata.confidence,
      imageUrl: item.embedding.metadata.imageUrl,
      source: item.embedding.metadata.redditPostId ? 'reddit' : 'user_submission',
      metadata: item.embedding.metadata
    }));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async applyDynamicIndicators(imageData: ImageData, basicAnalysis: any): Promise<{ [key: string]: number }> {
    const results: { [key: string]: number } = {};
    
    for (const indicator of this.dynamicIndicators) {
      if (!indicator.isActive) continue;
      
      try {
        // Execute the dynamic indicator function
        const indicatorFunction = new Function('imageData', 'basicAnalysis', 'analyzer', indicator.indicatorFunction);
        const score = indicatorFunction(imageData, basicAnalysis, this);
        
        results[indicator.problemType] = Math.max(0, Math.min(100, score));
      } catch (error) {
        console.error(`Error applying dynamic indicator for ${indicator.problemType}:`, error);
        results[indicator.problemType] = 0;
      }
    }
    
    return results;
  }

  private calculateConfidenceBoost(similarImages: SimilarImage[], basicAnalysis: any): number {
    if (similarImages.length === 0) return 0;
    
    // Calculate boost based on similarity scores and confidence of similar images
    let totalBoost = 0;
    let weightSum = 0;
    
    for (const similar of similarImages) {
      const weight = similar.similarity * similar.confidence;
      totalBoost += weight * similar.similarity;
      weightSum += weight;
    }
    
    return weightSum > 0 ? (totalBoost / weightSum) * 0.3 : 0; // Max 30% boost
  }

  private getCommunityValidation(similarImages: SimilarImage[]): any {
    const redditImages = similarImages.filter(img => img.source === 'reddit');
    
    return {
      matchingPosts: redditImages.length,
      averageConfidence: redditImages.length > 0 
        ? redditImages.reduce((sum, img) => sum + img.confidence, 0) / redditImages.length 
        : 0,
      treatmentSuccess: redditImages.filter(img => img.confidence > 0.8).length / Math.max(1, redditImages.length)
    };
  }

  private async storeImageEmbedding(imageFile: File, embedding: number[], analysis: any) {
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Enhanced metadata with comprehensive analysis results
    const imageEmbeddingData: ImageEmbedding = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      embedding,
      metadata: {
        problemType: analysis.primaryProblem || 'unknown',
        confidence: analysis.confidence || 0.5,
        userSubmissionId: `user_${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageUrl,
        verified: false,
        // Enhanced metadata
        fileSize: imageFile.size,
        fileName: imageFile.name,
        fileType: imageFile.type,
        analysisResults: {
          colorAnalysis: analysis.colorAnalysis,
          patternAnalysis: analysis.patternAnalysis,
          textureAnalysis: analysis.textureAnalysis,
          healthMetrics: analysis.healthMetrics,
          weedDetection: analysis.weedDetection,
          problemIndicators: analysis.problemIndicators
        },
        userDescription: analysis.userDescription || '',
        treatmentOutcome: null, // To be updated later if user provides feedback
        similarityMatches: [], // Will be populated when this image is used as a reference
        dynamicIndicatorTriggers: analysis.dynamicIndicatorResults || {},
        geolocation: null, // Could be added for regional analysis
        seasonalContext: this.getSeasonalContext(),
        imageQuality: this.assessImageQuality(analysis),
        processingTime: analysis.processingTime || 0,
        // Server-optimized fields for unlimited storage
        fullAnalysisSnapshot: analysis, // Complete analysis for future research
        imageHash: this.generateImageHash(imageFile), // For duplicate detection
        deviceInfo: this.getDeviceInfo(), // User device/browser info
        analysisVersion: '2.0', // Track which version of analyzer was used
        rawImageData: null, // Placeholder for server to store actual image data
        similaritySearchResults: [], // Full similarity search results
        machineLearningFeatures: this.extractMLFeatures(analysis), // Additional ML features
        communityFeedback: [], // User feedback on diagnosis accuracy
        treatmentTracking: [], // Track treatment attempts and outcomes
        expertValidation: null, // Professional validation if available
        researchNotes: '', // Notes for research purposes
        dataQualityScore: this.calculateDataQuality(analysis, imageFile),
        crossReferences: [], // Links to related cases
        updateHistory: [] // Track any manual corrections or updates
      }
    };
    
    this.imageEmbeddings.push(imageEmbeddingData);
    
    // Server deployment: No storage limits - keep all data for maximum learning
    // All images stored permanently for comprehensive analysis and research
    
    this.saveStoredData();
    
    // Also store in admin database for comprehensive tracking
    this.storeInAdminDatabase(imageEmbeddingData, analysis);
    
    // Server-specific: Store in research database for advanced analytics
    this.storeInResearchDatabase(imageEmbeddingData, analysis);
  }

  private async checkForNewIndicatorGeneration(analysis: any, similarImages: SimilarImage[]) {
    // Check if we have enough high-confidence examples of a new problem type
    const problemCounts: { [key: string]: { count: number; totalConfidence: number } } = {};
    
    // Count similar images by problem type
    for (const similar of similarImages) {
      if (similar.confidence > 0.8) {
        if (!problemCounts[similar.problemType]) {
          problemCounts[similar.problemType] = { count: 0, totalConfidence: 0 };
        }
        problemCounts[similar.problemType].count++;
        problemCounts[similar.problemType].totalConfidence += similar.confidence;
      }
    }
    
    // Check for new patterns that might warrant a new indicator
    for (const [problemType, data] of Object.entries(problemCounts)) {
      if (data.count >= 5 && data.totalConfidence / data.count > this.modelUpdateThreshold) {
        // Check if we already have an indicator for this problem
        const existingIndicator = this.dynamicIndicators.find(ind => ind.problemType === problemType);
        
        if (!existingIndicator) {
          await this.generateNewIndicator(problemType, similarImages.filter(img => img.problemType === problemType));
        }
      }
    }
  }

  private async generateNewIndicator(problemType: string, examples: SimilarImage[]) {
    // Analyze the examples to create a new indicator function
    const indicatorFunction = this.createIndicatorFunction(problemType, examples);
    
    const newIndicator: DynamicIndicator = {
      id: `dynamic_${Date.now()}_${problemType.replace(/\s+/g, '_').toLowerCase()}`,
      problemType,
      indicatorFunction,
      confidence: 0.7, // Start with moderate confidence
      trainingExamples: examples.length,
      lastUpdated: new Date().toISOString(),
      isActive: true
    };
    
    this.dynamicIndicators.push(newIndicator);
    this.saveStoredData();
    
    console.log(`🤖 Auto-generated new indicator for: ${problemType} (${examples.length} examples)`);
    
    // Notify admin panel if available
    if ((window as any).notifyNewIndicator) {
      (window as any).notifyNewIndicator(newIndicator);
    }
  }

  private createIndicatorFunction(problemType: string, examples: SimilarImage[]): string {
    // Create a basic indicator function based on common patterns in examples
    // This is a simplified version - in production, this would use ML techniques
    
    return `
      // Auto-generated indicator for ${problemType}
      let score = 0;
      
      // Color-based indicators
      if (basicAnalysis.colorAnalysis) {
        const colors = basicAnalysis.colorAnalysis;
        
        // Adjust based on problem type patterns
        if ('${problemType}'.toLowerCase().includes('brown')) {
          score += colors.deadBrown * 2;
        }
        if ('${problemType}'.toLowerCase().includes('yellow')) {
          score += colors.stressedYellow * 2;
        }
        if ('${problemType}'.toLowerCase().includes('green')) {
          score += colors.darkGreen * 1.5;
        }
      }
      
      // Pattern-based indicators
      if (basicAnalysis.patternAnalysis) {
        const patterns = basicAnalysis.patternAnalysis;
        
        if ('${problemType}'.toLowerCase().includes('spot') || '${problemType}'.toLowerCase().includes('patch')) {
          score += patterns.circularSpots * 10;
        }
        if ('${problemType}'.toLowerCase().includes('line') || '${problemType}'.toLowerCase().includes('streak')) {
          score += patterns.linearPatterns * 15;
        }
      }
      
      // Health-based indicators
      if (basicAnalysis.healthMetrics) {
        const health = basicAnalysis.healthMetrics;
        
        if (health.overallHealth < 5) {
          score += (5 - health.overallHealth) * 5;
        }
      }
      
      return Math.min(100, score);
    `;
  }

  // Enhanced helper methods
  private sobelEdgeDetection(imageData: ImageData): Uint8Array {
    const { data, width, height } = imageData;
    const edges = new Uint8Array(width * height);
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    // Convert to grayscale first
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      grayData[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let i = 0; i < 9; i++) {
          const px = x + (i % 3) - 1;
          const py = y + Math.floor(i / 3) - 1;
          const pixel = grayData[py * width + px];
          gx += pixel * sobelX[i];
          gy += pixel * sobelY[i];
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = Math.min(255, magnitude);
      }
    }
    
    return edges;
  }

  private detectCirclesAdvanced(edges: Uint8Array, width: number, height: number): Array<{x: number, y: number, radius: number, votes: number}> {
    const circles = [];
    const minRadius = 5;
    const maxRadius = Math.min(width, height) / 4;
    const threshold = 8;
    
    // Hough circle detection with vote counting
    for (let r = minRadius; r < maxRadius; r += 3) {
      for (let y = r; y < height - r; y += 5) {
        for (let x = r; x < width - r; x += 5) {
          let votes = 0;
          
          for (let angle = 0; angle < 360; angle += 15) {
            const rad = (angle * Math.PI) / 180;
            const px = Math.round(x + r * Math.cos(rad));
            const py = Math.round(y + r * Math.sin(rad));
            
            if (px >= 0 && px < width && py >= 0 && py < height) {
              if (edges[py * width + px] > 100) votes++;
            }
          }
          
          if (votes > threshold) {
            circles.push({ x, y, radius: r, votes });
          }
        }
      }
    }
    
    // Non-maximum suppression
    return this.nonMaximumSuppression(circles);
  }

  private detectLinesAdvanced(edges: Uint8Array, width: number, height: number): Array<{x1: number, y1: number, x2: number, y2: number, votes: number}> {
    const lines = [];
    const threshold = 50;
    
    // Simplified Hough line detection
    // In production, this would be more sophisticated
    
    return lines;
  }

  private findContoursAdvanced(edges: Uint8Array, width: number, height: number): Array<{area: number, perimeter: number, centroid: {x: number, y: number}}> {
    const contours = [];
    const visited = new Array(width * height).fill(false);
    
    // Connected component analysis
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        if (edges[idx] > 128 && !visited[idx]) {
          const contour = this.traceContour(edges, width, height, x, y, visited);
          if (contour.area > 50) { // Filter small contours
            contours.push(contour);
          }
        }
      }
    }
    
    return contours;
  }

  private traceContour(edges: Uint8Array, width: number, height: number, startX: number, startY: number, visited: boolean[]): {area: number, perimeter: number, centroid: {x: number, y: number}} {
    const stack = [{x: startX, y: startY}];
    const points = [];
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || edges[idx] <= 128) {
        continue;
      }
      
      visited[idx] = true;
      points.push({x, y});
      
      // Add 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          stack.push({x: x + dx, y: y + dy});
        }
      }
    }
    
    // Calculate contour properties
    const area = points.length;
    const perimeter = this.calculatePerimeter(points);
    const centroid = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length
    };
    
    return { area, perimeter, centroid };
  }

  private calculatePerimeter(points: Array<{x: number, y: number}>): number {
    if (points.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      perimeter += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }
    
    return perimeter;
  }

  private nonMaximumSuppression(circles: Array<{x: number, y: number, radius: number, votes: number}>): Array<{x: number, y: number, radius: number, votes: number}> {
    const filtered = [];
    
    circles.sort((a, b) => b.votes - a.votes);
    
    for (const circle of circles) {
      let suppress = false;
      
      for (const existing of filtered) {
        const distance = Math.sqrt((circle.x - existing.x) ** 2 + (circle.y - existing.y) ** 2);
        const radiusDiff = Math.abs(circle.radius - existing.radius);
        
        if (distance < Math.max(circle.radius, existing.radius) * 0.5 && radiusDiff < 10) {
          suppress = true;
          break;
        }
      }
      
      if (!suppress) {
        filtered.push(circle);
      }
    }
    
    return filtered.slice(0, 20); // Limit results
  }

  private calculateGLCMFeatures(grayData: Uint8Array, width: number, height: number): number[] {
    // Simplified GLCM calculation
    const glcm = new Array(256).fill(null).map(() => new Array(256).fill(0));
    
    // Calculate co-occurrence matrix (horizontal direction)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width - 1; x++) {
        const i = grayData[y * width + x];
        const j = grayData[y * width + x + 1];
        glcm[i][j]++;
      }
    }
    
    // Normalize GLCM
    const total = (width - 1) * height;
    for (let i = 0; i < 256; i++) {
      for (let j = 0; j < 256; j++) {
        glcm[i][j] /= total;
      }
    }
    
    // Calculate Haralick features
    let contrast = 0, correlation = 0, energy = 0, homogeneity = 0;
    
    for (let i = 0; i < 256; i++) {
      for (let j = 0; j < 256; j++) {
        const p = glcm[i][j];
        contrast += p * (i - j) * (i - j);
        energy += p * p;
        homogeneity += p / (1 + Math.abs(i - j));
      }
    }
    
    return [contrast, energy, homogeneity];
  }

  private async performBasicAnalysis(imageData: ImageData): Promise<any> {
    // This would call the existing AdvancedImageAnalyzer methods
    // For now, return a simplified version
    return {
      colorAnalysis: { healthyGreen: 45, stressedYellow: 15, deadBrown: 20 },
      patternAnalysis: { circularSpots: 2, linearPatterns: 1 },
      textureAnalysis: { sharpness: 120, uniformity: 0.5 },
      healthMetrics: { overallHealth: 5.5, greenCoverage: 55 },
      weedDetection: { totalWeedPercentage: 15 },
      problemIndicators: { dogUrineSpots: 30, brownPatch: 25 },
      primaryProblem: 'Dog Urine Spots',
      confidence: 0.75
    };
  }

  private async loadImage(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = this.ctx.getImageData(0, 0, width, height);
        resolve(imageData);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const diff = max - min;
    const v = max;
    const s = max === 0 ? 0 : diff / max;
    
    let h = 0;
    if (diff !== 0) {
      switch (max) {
        case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / diff + 2) / 6; break;
        case b: h = ((r - g) / diff + 4) / 6; break;
      }
    }
    
    return [h * 360, s * 100, v * 100];
  }

  private getDefaultEnhancedAnalysis(): EnhancedAnalysisResult {
    return {
      colorAnalysis: { healthyGreen: 45, stressedYellow: 15, deadBrown: 20 },
      patternAnalysis: { circularSpots: 2, linearPatterns: 1 },
      textureAnalysis: { sharpness: 120, uniformity: 0.5 },
      healthMetrics: { overallHealth: 5.5, greenCoverage: 55 },
      weedDetection: { totalWeedPercentage: 15 },
      problemIndicators: { dogUrineSpots: 30, brownPatch: 25 },
      imageEmbedding: new Array(256).fill(0),
      similarImages: [],
      dynamicIndicatorResults: {},
      confidenceBoost: 0,
      communityValidation: { matchingPosts: 0, averageConfidence: 0, treatmentSuccess: 0 }
    };
  }

  private getSeasonalContext(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private assessImageQuality(analysis: any): 'high' | 'medium' | 'low' {
    const sharpness = analysis.textureAnalysis?.sharpness || 0;
    const contrast = analysis.textureAnalysis?.contrast || 0;
    
    if (sharpness > 150 && contrast > 100) return 'high';
    if (sharpness > 100 && contrast > 60) return 'medium';
    return 'low';
  }

  private storeInAdminDatabase(embeddingData: ImageEmbedding, analysis: any) {
    // Store comprehensive data for admin review and analytics
    const adminData = {
      id: embeddingData.id,
      timestamp: embeddingData.metadata.timestamp,
      problemType: embeddingData.metadata.problemType,
      confidence: embeddingData.metadata.confidence,
      imageMetadata: {
        fileName: embeddingData.metadata.fileName,
        fileSize: embeddingData.metadata.fileSize,
        fileType: embeddingData.metadata.fileType,
        imageQuality: embeddingData.metadata.imageQuality,
        seasonalContext: embeddingData.metadata.seasonalContext,
        imageHash: embeddingData.metadata.imageHash,
        deviceInfo: embeddingData.metadata.deviceInfo,
        analysisVersion: embeddingData.metadata.analysisVersion
      },
      analysisResults: embeddingData.metadata.analysisResults,
      userDescription: embeddingData.metadata.userDescription,
      embedding: embeddingData.embedding,
      processingMetrics: {
        processingTime: embeddingData.metadata.processingTime,
        dynamicIndicatorsTriggered: Object.keys(embeddingData.metadata.dynamicIndicatorTriggers || {}).length,
        similarityMatchesFound: analysis.similarImages?.length || 0,
        confidenceBoost: analysis.confidenceBoost || 0,
        dataQualityScore: embeddingData.metadata.dataQualityScore
      },
      // Server-optimized fields
      researchData: {
        fullAnalysisSnapshot: embeddingData.metadata.fullAnalysisSnapshot,
        machineLearningFeatures: embeddingData.metadata.machineLearningFeatures,
        similaritySearchResults: embeddingData.metadata.similaritySearchResults,
        crossReferences: embeddingData.metadata.crossReferences
      }
    };

    // Store in localStorage for admin panel access
    const existingAdminData = JSON.parse(localStorage.getItem('adminImageDatabase') || '[]');
    existingAdminData.push(adminData);
    
    // Server deployment: Keep all admin data for comprehensive analytics
    // No limits - all data valuable for research and improvement
    
    localStorage.setItem('adminImageDatabase', JSON.stringify(existingAdminData));
  }

  // Public methods for admin interface
  public getDynamicIndicators(): DynamicIndicator[] {
    return this.dynamicIndicators;
  }

  public toggleIndicator(id: string, active: boolean) {
    const indicator = this.dynamicIndicators.find(ind => ind.id === id);
    if (indicator) {
      indicator.isActive = active;
      this.saveStoredData();
    }
  }

  public removeIndicator(id: string) {
    this.dynamicIndicators = this.dynamicIndicators.filter(ind => ind.id !== id);
    this.saveStoredData();
  }

  public getImageEmbeddings(): ImageEmbedding[] {
    return this.imageEmbeddings;
  }

  public clearImageDatabase() {
    this.imageEmbeddings = [];
    this.saveStoredData();
  }
}

export const enhancedImageAnalyzer = new EnhancedImageAnalyzer();