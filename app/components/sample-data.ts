export type Sentiment = "Positive" | "Neutral" | "Negative";

export type Review = {
  id: number;
  date: string;
  source: "Google" | "Yelp" | "DoorDash" | "Uber Eats" | "Grubhub";
  rating: number;
  sentiment: Sentiment;
  theme: string;
  text: string;
};

export const reviews: Review[] = [
  { id: 1, date: "Aug 21, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Food quality", text: "The burger was juicy, crisp around the edges, and one of the best I’ve had downtown." },
  { id: 2, date: "Aug 21, 2026", source: "DoorDash", rating: 5, sentiment: "Positive", theme: "Food quality", text: "Fries were still hot and crunchy when the order arrived. Everything tasted fresh." },
  { id: 3, date: "Aug 20, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Slow service", text: "We waited thirty-five minutes after ordering at Riverside and nobody explained the delay." },
  { id: 4, date: "Aug 20, 2026", source: "Uber Eats", rating: 3, sentiment: "Neutral", theme: "Food temperature", text: "Burger tasted good but arrived lukewarm and the cheese had already firmed up." },
  { id: 5, date: "Aug 19, 2026", source: "Yelp", rating: 5, sentiment: "Positive", theme: "Friendly staff", text: "The Downtown crew was genuinely welcoming and helped us navigate an allergy request." },
  { id: 6, date: "Aug 19, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Slow service", text: "Dinner rush at Riverside was chaotic. It took forever just to get our drinks." },
  { id: 7, date: "Aug 18, 2026", source: "Grubhub", rating: 4, sentiment: "Positive", theme: "Food quality", text: "Smash patties had great flavor and the house pickles made the whole burger." },
  { id: 8, date: "Aug 18, 2026", source: "Google", rating: 5, sentiment: "Positive", theme: "Atmosphere", text: "Northgate feels lively without being too loud. Great spot for a casual dinner." },
  { id: 9, date: "Aug 17, 2026", source: "DoorDash", rating: 2, sentiment: "Negative", theme: "Order accuracy", text: "The order was missing both sauces and one of the burgers had the wrong toppings." },
  { id: 10, date: "Aug 17, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Slow service", text: "There was a long line but only one register open at Riverside." },
  { id: 11, date: "Aug 16, 2026", source: "Yelp", rating: 5, sentiment: "Positive", theme: "Friendly staff", text: "The manager checked on every table and the team handled the rush with a smile." },
  { id: 12, date: "Aug 16, 2026", source: "Uber Eats", rating: 3, sentiment: "Neutral", theme: "Value", text: "Tasty burger, but the combo feels expensive once delivery fees are added." },
  { id: 13, date: "Aug 15, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Slow service", text: "Our food sat on the counter for several minutes before someone brought it over." },
  { id: 14, date: "Aug 15, 2026", source: "DoorDash", rating: 5, sentiment: "Positive", theme: "Food quality", text: "Excellent spicy chicken sandwich and the packaging kept everything crisp." },
  { id: 15, date: "Aug 14, 2026", source: "Google", rating: 4, sentiment: "Positive", theme: "Atmosphere", text: "Airport location was clean, quick, and much better than the usual terminal food." },
  { id: 16, date: "Aug 14, 2026", source: "Yelp", rating: 5, sentiment: "Positive", theme: "Food quality", text: "Perfect crust on the patty, soft bun, and a well-balanced house sauce." },
  { id: 17, date: "Aug 13, 2026", source: "Google", rating: 2, sentiment: "Negative", theme: "Slow service", text: "We waited too long for our order even though the dining room was only half full." },
  { id: 18, date: "Aug 13, 2026", source: "Uber Eats", rating: 4, sentiment: "Positive", theme: "Food quality", text: "Everything arrived exactly as ordered and the burgers traveled surprisingly well." },
];

export const positiveThemes = [
  { name: "Food quality", count: 8, tone: "positive" as const, description: "Crisp-edged patties, fresh toppings, hot fries, and memorable house sauces." },
  { name: "Friendly staff", count: 5, tone: "positive" as const, description: "Warm teams, thoughtful allergy support, and visible manager attention." },
  { name: "Atmosphere", count: 4, tone: "positive" as const, description: "Clean, energetic dining rooms that still feel comfortable." },
];

export const frictionThemes = [
  { name: "Slow service", count: 11, tone: "warning" as const, description: "Long ordering and pickup waits concentrated at Riverside during dinner service." },
  { name: "Food temperature", count: 5, tone: "warning" as const, description: "Delivery and counter orders occasionally reached guests lukewarm." },
  { name: "Order accuracy", count: 4, tone: "warning" as const, description: "Missing sauces and incorrect toppings appear most often in delivery orders." },
];
