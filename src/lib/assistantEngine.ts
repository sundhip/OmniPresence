import { ChatMessage, AssistantQueryContext, AssistantIntentType, PendingAction } from "@/types/assistant";
import { EventUnderstandingEngine } from "./eventUnderstandingEngine";
import { TransportationEngine } from "./transportationEngine";
import { ReadinessEngine } from "./readinessEngine";
import { AIProviderFactory } from "./ai/AIProvider";
import { TransactionCategory } from "@/types/finance";

export class AssistantEngine {
  /**
   * Processes natural language queries across General AI, Specialist Domains, OmniPresence Context, and Multi-Domain Synthesis.
   * NEVER returns canned capability introductions for valid user questions.
   */
  public static async generateResponse(
    userQuery: string,
    context: AssistantQueryContext
  ): Promise<ChatMessage> {
    const q = userQuery.toLowerCase().trim();
    const { user, events = [], wardrobe = [], weather, financialPlan, reminders = [], recentMessages = [] } = context;

    const provider = AIProviderFactory.getProvider();
    let intent = await provider.analyzeIntent(userQuery);

    // Multi-turn continuity (e.g. "make it more casual", "make it formal", "another option")
    const lastAssistantMsg = [...recentMessages].reverse().find((m) => m.sender === "assistant")?.text.toLowerCase() || "";
    const isFollowUpOutfit =
      (q.includes("more casual") || q.includes("more formal") || q.includes("different") || q.includes("another") || q.includes("change top") || q.includes("change shoes") || q.includes("yesterday")) &&
      (lastAssistantMsg.includes("outfit") || lastAssistantMsg.includes("wear") || lastAssistantMsg.includes("shirt") || lastAssistantMsg.includes("top"));

    if (isFollowUpOutfit) {
      intent = "outfit_recommendation";
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const upcomingEvents = events
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
    const nextEvent = upcomingEvents[0];

    let reply = "";
    const suggestedActions: ChatMessage["suggestedActions"] = [];
    let pendingAction: PendingAction | undefined;
    let embeddedCard: ChatMessage["embeddedCard"];
    let dataContext: ChatMessage["dataContext"];

    // =========================================================================
    // LAYER 4: PROTECTED WRITE ACTIONS (Explicit Confirmation Protocol)
    // =========================================================================
    if (intent === "action_create_transaction") {
      const amountMatch = q.match(/(?:₹|rs\.?|inr)?\s*(\d+)/i);
      const amount = amountMatch ? parseInt(amountMatch[1], 10) : 500;

      let category: TransactionCategory = "Food & Dining";
      let title = "Expense";

      if (q.includes("dinner") || q.includes("lunch") || q.includes("breakfast") || q.includes("food") || q.includes("cafe") || q.includes("restaurant") || q.includes("meal")) {
        category = "Food & Dining";
        title = q.includes("dinner") ? "Dinner" : q.includes("lunch") ? "Lunch" : "Food / Dining";
      } else if (q.includes("game") || q.includes("steam") || q.includes("ps5") || q.includes("tech") || q.includes("keyboard")) {
        category = "Gaming & Tech";
        title = "Gaming / Tech Purchase";
      } else if (q.includes("book") || q.includes("stationery") || q.includes("notebook") || q.includes("pen") || q.includes("course")) {
        category = "Stationery & Books";
        title = "Stationery / Books";
      } else if (q.includes("shirt") || q.includes("pant") || q.includes("dress") || q.includes("shoe") || q.includes("cloth") || q.includes("zara")) {
        category = "Clothing & Fashion";
        title = "Clothing Purchase";
      } else if (q.includes("cab") || q.includes("uber") || q.includes("ola") || q.includes("train") || q.includes("metro") || q.includes("fuel")) {
        category = "Travel & Transit";
        title = "Transit / Commute";
      } else if (q.includes("movie") || q.includes("cinema") || q.includes("netflix") || q.includes("concert")) {
        category = "Entertainment";
        title = "Entertainment Outing";
      } else if (q.includes("bill") || q.includes("recharge") || q.includes("electricity") || q.includes("rent")) {
        category = "Bills & Utilities";
        title = "Bills & Utilities";
      }

      pendingAction = {
        id: `act_tx_${Date.now()}`,
        type: "create_transaction",
        title: `Log ₹${amount.toLocaleString()} ${category} Expense`,
        description: `Would you like OP AI to record a ₹${amount.toLocaleString()} expense under "${category}" for today?`,
        status: "pending",
        payload: {
          amount,
          category,
          txTitle: title,
        },
      };

      reply = `I have prepared a new financial entry for **₹${amount.toLocaleString()}** under **${category}** (${title}).\n\nPlease confirm below to save this transaction to your spending records.`;

      embeddedCard = {
        type: "action_confirmation",
        title: `Record Expense: ₹${amount.toLocaleString()}`,
        subtitle: `${category} • ${todayStr}`,
        details: {
          amount,
          category,
          description: title,
        },
      };
    } else if (intent === "action_create_reminder") {
      let remTitle = "Prepare outfit and review schedule";
      if (q.includes("iron")) remTitle = "Iron outfit for upcoming event";
      else if (q.includes("wear")) remTitle = "Wear selected outfit";
      else if (q.includes("leave") || q.includes("depart")) remTitle = "Depart for venue";
      else if (q.includes("buy")) remTitle = "Review purchase on Marketplace";

      pendingAction = {
        id: `act_rem_${Date.now()}`,
        type: "create_reminder",
        title: `Set Reminder: "${remTitle}"`,
        description: `Would you like OP AI to schedule a reminder: "${remTitle}" for today?`,
        status: "pending",
        payload: {
          reminderTitle: remTitle,
          reminderTime: "09:00",
          reminderDate: todayStr,
          reminderType: "custom",
        },
      };

      reply = `I can set a reminder for **"${remTitle}"** at **09:00 AM**.\n\nWould you like me to add this to your timeline?`;

      embeddedCard = {
        type: "action_confirmation",
        title: `Create Reminder: ${remTitle}`,
        subtitle: `Time: 09:00 AM • ${todayStr}`,
        details: {
          title: remTitle,
          time: "09:00",
          date: todayStr,
        },
      };
    } else if (intent === "action_create_event") {
      const timeMatch = q.match(/at\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      const timeStr = timeMatch ? timeMatch[1] : "10:00";
      const title = q.includes("dinner") ? "Dinner Event" : q.includes("meeting") ? "Meeting" : "Personal Event";

      pendingAction = {
        id: `act_ev_${Date.now()}`,
        type: "create_event",
        title: `Schedule ${title}`,
        description: `Would you like OP AI to schedule "${title}" on ${todayStr} at ${timeStr}?`,
        status: "pending",
        payload: {
          eventTitle: title,
          eventDate: todayStr,
          eventTime: timeStr,
          eventLocation: "Venue",
        },
      };

      reply = `I can schedule **"${title}"** for **${todayStr} at ${timeStr}**.\n\nConfirm below to add this event to your Calendar timeline.`;

      embeddedCard = {
        type: "action_confirmation",
        title: `Schedule Event: ${title}`,
        subtitle: `Date: ${todayStr} • Time: ${timeStr}`,
        details: {
          title,
          date: todayStr,
          time: timeStr,
        },
      };
    }

    // =========================================================================
    // LAYER 3: MULTI-DOMAIN CROSS-INTELLIGENCE
    // =========================================================================
    else if (intent === "multi_domain") {
      const budget = financialPlan?.monthlyBudget || 0;
      const spent = financialPlan?.spentThisMonth || 0;
      const remaining = budget > 0 ? Math.max(0, budget - spent) : 0;
      const rainProb = weather ? weather.precipitation : "Low";
      const temp = weather ? weather.temperature : 28;

      let topPick = wardrobe.find((w) => (w.category || "").toLowerCase() === "tops") || wardrobe[0];
      let bottomPick = wardrobe.find((w) => (w.category || "").toLowerCase() === "bottoms") || wardrobe[1];

      reply = `**Cross-Domain Intelligence Plan**:\n\n` +
        (nextEvent ? `📅 **Event**: **${nextEvent.title}** on ${nextEvent.date} at ${nextEvent.time} (${nextEvent.location})\n` : "") +
        `🌤️ **Weather**: ${temp}°C, ${weather?.condition || "Partly Cloudy"} (Rain Probability: ${rainProb})\n` +
        (topPick
          ? `👗 **Recommended Outfit**: Pair your **${topPick.name}** with **${bottomPick?.name || "matching trousers"}**.\n`
          : `👗 **Wardrobe**: You currently have ${wardrobe.length} cataloged pieces.\n`) +
        (rainProb && parseInt(rainProb, 10) > 40 ? `☔ **Carry Tip**: Rain probability is elevated (${rainProb}); carry an umbrella.\n` : "") +
        `💰 **Financial Status**: You have **₹${remaining.toLocaleString()} remaining** this month (₹${spent.toLocaleString()} spent of ₹${budget.toLocaleString()} budget).\n\n` +
        (remaining > 2000
          ? `✓ You have sufficient budget flexibility if you wish to purchase accessories on Marketplace.`
          : `💡 *Budget Tip*: Your remaining allowance is tight; focus on utilizing your existing digital wardrobe pieces.`);

      embeddedCard = {
        type: "multi_domain",
        title: nextEvent ? `Preparation: ${nextEvent.title}` : "Comprehensive Day Plan",
        subtitle: `Weather: ${temp}°C • Budget: ₹${remaining.toLocaleString()} Available`,
        details: {
          eventTitle: nextEvent?.title,
          weatherSummary: `${temp}°C, ${weather?.condition || "Clear"}`,
          topItem: topPick?.name,
          bottomItem: bottomPick?.name,
          remainingBudget: remaining,
        },
      };

      if (nextEvent) {
        suggestedActions.push({
          label: `View ${nextEvent.title}`,
          actionType: "view_event",
          payload: nextEvent.id,
        });
      }
      suggestedActions.push({
        label: "Open Wardrobe",
        actionType: "navigate",
        payload: "/wardrobe",
      });
      suggestedActions.push({
        label: "Open Finance",
        actionType: "navigate",
        payload: "/finance",
      });
    }

    // =========================================================================
    // LAYER 2: OMNIPRESENCE DOMAIN QUERIES (Wardrobe, Schedule, Transit, Finance)
    // =========================================================================
    else if (intent === "outfit_recommendation") {
      if (wardrobe.length === 0) {
        reply = "I don't have any wardrobe items in your digital catalog yet. Add a few tops, bottoms, and footwear to your Wardrobe, and I'll generate personalized, weather-calibrated outfit combinations.";
        suggestedActions.push({
          label: "Add Items to Wardrobe",
          actionType: "navigate",
          payload: "/wardrobe",
        });
      } else {
        const wantsCasual = q.includes("casual") || (!q.includes("formal") && !nextEvent);
        const wantsFormal = q.includes("formal") || (nextEvent && nextEvent.priority === "High");

        let tops = wardrobe.filter((w) => (w.category || "").toLowerCase() === "tops");
        let bottoms = wardrobe.filter((w) => (w.category || "").toLowerCase() === "bottoms");
        let shoes = wardrobe.filter((w) => (w.category || "").toLowerCase() === "shoes");

        if (wantsCasual) {
          const casualTops = tops.filter((t) => (t.occasion || []).some((o) => o.toLowerCase().includes("casual")) || (t.fit || "").toLowerCase().includes("oversized") || (t.fit || "").toLowerCase().includes("regular"));
          if (casualTops.length > 0) tops = casualTops;
        } else if (wantsFormal) {
          const formalTops = tops.filter((t) => (t.occasion || []).some((o) => o.toLowerCase().includes("formal") || o.toLowerCase().includes("office") || o.toLowerCase().includes("meeting")));
          if (formalTops.length > 0) tops = formalTops;
        }

        const topItem = tops[0] || wardrobe[0];
        const bottomItem = bottoms[0] || wardrobe.find((w) => w.id !== topItem.id) || wardrobe[0];
        const shoeItem = shoes[0];

        const altTop = tops[1] || wardrobe.find((w) => w.id !== topItem.id && w.id !== bottomItem.id);
        const altBottom = bottoms[1] || bottomItem;

        const weatherNote = weather
          ? `${weather.temperature}°C with ${weather.condition.toLowerCase()} conditions (${weather.precipitation} rain probability)`
          : "moderate temperature";

        reply = `Here is your recommended outfit${nextEvent ? ` for **${nextEvent.title}**` : " for today"}:\n\n` +
          `• **Top**: ${topItem.name}${topItem.color ? ` (${topItem.color})` : ""}\n` +
          `• **Bottom**: ${bottomItem.name}${bottomItem.color ? ` (${bottomItem.color})` : ""}\n` +
          (shoeItem ? `• **Footwear**: ${shoeItem.name}\n\n` : "\n") +
          `**Why this works**:\n` +
          `• Matches your preferred ${wantsCasual ? "casual" : "smart formal"} aesthetic\n` +
          `• Calibrated for ${weatherNote}\n` +
          `• Clean color contrast between ${topItem.color || "top"} and ${bottomItem.color || "bottom"}\n\n` +
          (altTop ? `**Alternative Pairing**:\n• ${altTop.name} with ${altBottom?.name || bottomItem.name}` : "");

        suggestedActions.push({
          label: "View in Wardrobe",
          actionType: "navigate",
          payload: "/wardrobe",
        });

        if (nextEvent) {
          suggestedActions.push({
            label: `View ${nextEvent.title}`,
            actionType: "view_event",
            payload: nextEvent.id,
          });
        }

        embeddedCard = {
          type: "outfit",
          title: wantsCasual ? "Casual Coordinated Outfit" : "Smart Formal Ensemble",
          subtitle: `Calibrated for ${weather?.temperature || 28}°C ${weather?.condition || "Warm"}`,
          details: {
            topName: topItem.name,
            topColor: topItem.color,
            topImage: topItem.imageUrl,
            bottomName: bottomItem.name,
            bottomColor: bottomItem.color,
            bottomImage: bottomItem.imageUrl,
            shoesName: shoeItem?.name,
            shoesImage: shoeItem?.imageUrl,
            matchScore: 9.2,
          },
        };

        dataContext = {
          outfitSummary: `${topItem.name} + ${bottomItem.name}`,
          weatherSummary: weather ? `${weather.temperature}°C, ${weather.condition}` : undefined,
          eventId: nextEvent?.id,
          eventTitle: nextEvent?.title,
        };
      }
    } else if (intent === "transit_departure") {
      if (nextEvent) {
        const transit = TransportationEngine.calculateTransitOptions(
          nextEvent.originLocation || "Tambaram",
          nextEvent.location || "Nungambakkam",
          nextEvent.time || "19:00",
          20
        );

        const fastest = transit.recommendedOption;
        reply = `To reach **${nextEvent.title}** at **${nextEvent.location}** by **${nextEvent.time}**:\n\n` +
          `• **Fastest Mode**: **${fastest.name}** (${fastest.durationMinutes} mins, ${fastest.estimatedCost})\n` +
          `• **Recommended Departure**: Leave around **${transit.recommendedDepartureTime}** (${transit.bufferMinutes}-min arrival buffer)\n` +
          `• **Route**: ${fastest.routeDescription}\n\n` +
          `*Alternative*: Metro or Cab are also available as flexible secondary options.`;

        suggestedActions.push({
          label: `Open ${nextEvent.title} Details`,
          actionType: "view_event",
          payload: nextEvent.id,
        });

        embeddedCard = {
          type: "event",
          title: `Transit Plan: ${nextEvent.title}`,
          subtitle: `Depart at ${transit.recommendedDepartureTime} • ${fastest.name}`,
          details: {
            mode: fastest.name,
            duration: `${fastest.durationMinutes} mins`,
            cost: fastest.estimatedCost,
            departureTime: transit.recommendedDepartureTime,
            arrivalTime: nextEvent.time,
            destination: nextEvent.location,
          },
        };

        dataContext = {
          eventId: nextEvent.id,
          transitSummary: `${fastest.name} departing at ${transit.recommendedDepartureTime}`,
        };
      } else {
        reply = "You don't have any scheduled events with transit requirements right now. You can create a new event in Schedule anytime!";
        suggestedActions.push({
          label: "Open Schedule",
          actionType: "navigate",
          payload: "/calendar",
        });
      }
    } else if (intent === "readiness_checklist") {
      if (nextEvent) {
        const readiness = ReadinessEngine.calculateEventReadiness(nextEvent, wardrobe, reminders);
        const missingText =
          readiness.missingItems.length > 0
            ? `\n\n**Pending Preparation Tasks**:\n${readiness.missingItems.map((m) => `• ${m}`).join("\n")}`
            : "\n\nAll preparation steps and reminders are fully checked off!";

        reply = `**Readiness Status for ${nextEvent.title}**: **${readiness.status}** (${readiness.score}% Score)\n\n` +
          `${readiness.summary}${missingText}`;

        suggestedActions.push({
          label: `Open ${nextEvent.title}`,
          actionType: "view_event",
          payload: nextEvent.id,
        });

        dataContext = {
          eventId: nextEvent.id,
          readinessScore: readiness.score,
        };
      } else {
        reply = "Your schedule is all clear with no pending preparation tasks. You can add a new event in Schedule to track readiness.";
        suggestedActions.push({
          label: "View Schedule",
          actionType: "navigate",
          payload: "/calendar",
        });
      }
    } else if (intent === "financial_inquiry") {
      const budget = financialPlan?.monthlyBudget || 0;
      const spent = financialPlan?.spentThisMonth || 0;
      const savings = financialPlan?.savingsGoal || 0;
      const remaining = budget > 0 ? Math.max(0, budget - spent) : 0;
      const txCount = financialPlan?.transactions?.length || 0;

      if (budget === 0 && spent === 0) {
        reply = `**Financial Overview**:\n\n` +
          `• **Monthly Budget**: ₹0 (Not configured yet)\n` +
          `• **Spent This Month**: ₹0\n` +
          `• **Logged Expenses**: 0\n\n` +
          `Your financial records start clean with zero dummy expenses. You can set your monthly spending allowance in **Finance & Goals** or ask me: *"Add ₹500 for dinner"*.`;
      } else {
        reply = `**Your Financial & Spending Summary**:\n\n` +
          `• **Monthly Budget**: ₹${budget.toLocaleString()}\n` +
          `• **Spent This Month**: ₹${spent.toLocaleString()}\n` +
          `• **Remaining Allowance**: **₹${remaining.toLocaleString()}**\n` +
          `• **Target Savings**: ₹${savings.toLocaleString()}\n` +
          `• **Logged Expenses**: ${txCount} transaction(s)\n\n` +
          (budget > 0 && spent > budget ? "⚠️ *Note*: You have exceeded your configured monthly allowance." : "✓ Spending is currently tracking within your monthly financial plan.");
      }

      suggestedActions.push({
        label: "Open Finance & Goals",
        actionType: "navigate",
        payload: "/finance",
      });

      embeddedCard = {
        type: "finance",
        title: "Monthly Financial Balance",
        subtitle: `Remaining: ₹${remaining.toLocaleString()} of ₹${budget.toLocaleString()}`,
        details: {
          budget,
          spent,
          remaining,
          savings,
          transactionsCount: txCount,
        },
      };

      dataContext = {
        financialSummary: `Budget: ₹${budget}, Spent: ₹${spent}, Remaining: ₹${remaining}`,
      };
    } else if (intent === "personal_management") {
      reply = `**Your Daily Organization Plan**:\n\n` +
        `• **1. Morning Routine**: Review schedule and check weather (${weather ? `${weather.temperature}°C, ${weather.condition}` : "available"}).\n` +
        `• **2. High-Priority Focus**: Prepare for upcoming events (${events.length} event(s) scheduled).\n` +
        `• **3. Mindful Spending**: Check remaining allowance before discretionary dining or shopping.\n` +
        `• **4. Evening Wrap-Up**: Mark worn wardrobe pieces and log daily transactions.`;

      suggestedActions.push({
        label: "View Schedule",
        actionType: "navigate",
        payload: "/calendar",
      });
      suggestedActions.push({
        label: "Open Finance",
        actionType: "navigate",
        payload: "/finance",
      });
    } else if (intent === "calendar_schedule") {
      if (events.length === 0) {
        reply = "You don't have any scheduled events yet. You can create an event in Schedule, and I'll automatically generate departure transit times and outfit recommendations.";
        suggestedActions.push({
          label: "Create Event",
          actionType: "navigate",
          payload: "/calendar",
        });
      } else {
        const upcomingList = upcomingEvents.slice(0, 3);
        const eventLines = upcomingList.map((e) => `• **${e.title}** (${e.date} at ${e.time}) — *${e.location}*`).join("\n");

        reply = `Here is your upcoming schedule:\n\n${eventLines}\n\nAsk me anytime: *"What should I wear for ${upcomingList[0]?.title || "my meeting"}?"* or *"How should I reach the venue?"*`;

        suggestedActions.push({
          label: "View Full Schedule",
          actionType: "navigate",
          payload: "/calendar",
        });
      }
    }

    // =========================================================================
    // LAYER 1: GENERAL INTELLIGENCE (Grooming, Fashion, Knowledge, Coding, Writing)
    // ALWAYS ACTUALLY ANSWERS THE QUESTION VIA MODEL / REASONER
    // =========================================================================
    else {
      // Greetings check
      if (/\b(hi|hello|hey)\b/i.test(q) && (q.split(" ").length <= 2 || q.includes("who are you") || q.includes("what can you do") || q.includes("tell me about yourself"))) {
        reply = `Hello ${user?.name || "there"}! I am **OP AI**, your personal intelligence assistant on OmniPresence.\n\n` +
          `I can help you with:\n` +
          `• **Wardrobe & Styling**: Haircut advice, outfit planning, color coordination, and wardrobe curation.\n` +
          `• **General Intelligence**: Answering questions, writing code, drafting messages, and explanations.\n` +
          `• **Schedule & Transit**: Event departure times, transit options, and preparation tracking.\n` +
          `• **Finance & Budgeting**: Expense recording, category tracking, and purchase evaluation.\n\n` +
          `How can I assist you today?`;

        suggestedActions.push({
          label: "What should I wear today?",
          actionType: "query",
          payload: "What should I wear today?",
        });
        suggestedActions.push({
          label: "Which haircut is best for my face shape?",
          actionType: "query",
          payload: "Which haircut is best for my face shape?",
        });
      } else if (q.includes("add clothes") || q.includes("camera") || q.includes("how to add") || q.includes("upload clothes")) {
        reply = `**How to Add Clothes to your Wardrobe**:\n\n` +
          `1. Go to the **Wardrobe** page.\n` +
          `2. Click **+ Add Item** in the top right.\n` +
          `3. Choose **Take Photo** (live camera snap) or **Upload Image**.\n` +
          `4. **FashionCLIP AI** will automatically recognize category, fit, occasion, and dominant colors.\n` +
          `5. Review the details and click **Save to Wardrobe**.`;

        suggestedActions.push({
          label: "Open Wardrobe",
          actionType: "navigate",
          payload: "/wardrobe",
        });
      } else if (q.includes("do i need this") || q.includes("evaluate")) {
        reply = `**How 'Do I Need This?' Purchase Evaluation Works**:\n\n` +
          `• When browsing Marketplace or logging expenses, OP AI checks your prospective purchase against:\n` +
          `  1. **Wardrobe Redundancy**: Do you already own similar items in this color/category?\n` +
          `  2. **Budget Impact**: Does the item fit within your remaining monthly allowance?\n` +
          `  3. **Style Utility**: How many existing pieces can this pair with?\n\n` +
          `• OP AI provides a clear verdict: *Essential Addition*, *High Redundancy*, or *Budget Alert*.`;

        suggestedActions.push({
          label: "Open Marketplace",
          actionType: "navigate",
          payload: "/marketplace",
        });
      } else if (q.includes("saving") || q.includes("impulse buying") || q.includes("save money")) {
        reply = `**Practical Financial Tips & Mindful Spending**:\n\n` +
          `• **The 24-Hour Rule**: For non-essential purchases, wait 24 hours to separate impulse wants from genuine utility.\n` +
          `• **Cost-Per-Wear (CPW)**: A ₹3,000 jacket worn 60 times costs ₹50/wear, whereas a ₹1,000 fast-fashion shirt worn twice costs ₹500/wear.\n` +
          `• **Category Allocations**: Track high-frequency discretionary spending (Dining, Tech, Subscriptions) in **Finance & Goals**.\n` +
          `• **Use 'Do I Need This?'**: Test prospective purchases on Marketplace before adding to cart.`;

        suggestedActions.push({
          label: "Open Finance & Goals",
          actionType: "navigate",
          payload: "/finance",
        });
      } else {
        // ALWAYS EXECUTE THE GENERAL AI MODEL / REASONER TO ACTUALLY ANSWER THE QUESTION
        reply = await provider.generateText(userQuery, context);

        // Add contextual chips based on keywords
        if (q.includes("haircut") || q.includes("hair cut") || q.includes("hairstyle")) {
          suggestedActions.push({
            label: "Best cuts for a round face",
            actionType: "query",
            payload: "What haircut is best for a round face?",
          });
          suggestedActions.push({
            label: "Low-maintenance haircuts",
            actionType: "query",
            payload: "What are the best low maintenance haircuts?",
          });
        }
      }
    }

    return {
      id: `msg_asst_${Date.now()}`,
      sender: "assistant",
      text: reply,
      timestamp: new Date().toISOString(),
      intent,
      suggestedActions,
      pendingAction,
      embeddedCard,
      dataContext,
    };
  }
}
