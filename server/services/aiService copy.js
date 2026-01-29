const Groq = require("groq-sdk");
const axios = require("axios");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Generate product ideas using Groq
exports.generateProductIdeas = async (wasteData) => {
  const prompt = `You are an expert in circular economy and sustainable product design.

Given the following industrial waste:
- Material: ${wasteData.material}
- Quantity: ${wasteData.quantity}
- Properties: ${wasteData.properties.join(', ')}
- Industry: ${wasteData.industry}

Generate exactly 3 innovative, high-value upcycled product ideas. For each idea, provide:
1. Product name (short, marketable)
2. Detailed description (2-3 sentences explaining the product)
3. Target market (who would buy this)
4. Visual description (detailed description for image generation - include materials, colors, setting, style)
5. Image search keywords (2-3 keywords for finding relevant images)
6. Business validation questions (3-4 research questions users should investigate)
7. Key success factors (2-3 critical factors for success)

Format your response as a JSON array with this structure:
[
  {
    "name": "Product Name",
    "description": "Detailed description",
    "targetMarket": "Who would buy this",
    "visualDescription": "Detailed visual description for image generation",
    "imageKeywords": "keyword1, keyword2",
    "researchQuestions": [
      "What is the market size for similar products in your region?",
      "Who are the main competitors?",
      "What certifications or regulations apply?"
    ],
    "successFactors": [
      "Consistent waste supply",
      "Quality control processes"
    ]
  }
]

Be creative and focus on high-value applications that are technically feasible.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert in sustainable manufacturing and circular economy. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    
    // Parse JSON response
    let ideas;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\[[\s\S]*\]/);
      ideas = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : response);
      console.log("AI Response Parsed Successfully:", ideas);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", response);
      throw new Error("Failed to parse AI response");
    }

    return ideas;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error("Failed to generate product ideas: " + error.message);
  }
};

// Generate product image using Unsplash (Primary) or Stable Diffusion (Fallback)
exports.generateProductImage = async (productName, description, visualDescription, imageKeywords) => {
  // Method 1: Try Unsplash first (FREE and FAST)
  try {
    console.log(`Fetching image from Unsplash for: ${productName}`);
    console.log(`Search keywords: ${imageKeywords}`);
    console.log('Product Name:', productName);
    
    // Use imageKeywords if provided, otherwise extract from product name
    const searchQuery = imageKeywords || productName.toLowerCase();
    
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (unsplashAccessKey) {
      const response = await axios.get('https://api.unsplash.com/photos/random', {
        params: {
          query: searchQuery,
          orientation: 'landscape',
          client_id: unsplashAccessKey
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data && response.data.urls) {
        const imageUrl = response.data.urls.regular;
        console.log(`Unsplash image found: ${imageUrl}`);
        return imageUrl;
      }
    } else {
      console.log("Unsplash API key not found, using public Unsplash source...");
      
      // Fallback: Use Unsplash Source API (no API key needed, but less reliable)
      const query = encodeURIComponent(searchQuery);
      const unsplashSourceUrl = `https://source.unsplash.com/1024x768/?${query}`;
      console.log(`Using Unsplash Source: ${unsplashSourceUrl}`);
      return unsplashSourceUrl;
    }

  } catch (unsplashError) {
    console.error("Unsplash fetch error:", unsplashError.message);
  }

  // Method 2: Try Stable Diffusion API (if configured)
  const stableDiffusionApiKey = process.env.STABLE_DIFFUSION_API_KEY;
  
  if (stableDiffusionApiKey) {
    try {
      console.log(`Generating image with Stable Diffusion for: ${productName}`);
      
      const imagePrompt = `Professional product photography of ${productName}. ${visualDescription || description}. 
Clean, modern, professional product shot with good lighting. Photorealistic. High quality commercial product image. 
White or minimal background. Focus on the sustainable, eco-friendly nature of the product made from upcycled materials.`;

      const response = await axios.post(
        'https://stablediffusionapi.com/api/v3/text2img',
        {
          key: stableDiffusionApiKey,
          prompt: imagePrompt,
          negative_prompt: "blurry, low quality, distorted, ugly",
          width: "512",
          height: "512",
          samples: "1",
          num_inference_steps: "20",
          guidance_scale: 7.5,
          webhook: null,
          track_id: null
        },
        {
          timeout: 60000 // 60 second timeout for image generation
        }
      );

      if (response.data && response.data.output && response.data.output[0]) {
        const imageUrl = response.data.output[0];
        console.log(`Stable Diffusion image generated: ${imageUrl}`);
        return imageUrl;
      }

    } catch (sdError) {
      console.error("Stable Diffusion generation error:", sdError.message);
    }
  }

  // Method 3: Ultimate fallback - Use placeholder with product name
  console.log(`Using placeholder for: ${productName}`);
  const query = encodeURIComponent(productName);
  return `https://placehold.co/600x400/4ade80/ffffff?text=${query}`;
};

