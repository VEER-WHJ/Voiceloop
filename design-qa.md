# Secret Burger VoiceLoop design QA

## Evidence

- Source visual truth: `C:\Users\veerk\.codex\generated_images\01a02074-6123-7933-850f-230f04130a9f\exec-28268887-5dc4-4923-8d32-5a51a815af72.png`
- Browser-rendered implementation: `C:\Users\veerk\OneDrive\Documents\Voiceloop\qa-secret-burger-mobile.png`
- Combined comparison: `C:\Users\veerk\OneDrive\Documents\Voiceloop\qa-secret-burger-comparison.png`
- Source pixels: 1487 × 1058.
- Implementation pixels: 615 × 2486 full-page capture.
- Browser CSS viewport: 630 × 774 at device pixel ratio 1.020833.
- State: Overview, All locations, default attention and chain-health state.
- Normalization: the implementation was captured in the user's active narrow Codex browser panel. Its first 1058 pixels were placed beside the full desktop visual target without density resampling. The differing widths are an intentional desktop-to-mobile responsive comparison, so layout measurements were not judged as direct pixel matches.

## Full-view comparison evidence

The responsive implementation preserves the source's cream canvas, Secret Burger red and ink palette, location-first navigation, dominant attention panel, chain-health section, source-freshness section, outlined cards, restrained elevation, neutral secondary actions, and strong serif display hierarchy. The desktop two-column attention area stacks into a single-column mobile reading order. Persistent controls remain reachable; the location row scrolls horizontally rather than clipping labels.

## Focused region comparison evidence

The combined comparison keeps the header, location selector, attention card, action buttons, and the start of chain health readable at native density. A second crop was unnecessary because the remaining source-freshness and table patterns repeat the same border, type, color, and spacing tokens already visible in those regions.

## Required fidelity surfaces

- Fonts and typography: Georgia/Times display fallbacks now mirror the editorial serif hierarchy in the reference; compact UI text stays sans-serif. Heading scale and weight were increased per the selected revision.
- Spacing and layout rhythm: 18px panels, 2px stone borders, five-pixel low-contrast shadows, 24–32px internal spacing, and stacked mobile actions create the requested clearer separation without crowding.
- Colors and visual tokens: cream, Secret Burger red, espresso ink, warm stone borders, emerald positive states, and orange warning states remain consistent across the shell and legacy data flows.
- Image and icon fidelity: interface icons come from Phosphor; no placeholder imagery, emoji, CSS drawings, or custom SVG approximations were introduced. The Secret Burger mark is typographic because the visual target itself is typographic and no official brand asset was supplied.
- Copy and content: all overview copy, sample evidence, location names, source names, and manager context are Secret Burger-specific. Live Google connection copy clearly distinguishes prepared UI from an activated OAuth integration.

## Comparison history

1. Initial P2: implementation typography was heavier sans-serif than the selected editorial reference. Fix: applied a serif display family to headings and the Secret Burger mark, then recaptured the implementation.
2. Initial P2: the previous VoiceLoop cards were too faint and secondary actions were blue/red. Fix: standardized two-pixel stone outlines, subtle low shadows, larger headings, and black/grey secondary buttons throughout the Secret Burger shell and existing screens.
3. Post-fix evidence: `qa-secret-burger-comparison.png` shows both fixes in the header, attention card, chain-health card, and secondary actions. No actionable P0, P1, or P2 visual issues remain.

## Interaction and console verification

- Location switching updates the overview location-performance state.
- Evidence drawer opens with matching Secret Burger review quotes and closes correctly.
- Sidebar/mobile menu navigation works for Overview, Reviews, Sources, Uploads, AI digest, and Settings.
- Review search queries Supabase and updates pagination/results.
- Source cards route to upload; Google opens a consent-safe setup dialog.
- Sample CSV validates as eight rows without inserting data during QA.
- Settings switches update their accessible `aria-checked` state.
- Browser console: no errors observed after navigation and interaction checks.
- Production build: passed.
- ESLint: passed.

## Follow-up polish

- P3: replace the typographic Secret Burger mark with an official supplied logo asset if the client provides one.
- P3: connect the prepared Google consent flow after OAuth credentials and manager approval are available.

final result: passed
