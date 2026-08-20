import assert from "node:assert/strict";
import test from "node:test";

import {
  AnalysisValidationError,
  validateAnalysisBatch,
} from "../lib/analysis/contracts.ts";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];

test("accepts a complete controlled-vocabulary analysis batch", () => {
  const batch = validateAnalysisBatch(
    {
      results: [
        { id: ids[0], theme: "Food Quality", sentiment: "Positive" },
        { id: ids[1], theme: "Wait Time", sentiment: "Negative" },
        { id: ids[2], theme: "Food Quality", sentiment: "Neutral" },
      ],
    },
    ids,
  );

  assert.equal(batch.results.length, 3);
  assert.equal(batch.results[1].theme, "Wait Time");
});

test("rejects themes outside the controlled vocabulary", () => {
  assert.throws(
    () =>
      validateAnalysisBatch(
        {
          results: [
            { id: ids[0], theme: "Great Desserts", sentiment: "Positive" },
          ],
        },
        [ids[0]],
      ),
    AnalysisValidationError,
  );
});

test("rejects missing, unknown, or duplicate ids", () => {
  assert.throws(
    () =>
      validateAnalysisBatch(
        {
          results: [
            { id: ids[0], theme: "Food Quality", sentiment: "Positive" },
            { id: ids[0], theme: "Wait Time", sentiment: "Negative" },
          ],
        },
        [ids[0], ids[1]],
      ),
    AnalysisValidationError,
  );
});
