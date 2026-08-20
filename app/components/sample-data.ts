export type Sentiment = "Positive" | "Neutral" | "Negative";

export type Review = {
  id: number;
  date: string;
  source: "Google" | "Yelp" | "OpenTable";
  rating: number;
  sentiment: Sentiment;
  theme: string;
  text: string;
};

export const reviews: Review[] = [
  { id: 1, date: "Aug 18, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Friendly staff", text: "The staff was friendly and welcoming, and our server checked on us often." },
  { id: 2, date: "Aug 18, 2026", source: "Yelp", rating: 5, sentiment: "Positive", theme: "Food quality", text: "The pasta was delicious and tasted fresh. We will absolutely come back." },
  { id: 3, date: "Aug 17, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Slow service", text: "We waited almost forty minutes for our food after ordering." },
  { id: 4, date: "Aug 17, 2026", source: "OpenTable", rating: 3, sentiment: "Negative", theme: "Parking", text: "Parking was difficult to find on Friday night." },
  { id: 5, date: "Aug 16, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Atmosphere", text: "The dining room felt cozy, clean, and perfect for a quiet dinner." },
  { id: 6, date: "Aug 16, 2026", source: "Yelp", rating: 3, sentiment: "Negative", theme: "Food temperature", text: "Our food arrived lukewarm even though the flavor was good." },
  { id: 7, date: "Aug 15, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Slow service", text: "Service was slow after we ordered drinks and nobody checked in." },
  { id: 8, date: "Aug 15, 2026", source: "OpenTable", rating: 5, sentiment: "Positive", theme: "Friendly staff", text: "Everyone on the team was kind and helpful with our large group." },
  { id: 9, date: "Aug 14, 2026", source: "Yelp", rating: 5, sentiment: "Positive", theme: "Food quality", text: "The pizza was flavorful and the ingredients tasted incredibly fresh." },
  { id: 10, date: "Aug 14, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Slow service", text: "There was a long wait before anyone took our order." },
  { id: 11, date: "Aug 13, 2026", source: "Google", rating: 3, sentiment: "Negative", theme: "Parking", text: "We had to park two blocks away, which was frustrating in the rain." },
  { id: 12, date: "Aug 13, 2026", source: "OpenTable", rating: 5, sentiment: "Positive", theme: "Atmosphere", text: "The atmosphere was warm and relaxing without being too loud." },
  { id: 13, date: "Aug 12, 2026", source: "Yelp", rating: 3, sentiment: "Neutral", theme: "Slow service", text: "Our server was friendly, but the meal took a long time." },
  { id: 14, date: "Aug 12, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Food temperature", text: "The soup arrived cold and needed to be sent back." },
  { id: 15, date: "Aug 11, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Food quality", text: "Great food and a welcoming staff. The fresh bread was excellent." },
  { id: 16, date: "Aug 11, 2026", source: "Yelp", rating: 5, sentiment: "Positive", theme: "Atmosphere", text: "The dining room was spotless and comfortable." },
  { id: 17, date: "Aug 10, 2026", source: "OpenTable", rating: 2, sentiment: "Negative", theme: "Slow service", text: "We waited too long for the check after finishing dinner." },
  { id: 18, date: "Aug 10, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Food quality", text: "The dessert was delicious and beautifully presented." },
  { id: 19, date: "Aug 9, 2026", source: "Yelp", rating: 3, sentiment: "Negative", theme: "Parking", text: "Parking near the restaurant is frustrating during dinner hours." },
  { id: 20, date: "Aug 9, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Friendly staff", text: "The staff handled our allergy request carefully and kindly." },
  { id: 21, date: "Aug 8, 2026", source: "OpenTable", rating: 2, sentiment: "Negative", theme: "Food temperature", text: "The fries were not hot when they reached the table." },
  { id: 22, date: "Aug 8, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Food quality", text: "Amazing food, especially the fresh bread and seasonal pasta." },
  { id: 23, date: "Aug 7, 2026", source: "Yelp", rating: 3, sentiment: "Neutral", theme: "Slow service", text: "Service took longer than expected during lunch, though everyone was polite." },
  { id: 24, date: "Aug 7, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Friendly staff", text: "Friendly people and a cozy atmosphere made our evening memorable." },
];

export const positiveThemes = [
  { name: "Food quality", count: 6, tone: "positive" as const, description: "Fresh ingredients, strong flavor, and memorable dishes." },
  { name: "Friendly staff", count: 6, tone: "positive" as const, description: "Warm, attentive service and thoughtful accommodation." },
  { name: "Atmosphere", count: 4, tone: "positive" as const, description: "A cozy, clean, and comfortable dining room." },
];

export const frictionThemes = [
  { name: "Slow service", count: 6, tone: "warning" as const, description: "Long waits for ordering, food, and the check." },
  { name: "Food temperature", count: 3, tone: "warning" as const, description: "Several dishes arrived lukewarm or cold." },
  { name: "Parking", count: 3, tone: "warning" as const, description: "Guests struggled to find nearby spaces." },
];
