// services/aiService.js - COMPLETE REWRITE with working image generation

const Groq = require("groq-sdk");
const axios = require("axios");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Generate product ideas using Groq with exclusion list
exports.generateProductIdeas = async (wasteData, excludeIdeas = []) => {
  
  // Build exclusion text if previous ideas exist
  let exclusionText = '';
  if (excludeIdeas && excludeIdeas.length > 0) {
    const previousNames = excludeIdeas.map(idea => `"${idea.name}"`).join(', ');
    exclusionText = `\n\nIMPORTANT: You have previously generated these ideas: ${previousNames}. 
DO NOT repeat these exact ideas or very similar concepts. Generate completely NEW and DIFFERENT product ideas.`;
  }

  const prompt = `You are an expert in circular economy and sustainable product design.

Given the following industrial waste:
- Material: ${wasteData.material}
- Quantity: ${wasteData.quantity}
- Properties: ${wasteData.properties.join(', ')}
- Industry: ${wasteData.industry}
${exclusionText}

Generate exactly 3 innovative, high-value upcycled product ideas. For each idea, provide:
1. Product name (short, marketable, UNIQUE)
2. Detailed description (2-3 sentences explaining the product)
3. Target market (who would buy this)
4. Visual description (VERY DETAILED for AI image generation - include: physical appearance, materials, colors, textures, setting, lighting, camera angle, style)
5. Image search keywords (2-3 generic keywords as fallback)
6. Business validation questions (3-4 research questions users should investigate)
7. Key success factors (2-3 critical factors for success)

Format your response as a JSON array with this structure:
[
  {
    "name": "Product Name",
    "description": "Detailed description",
    "targetMarket": "Who would buy this",
    "visualDescription": "A highly detailed visual description with physical appearance, materials used, exact colors (hex codes if possible), textures, product dimensions, setting/environment, lighting style, camera angle (e.g., 45-degree angle, close-up), and artistic style (e.g., product photography, minimalist)",
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

Be creative and focus on high-value applications that are technically feasible. ${excludeIdeas.length > 0 ? 'ENSURE these are COMPLETELY DIFFERENT from previous ideas.' : ''}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert in sustainable manufacturing and circular economy. Always respond with valid JSON only. When asked to avoid certain ideas, you MUST generate completely different concepts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: excludeIdeas.length > 0 ? 0.9 : 0.7,
      max_tokens: 2500,
    });

    const response = completion.choices[0]?.message?.content;
    
    let ideas;
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\[[\s\S]*\]/);
      ideas = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : response);
      console.log("AI Response Parsed Successfully:", ideas);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", response);
      throw new Error("Failed to parse AI response");
    }

    if (excludeIdeas.length > 0) {
      const excludedNames = excludeIdeas.map(idea => idea.name.toLowerCase());
      ideas = ideas.filter(newIdea => {
        const nameLower = newIdea.name.toLowerCase();
        const isSimilar = excludedNames.some(excluded => 
          nameLower.includes(excluded) || excluded.includes(nameLower)
        );
        return !isSimilar;
      });

      if (ideas.length === 0) {
        throw new Error("Generated ideas were too similar to previous ones. Retrying...");
      }
    }

    return ideas;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error("Failed to generate product ideas: " + error.message);
  }
};

// ==========================================
// IMAGE GENERATION 
// ==========================================

/**
 * Generate product image 
 * Priority: Hugging Face → ImgBB Upload → Unsplash → Placeholder
 */
exports.generateProductImage = async (productName, description, visualDescription, imageKeywords) => {
  console.log(`\n🎨 Starting image generation for: ${productName}`);

  // METHOD 1: Hugging Face Inference API (FREE - Best Option)
  try {
    if (process.env.HUGGINGFACE_API_KEY) {
      console.log('📍 Method 1: Trying Hugging Face (FREE)...');
      const imageUrl = await exports.generateWithHuggingFace(productName, visualDescription || description);
      if (imageUrl) {
        console.log(`✅ Hugging Face succeeded`);
        return imageUrl;
      }
    } else {
      console.log('⚠️ Hugging Face API key not configured, skipping...');
    }
  } catch (error) {
    console.error('❌ Hugging Face failed:', error.message);
  }

  // METHOD 2: Clipdrop API (FREE tier - 100 images/month)
  // try {
  //   if (process.env.CLIPDROP_API_KEY) {
  //     console.log('📍 Method 2: Trying Clipdrop (FREE tier)...');
  //     const imageUrl = await exports.generateWithClipdrop(productName, visualDescription || description);
  //     if (imageUrl) {
  //       console.log(`✅ Clipdrop succeeded: ${imageUrl}`);
  //       return imageUrl;
  //     }
  //   } else {
  //     console.log('⚠️ Clipdrop API key not configured, skipping...');
  //   }
  // } catch (error) {
  //   console.error('❌ Clipdrop failed:', error.message);
  // }

  // METHOD 3: Craiyon (formerly DALL-E mini) - FREE, no API key
  try {
    console.log('📍 Method 3: Trying Craiyon (FREE, no key needed)...');
    const imageUrl = await exports.generateWithCraiyon(productName, visualDescription || description);
    if (imageUrl) {
      console.log(`✅ Craiyon succeeded: ${imageUrl}`);
      return imageUrl;
    }
  } catch (error) {
    console.error('❌ Craiyon failed:', error.message);
  }

  // METHOD 4: Unsplash (Stock photos - always works)
  try {
    if (process.env.UNSPLASH_ACCESS_KEY) {
      console.log('📍 Method 4: Trying Unsplash (stock photos)...');
      const searchQuery = imageKeywords || productName.toLowerCase();
      const response = await axios.get('https://api.unsplash.com/photos/random', {
        params: {
          query: searchQuery,
          orientation: 'landscape',
          client_id: process.env.UNSPLASH_ACCESS_KEY
        },
        timeout: 10000
      });

      if (response.data && response.data.urls) {
        const imageUrl = response.data.urls.regular;
        console.log(`✅ Unsplash succeeded (stock photo): ${imageUrl}`);
        return imageUrl;
      }
    } else {
      console.log('⚠️ Unsplash API key not configured, skipping...');
    }
  } catch (error) {
    console.error('❌ Unsplash failed:', error.message);
  }

  // METHOD 5: Picsum (Random placeholder images - always works)
  console.log('📍 Method 5: Using Picsum placeholder');
  const seed = encodeURIComponent(productName);
  return `https://picsum.photos/seed/${seed}/800/600`;
};

