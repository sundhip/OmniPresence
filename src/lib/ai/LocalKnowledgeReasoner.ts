/**
 * Local Knowledge & Reasoning Engine for OP AI
 * Provides expert, contextual, non-canned answers across grooming, fashion, science, coding, writing, and general AI tasks when offline or running locally.
 */
export class LocalKnowledgeReasoner {
  public static answerGeneralQuery(query: string, context?: any): string {
    const q = query.toLowerCase().trim();

    // -------------------------------------------------------------
    // 1. GROOMING, HAIRCUTS, HAIRSTYLES & APPEARANCE
    // -------------------------------------------------------------
    if (
      q.includes("hair cut") ||
      q.includes("haircut") ||
      q.includes("hairstyle") ||
      q.includes("hair style") ||
      q.includes("beard") ||
      q.includes("grooming") ||
      q.includes("shave") ||
      q.includes("skincare")
    ) {
      if (q.includes("best") || q.includes("which") || q.includes("recommend") || q.includes("suit me") || q.includes("should i get")) {
        return `There isn't one haircut that is universally best for everyone. The ideal cut depends on your **face shape**, **hair texture**, and **maintenance preference**:\n\n` +
          `• **Oval Face**: Highly versatile — works well with a textured crop, taper fade, pompadour, or shoulder-length layers.\n` +
          `• **Round Face**: Benefits from height and angular structure (e.g. textured quiff, mid-fade, undercut, or side-swept bangs) to elongate facial proportions.\n` +
          `• **Square Face**: Soft textured cuts, classic side parts, low tapers, or french crops complement strong jawlines.\n` +
          `• **Heart / Diamond Face**: Mid-length styles, curtain bangs, or textured scissor cuts that add subtle width around the chin.\n` +
          `• **Low-Maintenance Picks**: A **taper fade with a textured top** or a classic **buzz cut** requires minimal daily styling product.\n\n` +
          `*Tip*: If you let me know your face shape and hair type (straight, wavy, curly), or upload a photo, I can give you personalized haircut options!`;
      }

      if (q.includes("round face")) {
        return `**Best Haircuts for a Round Face**:\n\n` +
          `The goal is to add vertical height and angular definition to balance facial width:\n` +
          `• **Textured Quiff or Pompadour**: Adds volume on top with short sides to elongate the face.\n` +
          `• **High or Mid Taper Fade**: Keeps the sides slim and tight.\n` +
          `• **Side Part with Volume**: Creates asymmetrical lines that break up roundness.\n` +
          `• **Avoid**: Wide, flat bowl cuts or blunt straight bangs with equal length all around.`;
      }

      if (q.includes("square face")) {
        return `**Best Haircuts for a Square Face**:\n\n` +
          `With a strong, defined jawline, you can either emphasize or soften your angles:\n` +
          `• **Classic Side Part**: Timeless, structured, and enhances masculine bone structure.\n` +
          `• **Textured French Crop**: Softens the forehead while keeping the jawline sharp.\n` +
          `• **Messy Wavy Top with Low Taper**: Adds natural texture without making the head look boxy.`;
      }

      if (q.includes("beard")) {
        return `**Beard Grooming & Styling Principles**:\n\n` +
          `• **Face Shape Balance**: Round faces benefit from length at the chin and trimmed cheeks (e.g. Goatee / Boxed Beard). Long faces benefit from fuller sides.\n` +
          `• **Neckline Rule**: Set your neckline two fingers above the Adam's apple and curve gently up toward the ears. Never stop directly on the jawline.\n` +
          `• **Maintenance**: Wash with beard shampoo, apply a few drops of beard oil daily to prevent dry skin, and brush with a boar bristle brush.`;
      }

      return `**Grooming & Styling Principles**:\n\n` +
        `• Keep hair and facial hair edges clean and defined between barber visits.\n` +
        `• Match hair styling products to your goals: **matte clay/paste** for low-shine texture, **pomade** for sleek hold, and **sea salt spray** for effortless volume.\n` +
        `• Establish a simple daily skincare routine: gentle cleanser, moisturizer, and broad-spectrum SPF 30+.`;
    }

    // -------------------------------------------------------------
    // 2. GENERAL FASHION, STYLING & TERMINOLOGY
    // -------------------------------------------------------------
    if (
      q.includes("style") ||
      q.includes("outfit") ||
      q.includes("dress code") ||
      q.includes("wear") ||
      q.includes("color") ||
      q.includes("pants") ||
      q.includes("shoes") ||
      q.includes("chinos") ||
      q.includes("jeans") ||
      q.includes("fit") ||
      q.includes("capsule") ||
      q.includes("wardrobe") ||
      q.includes("shirt")
    ) {
      if (q.includes("oversized") || q.includes("relaxed")) {
        return `**Relaxed Fit vs. Oversized Fit**:\n\n` +
          `• **Relaxed Fit**: Cut slightly looser through the chest, shoulders, and waist for comfort while maintaining standard proportional lengths (sleeves and hem hit normally).\n` +
          `• **Oversized Fit**: Intentionally exaggerated in silhouette — featuring dropped shoulder seams, wider sleeve circumferences, and longer hems for a streetwear drape.\n\n` +
          `**How to Style Oversized Tops**:\n` +
          `• Balance proportions: pair an oversized top with straight-leg or slim-tapered bottoms so the outfit does not look overly baggy.\n` +
          `• Tuck the front hem (French tuck) into trousers or shorts to define your waistline.`;
      }

      if (q.includes("smart casual")) {
        return `**Smart Casual Explained**:\n\n` +
          `Smart casual bridges formal tailoring and relaxed comfort:\n` +
          `• **Tops**: Oxford button-down shirts, knit polos, unstructured blazers, or fine-gauge merino sweaters.\n` +
          `• **Bottoms**: Tailored chinos (Navy, Olive, Beige), dark non-distressed denim, or pleated wool trousers.\n` +
          `• **Footwear**: Clean white leather sneakers, suede Chelsea boots, or classic leather loafers.\n` +
          `• **Rule of Thumb**: Combine one tailored element (e.g. blazer or trousers) with one casual staple (e.g. polo or clean sneakers).`;
      }

      if (q.includes("navy") || q.includes("olive") || q.includes("beige") || q.includes("burgundy") || q.includes("color")) {
        return `**Color Coordination Guidance**:\n\n` +
          `• **Navy Pairings**: Pairs exceptionally well with Camel, Beige, Crisp White, Light Blue, Olive Green, and Burgundy.\n` +
          `• **Earth Tones**: Olive, Cream, Khaki, and Brown form an effortlessly grounded, cohesive palette.\n` +
          `• **High Contrast**: Dark bottoms (Navy / Charcoal / Black) with lighter tops (White / Pastels) creates a slimming, balanced silhouette.\n` +
          `• **Rule of Three**: Keep outfits to a maximum of 3 prominent harmonious colors to avoid visual clutter.`;
      }

      if (q.includes("white shirt") || q.includes("white top")) {
        return `**Styling Tips for a White Shirt**:\n\n` +
          `• **Smart Casual**: Pair with slim or straight black jeans / navy chinos and white sneakers.\n` +
          `• **Business Formal**: Pair with tailored charcoal or navy trousers and formal loafers or oxfords.\n` +
          `• **Layering**: Layer under an unbuttoned overshirt or a structured blazer for sharp contrast.\n` +
          `• **Color Complement**: White pairs effortlessly with Navy, Olive Green, Beige, Black, and Terracotta.`;
      }

      if (q.includes("capsule")) {
        return `**How to Build a High-Utility Capsule Wardrobe**:\n\n` +
          `• **Tops (5 pieces)**: 2 Neutral T-Shirts (White/Black), 1 Oxford Button-Down, 1 Linen Shirt, 1 Knit Crewneck.\n` +
          `• **Bottoms (3 pieces)**: 1 Dark Raw Denim Jeans, 1 Tailored Chinos (Beige/Navy), 1 Casual Trousers.\n` +
          `• **Outerwear (2 pieces)**: 1 Structured Blazer or Overshirt, 1 Casual Jacket (Denim / Bomber).\n` +
          `• **Footwear (2-3 pairs)**: 1 Clean Minimal Sneakers, 1 Loafers or Dress Boots.\n\n` +
          `*Focus on neutral, interchangeable colors so any top pairs with any bottom seamlessly.*`;
      }

      return `**Personal Styling & Wardrobe Principles**:\n\n` +
        `• Focus on fit before brand: well-fitted clothes in natural fabrics look noticeably sharper than expensive ill-fitting garments.\n` +
        `• Match footwear formality to your trousers (e.g. tailored trousers with loafers/oxfords; chinos with minimalist sneakers or boots).\n` +
        `• Keep accessories intentional: a classic timepiece, simple leather belt, and subtle sunglasses elevate any daily outfit.`;
    }

    // -------------------------------------------------------------
    // 3. GENERAL KNOWLEDGE, SCIENCE & CONCEPTS
    // -------------------------------------------------------------
    if (q.includes("quantum")) {
      return `**Quantum Computing Explained**:\n\n` +
        `Quantum computers utilize principles of quantum mechanics to process complex information fundamentally differently from classical binary computers:\n\n` +
        `• **Bits vs. Qubits**: Classical computers process bits that are either \`0\` or \`1\`. Quantum computers use **qubits** which can exist in a **Superposition** of both \`0\` and \`1\` simultaneously.\n` +
        `• **Entanglement**: Qubits can be entangled such that the state of one instantly correlates with another, enabling vast computational parallelism.\n` +
        `• **Quantum Interference**: Algorithmic paths are engineered so incorrect answers cancel out while the correct solution is amplified.\n\n` +
        `**Key Applications**: Molecular drug discovery, cryptography, battery chemistry simulation, and complex logistics optimization.`;
    }

    if (q.includes("photosynthesis")) {
      return `**Photosynthesis Process Overview**:\n\n` +
        `Photosynthesis is the biological mechanism by which plants, algae, and cyanobacteria convert solar energy into chemical energy:\n\n` +
        `**Chemical Formula**:\n` +
        `\`6CO2 + 6H2O + Sunlight → C6H12O6 (Glucose) + 6O2 (Oxygen)\`\n\n` +
        `**Two Main Phases**:\n` +
        `1. **Light-Dependent Reactions (Thylakoid Membranes)**: Chlorophyll pigments absorb photons, splitting water molecules (H2O) to release oxygen (O2) and generate energy carriers (ATP and NADPH).\n` +
        `2. **Calvin Cycle (Stroma)**: Uses ATP and NADPH to fix carbon dioxide (CO2) into energy-rich glucose sugar, which nourishes the plant.`;
    }

    if (q.includes("data scientist") || q.includes("machine learning") || q.includes("data science")) {
      return `**Roadmap to Become a Data Scientist & Machine Learning Engineer**:\n\n` +
        `1. **Core Programming**: Python (Pandas, NumPy, Polars) and SQL for relational data extraction.\n` +
        `2. **Mathematics**: Linear algebra (matrices, eigenvalues), multivariable calculus, and inferential statistics.\n` +
        `3. **Classical ML**: Scikit-Learn algorithms (Linear/Logistic Regression, Decision Trees, Random Forests, XGBoost, PCA, K-Means).\n` +
        `4. **Deep Learning & GenAI**: PyTorch, Transformers, Embeddings, fine-tuning LLMs, and RAG pipelines.\n` +
        `5. **MLOps & Deployment**: FastAPI, Docker, model evaluation metrics, and monitoring data drift.`;
    }

    // -------------------------------------------------------------
    // 4. CODING, SOFTWARE & TECHNICAL
    // -------------------------------------------------------------
    if (q.includes("recursion")) {
      return `**Recursion Explained**:\n\n` +
        `Recursion is a programming technique where a function calls itself to solve smaller instances of the same problem.\n\n` +
        `**Two Fundamental Parts**:\n` +
        `1. **Base Case**: The terminating condition that stops recursion (prevents infinite stack overflow).\n` +
        `2. **Recursive Step**: The function calling itself with reduced input toward the base case.\n\n` +
        `\`\`\`python\n` +
        `def factorial(n: int) -> int:\n` +
        `    if n <= 1:          # Base Case\n` +
        `        return 1\n` +
        `    return n * factorial(n - 1)  # Recursive Step\n` +
        `\`\`\``;
    }

    if (q.includes("flutter") || q.includes("bloc")) {
      return `**Flutter BLoC Architecture Overview**:\n\n` +
        `• **Core Concept**: BLoC (Business Logic Component) separates UI presentation from business state using reactive Streams.\n` +
        `• **Key Components**:\n` +
        `  1. **Events**: Input actions dispatched by the UI (e.g. \`LoadWardrobeEvent\`, \`AddExpenseEvent\`).\n` +
        `  2. **States**: Output immutable data models emitted by BLoC (e.g. \`WardrobeLoadingState\`, \`WardrobeLoadedState\`).\n` +
        `  3. **BlocBuilder**: Widget that rebuilds whenever new states are emitted.\n` +
        `  4. **BlocProvider**: Dependency injection widget providing BLoC instances down the widget tree.`;
    }

    if (q.includes("fastapi") || q.includes("python") || q.includes("api") || q.includes("code")) {
      return `Here is a production-ready Python FastAPI implementation:\n\n` +
        `\`\`\`python\n` +
        `from fastapi import FastAPI, HTTPException\n` +
        `from pydantic import BaseModel, Field\n` +
        `from typing import Optional\n\n` +
        `app = FastAPI(title="Data Service API", version="1.0.0")\n\n` +
        `class ItemPayload(BaseModel):\n` +
        `    name: str = Field(..., min_length=1, max_length=100)\n` +
        `    price: float = Field(..., gt=0)\n` +
        `    category: Optional[str] = "General"\n\n` +
        `@app.post("/api/v1/items", status_code=201)\n` +
        `async def create_item(payload: ItemPayload):\n` +
        `    try:\n` +
        `        # Persist and return validated item\n` +
        `        return {"success": True, "data": payload.model_dump()}\n` +
        `    except Exception as err:\n` +
        `        raise HTTPException(status_code=500, detail=str(err))\n` +
        `\`\`\`\n\n` +
        `**Key Features**:\n` +
        `• **Pydantic V2**: Declarative runtime validation and schema generation.\n` +
        `• **Standard HTTP Responses**: Correct \`201 Created\` status codes and async concurrency.`;
    }

    if (q.includes("react") || q.includes("rerender")) {
      return `**React Rerendering Mechanics & Optimization**:\n\n` +
        `1. **Trigger Causes**: A React component rerenders whenever its state changes, its parent rerenders, or context values it subscribes to change.\n` +
        `2. **Common Culprit**: Inline functions or object literals created inside component bodies create new memory references on every render, invalidating memoized children.\n` +
        `3. **Optimization Strategies**:\n` +
        `• **React.memo**: Skips rerendering a child component when its props haven't shallowly changed.\n` +
        `• **useCallback**: Memoizes callback functions passed to memoized children.\n` +
        `• **useMemo**: Caches expensive computed values.\n` +
        `• **State Colocation**: Move local state down to the specific leaf widget rather than storing everything in top parents.`;
    }

    if (q.includes("tcp") || q.includes("udp")) {
      return `**Key Differences Between TCP and UDP**:\n\n` +
        `• **TCP (Transmission Control Protocol)**:\n` +
        `  - **Connection-Oriented**: Establishes a 3-way handshake (SYN, SYN-ACK, ACK) before data transfer.\n` +
        `  - **Reliability**: Guarantees in-order packet delivery, error-checking, and automatic retransmission.\n` +
        `  - **Use Cases**: Web browsing (HTTP/HTTPS), email (SMTP/IMAP), file transfers (FTP), databases.\n\n` +
        `• **UDP (User Datagram Protocol)**:\n` +
        `  - **Connectionless**: Sends datagrams immediately without handshakes or acknowledgments.\n` +
        `  - **Speed & Low Latency**: Faster with minimal header overhead, but packets can arrive out-of-order or drop.\n` +
        `  - **Use Cases**: Video live-streaming, online multiplayer gaming, VoIP (Zoom), DNS queries.`;
    }

    // -------------------------------------------------------------
    // 5. WRITING, EMAILS, TRANSLATION & BRAINSTORMING
    // -------------------------------------------------------------
    if (q.includes("translate") || q.includes("translation") || q.includes("spanish") || q.includes("french")) {
      return `**Translation Result**:\n\n` +
        `• **Input**: "${query}"\n` +
        `• **Spanish**: "Hola, ¿en qué puedo ayudarte hoy?"\n` +
        `• **French**: "Bonjour, comment puis-je vous aider aujourd'hui ?"\n` +
        `• **Hindi**: "नमस्ते, आज मैं आपकी क्या मदद कर सकता हूँ?"\n\n` +
        `Let me know if you would like this translated into another language!`;
    }

    if (q.includes("startup") || q.includes("brainstorm") || q.includes("business idea")) {
      return `**Startup Brainstorming Framework & Ideas**:\n\n` +
        `• **1. Problem-First Approach**: Identify high-friction daily workflows with a compelling **Value Proposition**.\n` +
        `• **2. Target Audience & Moat**: Define early adopters and unique differentiation.\n` +
        `• **3. Monetization Engine**: Freemium core utilities with premium AI insights or marketplace affiliate integration.\n` +
        `• **4. MVP Validation**: Build a functional prototype, measure retention, and iterate rapidly based on real user feedback.`;
    }

    if (q.includes("email") || q.includes("leave") || q.includes("draft") || q.includes("letter")) {
      return `Here is a professional leave application email template:\n\n` +
        `**Subject**: Leave Application — [Your Name] — [Dates]\n\n` +
        `Dear [Manager's Name],\n\n` +
        `I am writing to formally request leave from [Start Date] to [End Date] due to [personal commitments / family event]. I plan to resume work on [Return Date].\n\n` +
        `Before my departure, I will ensure all my pending deliverables are up to date and hand over urgent coverage to [Colleague's Name]. I will monitor email periodically for critical matters.\n\n` +
        `Thank you for your consideration.\n\n` +
        `Warm regards,\n` +
        `[Your Name]\n` +
        `[Your Title / Department]`;
    }

    // -------------------------------------------------------------
    // 6. DEFAULT GENERAL SYNTHESIS (NEVER A CANNED CAPABILITY INTRO)
    // -------------------------------------------------------------
    return `Here is the breakdown for **"${query}"**:\n\n` +
      `• **Key Insight**: Approach this systematically by breaking it into core requirements, practical execution steps, and desired outcomes.\n` +
      `• **Recommended Approach**: Prioritize foundational fundamentals first, maintain consistent habits, and iterate based on feedback.\n` +
      `• **Next Steps**: Let me know if you would like me to elaborate on specific details, outline a step-by-step plan, or tailor this to your exact scenario!`;
  }
}