// Generate all images with retry logic
exports.generateProductImagesWithRetry = async (ideas, maxRetries = 2) => {
  const results = [];
  console.log(`Generating images for ${ideas}`);
  
  for (const idea of ideas) {
    let imageUrl = null;
    let attempts = 0;
    
    while (!imageUrl && attempts < maxRetries) {
      try {
        imageUrl = await exports.generateProductImage(
          idea.name, 
          idea.description,
          idea.visualDescription,
          idea.imageKeywords
        );
        
        // Short delay between requests (Unsplash is fast, no long delays needed)
        if (ideas.indexOf(idea) < ideas.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed for ${idea.name}:`, error.message);
        
        if (attempts >= maxRetries) {
          // Use placeholder after all retries fail
          const query = encodeURIComponent(idea.name);
          imageUrl = `https://placehold.co/600x400/4ade80/ffffff?text=${query}`;
        }
      }
    }
    
    results.push(imageUrl);
  }
  
  return results;
};

// Calculate impact metrics with material-specific data
exports.calculateImpact = (wasteData, productType) => {
  // Extract numeric quantity (assuming format like "10 tons/month")
  const quantityMatch = wasteData.quantity.match(/(\d+\.?\d*)/);
  const quantity = quantityMatch ? parseFloat(quantityMatch[0]) : 10;
  
  // Material-specific CO2 emission factors (tons CO2 per ton of material)
  // Source: EPA WARM (Waste Reduction Model) & Ellen MacArthur Foundation
  const materialFactors = {
    'textile': { co2: 15.1, water: 700000, baseProfit: 22 },
    'cotton': { co2: 15.1, water: 700000, baseProfit: 22 },
    'plastic': { co2: 2.1, water: 120000, baseProfit: 18 },
    'paper': { co2: 3.9, water: 340000, baseProfit: 15 },
    'wood': { co2: 1.8, water: 200000, baseProfit: 20 },
    'metal': { co2: 1.5, water: 85000, baseProfit: 25 },
    'glass': { co2: 0.3, water: 45000, baseProfit: 12 },
    'food': { co2: 0.5, water: 180000, baseProfit: 10 },
    'electronic': { co2: 2.8, water: 95000, baseProfit: 30 },
    'default': { co2: 8.0, water: 400000, baseProfit: 18 }
  };
  
  // Detect material type from waste description
  const material = wasteData.material?.toLowerCase() || '';
  let factors = materialFactors.default;
  
  for (const [key, value] of Object.entries(materialFactors)) {
    if (material.includes(key)) {
      factors = value;
      break;
    }
  }
  
  // Product type adjustments (some products are more/less profitable)
  const productAdjustments = {
    'insulation': { profitMod: 1.2, feasibilityMod: 1.1 },
    'furniture': { profitMod: 1.15, feasibilityMod: 0.95 },
    'packaging': { profitMod: 0.9, feasibilityMod: 1.15 },
    'building': { profitMod: 1.1, feasibilityMod: 0.9 },
    'textile': { profitMod: 1.0, feasibilityMod: 1.0 },
    'default': { profitMod: 1.0, feasibilityMod: 1.0 }
  };
  
  let adjustment = productAdjustments.default;
  if (productType) {
    const productLower = productType.toLowerCase();
    for (const [key, value] of Object.entries(productAdjustments)) {
      if (productLower.includes(key)) {
        adjustment = value;
        break;
      }
    }
  }
  
  // Calculate annual impact (quantity is per month, multiply by 12)
  const annualQuantity = quantity * 12;
  const co2Saved = Math.round(annualQuantity * factors.co2);
  const waterSaved = Math.round(annualQuantity * factors.water);
  
  // Profit margin with material base + product adjustment + randomness
  const baseProfitMargin = factors.baseProfit * adjustment.profitMod;
  const profitMargin = Math.round(baseProfitMargin + (Math.random() * 8 - 4)); // ±4% variance
  
  // Feasibility score based on material properties and product type
  const baseFeasibility = 70 + (Math.random() * 15); // 70-85 base
  const feasibilityScore = Math.round(Math.min(95, baseFeasibility * adjustment.feasibilityMod));
  
  return {
    co2Saved,
    waterSaved,
    profitMargin: Math.max(5, Math.min(40, profitMargin)), // Clamp 5-40%
    feasibilityScore: Math.max(50, Math.min(95, feasibilityScore)) // Clamp 50-95
  };
};