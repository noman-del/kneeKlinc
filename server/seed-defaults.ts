import "dotenv/config";
import { connectDB } from "./db";
import { DefaultRecommendation } from "@shared/additional-schema";

const gradeDefaults: Record<string, { label: string; severity: string; riskScore: number; items: string[] }> = {
  "0": {
    label: "KL 0 – No OA",
    severity: "Normal",
    riskScore: 20,
    items: [
      "Maintain a daily step count of 8,000 to 10,000 steps",
      "Strength training for the quadriceps, gluteal muscles, and core should be performed two to three times per week to support knee stability.",
      "Sudden increases in exercise intensity or participation in high-impact activities should be avoided to prevent unnecessary knee strain.",
      "Following a Mediterranean-style diet rich in vegetables, fruits, whole grains, fish, olive oil, and nuts supports joint and metabolic health.",
      "Adequate intake of vitamin D and calcium is important for maintaining strong bones and supporting joint function.",
      "Focus on joint-friendly footwear with good cushioning and support.",
    ],
  },
  "1": {
    label: "KL 1 – Minimal OA",
    severity: "Minimal",
    riskScore: 35,
    items: [
      "Begin a structured low-impact exercise program (cycling, swimming, brisk walking) 3-4 times per week.",
      "Introduce gentle range-of-motion and flexibility exercises for the knee daily.",
      "Start basic quadriceps and hip-strengthening exercises under guidance.",
      "Use ice or heat after activity if mild discomfort appears.",
      "Limit prolonged standing or kneeling on hard surfaces.",
      "Eat more fruits, vegetables, and healthy fats like fish and nuts helps reduce inflammation and supports joint health.",
    ],
  },
  "2": {
    label: "KL 2 – Mild OA",
    severity: "Minimal",
    riskScore: 55,
    items: [
      "Follow a supervised physiotherapy program focusing on knee strength and flexibility.",
      "Perform low-impact aerobic exercise (swimming, cycling, elliptical) at least 150 minutes per week.",
      "Use joint-friendly weight loss strategies if overweight to reduce knee load.",
      "Incorporate balance and proprioception exercises to improve knee stability.",
      "Drink enough water throughout the day",
      "Use activity modification: avoid deep squats, jumping, and running on hard surfaces.",
      "Limiting sugary drinks, fried foods, and packaged snacks helps control inflammation and weight gain.",
    ],
  },
  "3": {
    label: "KL 3 – Moderate OA",
    severity: "Moderate",
    riskScore: 75,
    items: [
      "Engage in targeted physiotherapy for pain reduction and functional improvement.",
      "Use assistive devices like a cane or knee brace if recommended to offload the joint.",
      "Implement a weight management plan to significantly reduce joint stress.",
      "Break up long periods of sitting or standing with short movement breaks.",
      "Consider supervised aquatic therapy to maintain fitness with less joint impact.",
      "Reduce salt intake, Include healthy fats from olive oil, nuts, seeds, and fish",
    ],
  },
  "4": {
    label: "KL 4 – Severe OA",
    severity: "Severe",
    riskScore: 90,
    items: [
      "Schedule an in-depth consultation with a knee specialist to review imaging and symptoms.",
      "Use walking aids (cane, walker) to improve stability and decrease pain during walking.",
      "Follow a gentle, pain-limited exercise program focusing on mobility and muscle maintenance.",
      "Optimize pain control using medications or injections as advised by your doctor.",
      "Modify daily activities: avoid stairs when possible and use handrails and supports.",
      "Eat soft, easy-to-digest, nutrient-rich foods like vegetables, mashed fruits, oatmeal, yogurt, soft rice, lentils, soups, eggs, cottage cheese, tofu, and fish",
    ],
  },
};

async function seedDefaults() {
  try {
    await connectDB();

    for (const [klGrade, cfg] of Object.entries(gradeDefaults)) {
      await DefaultRecommendation.findOneAndUpdate(
        { klGrade },
        {
          klGrade,
          label: cfg.label,
          severity: cfg.severity,
          riskScore: cfg.riskScore,
          items: cfg.items,
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded DefaultRecommendation for KL grade ${klGrade}`);
    }

    console.log("✅ All DefaultRecommendation docs seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed defaults:", error);
  } finally {
    process.exit(0);
  }
}

seedDefaults();