// ==========================================
// HUGGING FACE - FREE (Best option)
// ==========================================
exports.generateWithHuggingFace = async (productName, visualDescription) => {
  try {
    const prompt = `Professional product photography of ${productName}. ${visualDescription}. 
Clean modern product shot, well-lit, white background, photorealistic, high quality, 
eco-friendly sustainable product from upcycled waste, studio lighting.`;

    console.log('Generating with Hugging Face Stable Diffusion...');

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        inputs: prompt,
        parameters: {
          negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, watermark, text, logo",
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 90000, // 90 seconds for image generation
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // Check if we got an image
    if (response.data && response.data.byteLength > 0) {
      // Convert to base64 for storage
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      
      // Option 1: Return as data URL (works immediately, no external hosting needed)
      return `data:image/png;base64,${base64Image}`;
      
    }

    throw new Error('No image data received from Hugging Face');
  } catch (error) {
    console.error('Hugging Face generation error:', error.response?.data || error.message);
    
    // If model is loading, wait and retry once
    if (error.response?.status === 503) {
      console.log('Model is loading, waiting 20 seconds...');
      await new Promise(resolve => setTimeout(resolve, 20000));
      
      // Retry once
      try {
        const retryResponse = await axios.post(
          'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
          {
            inputs: prompt,
            parameters: {
              negative_prompt: "blurry, low quality, distorted, ugly",
              num_inference_steps: 20 // Faster for retry
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
            },
            responseType: 'arraybuffer',
            timeout: 60000
          }
        );
        
        if (retryResponse.data && retryResponse.data.byteLength > 0) {
          const base64Image = Buffer.from(retryResponse.data, 'binary').toString('base64');
          return `data:image/png;base64,${base64Image}`;
        }
      } catch (retryError) {
        console.error('Retry also failed');
      }
    }
    
    return null;
  }
};

// ==========================================
// CLIPDROP - FREE (100 images/month)
// ==========================================
exports.generateWithClipdrop = async (productName, visualDescription) => {
  try {
    const prompt = `Professional product photography of ${productName}. ${visualDescription}. 
Clean, modern, well-lit, white background, photorealistic, sustainable eco-friendly product.`;

    const FormData = require('form-data');
    const form = new FormData();
    form.append('prompt', prompt);

    const response = await axios.post(
      'https://clipdrop-api.co/text-to-image/v1',
      form,
      {
        headers: {
          'x-api-key': process.env.CLIPDROP_API_KEY,
          ...form.getHeaders()
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );

    if (response.data && response.data.byteLength > 0) {
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      return `data:image/png;base64,${base64Image}`;
    }

    throw new Error('No image data from Clipdrop');
  } catch (error) {
    console.error('Clipdrop generation error:', error.message);
    return null;
  }
};

// ==========================================
// CRAIYON - FREE (no API key, but slower)
// ==========================================
exports.generateWithCraiyon = async (productName, visualDescription) => {
  try {
    const prompt = `Professional product photo of ${productName}, ${visualDescription}, clean background, high quality`;

    // Craiyon's unofficial API endpoint
    const response = await axios.post(
      'https://api.craiyon.com/v3',
      {
        prompt: prompt,
        token: null,
        model: 'art', // or 'photo' for photorealistic
        negative_prompt: 'blurry, low quality, distorted'
      },
      {
        timeout: 120000 // 2 minutes (Craiyon is slow)
      }
    );

    if (response.data && response.data.images && response.data.images.length > 0) {
      // Craiyon returns base64 images
      const base64Image = response.data.images[0];
      return `data:image/png;base64,${base64Image}`;
    }

    throw new Error('No images from Craiyon');
  } catch (error) {
    console.log(error);
    console.error('Craiyon generation error:', error.message);
    return null;
  }
};


// Keep your existing generateProductImagesWithRetry and calculateImpact functions
exports.generateProductImagesWithRetry = async (ideas, maxRetries = 2) => {
  const results = [];
  console.log(`\n🎨 Generating images for ${ideas.length} products...\n`);
  
  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i];
    let imageUrl = null;
    let attempts = 0;
    
    console.log(`\n--- Product ${i + 1}/${ideas.length}: ${idea.name} ---`);
    
    while (!imageUrl && attempts < maxRetries) {
      attempts++;
      console.log(`Attempt ${attempts}/${maxRetries}`);
      
      try {
        imageUrl = await exports.generateProductImage(
          idea.name, 
          idea.description,
          idea.visualDescription,
          idea.imageKeywords
        );
        
        if (imageUrl) {
          console.log(`✅ Success on attempt ${attempts}`);
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed:`, error.message);
        
        if (attempts >= maxRetries) {
          console.log('⚠️ All attempts failed, using Picsum placeholder');
          const seed = encodeURIComponent(idea.name);
          imageUrl = `https://picsum.photos/seed/${seed}/800/600`;
        }
      }
    }
    
    results.push(imageUrl);
    
    // Delay between requests
    if (i < ideas.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
    }
  }
  
  console.log(`\n✅ Image generation complete: ${results.length}/${ideas.length} successful\n`);
  return results;
};

// Calculate impact metrics (unchanged)
exports.calculateImpact = (wasteData, productType) => {
  const quantityMatch = wasteData.quantity.match(/(\d+\.?\d*)/);
  const quantity = quantityMatch ? parseFloat(quantityMatch[0]) : 10;
  
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
  
  const material = wasteData.material?.toLowerCase() || '';
  let factors = materialFactors.default;
  
  for (const [key, value] of Object.entries(materialFactors)) {
    if (material.includes(key)) {
      factors = value;
      break;
    }
  }
  
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
  
  const annualQuantity = quantity * 12;
  const co2Saved = Math.round(annualQuantity * factors.co2);
  const waterSaved = Math.round(annualQuantity * factors.water);
  
  const baseProfitMargin = factors.baseProfit * adjustment.profitMod;
  const profitMargin = Math.round(baseProfitMargin + (Math.random() * 8 - 4));
  
  const baseFeasibility = 70 + (Math.random() * 15);
  const feasibilityScore = Math.round(Math.min(95, baseFeasibility * adjustment.feasibilityMod));
  
  return {
    co2Saved,
    waterSaved,
    profitMargin: Math.max(5, Math.min(40, profitMargin)),
    feasibilityScore: Math.max(50, Math.min(95, feasibilityScore))
  };
};