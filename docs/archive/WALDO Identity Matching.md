# WALDO: Identity Matching

> WALDO is Straddle's proprietary identity matching algorithm designed to securely and accurately verify that a customer's identity matches the ownership details of their bank account.

Built on LSTM-based natural language processing algorithms and deployed through a cloud-native architecture, Waldo provides a robust API delivering high-accuracy name matching with exceptional performance. By accounting for cultural, typographical, and formatting differences, Waldo helps organizations improve data quality, streamline operations, and enhance the customer experience.

## Overview

WALDO stands for **W**eighted **A**lgorithm for **L**egitimate **D**ata **O**wnership. It is Straddle's proprietary identity matching algorithm designed to securely and accurately verify that a customer's identity matches the ownership details of their bank account.

Determining if two name strings refer to the same individual is deceptively complex. Traditional string comparison methods often fail to capture the multidimensional nature of name representation, resulting in high rates of false positives or false negatives.

Name variations arise in many ways. Common names frequently have multiple accepted spellings, such as “Jonathan” vs. “Johnathan,” and informal nicknames (e.g., “Elizabeth” vs. “Liz,” “Beth,” or “Betty”) complicate matching further. Cross-cultural factors introduce additional layers, as names transliterated from languages with different alphabets can appear under multiple spellings (e.g., the Russian “Михаил” might be “Mikhail,” “Michael,” or “Mihail”). Variations in name ordering, suffixes (“Jr.,” “Sr.,” “III”), and honorifics (“Dr.,” “Prof.”) also add complexity. Finally, typographical errors and data-entry mistakes create further inconsistencies.

## How WALDO Works

### **Name Normalization**

Waldo first normalizes input names by:

1. Converting characters to a common case and trimming extraneous whitespace.
2. Identifying and separating suffixes (e.g., “Jr,” “Sr,” “II”) from the main name components.
3. Standardizing punctuation (e.g., handling “O’Brien,” “O Brien,” “OBrien,” “O-Brien” consistently).

This step removes superficial formatting discrepancies, reducing false negatives that arise from differences in casing, punctuation, or whitespace.

### **Name Variation Generation**

Waldo generates multiple plausible variations for each name, reflecting common changes seen in real-world data:

- **Reordering**: First name–last name, inversions, and optional middle names.
- **Nicknames**: Associating formal names with known diminutives (e.g., “Robert” → “Rob,” “Bob,” etc.).
- **Initials**: Handling records that use initials instead of full names.

By comparing an expanded set of variations for each input, Waldo finds matches that simpler approaches would overlook, reducing false negatives.

### **Similarity Calculation**

1. **Pairwise Comparisons**: For each variation of `name1` and `name2`, Waldo applies specialized string, cultural, and phonetic comparisons from the HMNI library.
2. **Maximum Similarity Extraction**: The system takes the highest similarity score across all variation pairs, representing the closest possible match.
3. **Business Rules**: Additional refinements incorporate domain logic—for example, distinguishing family name matches vs. first-name inconsistencies.
4. **Score Normalization**: The final score is normalized to a 0–100 range, enabling straightforward thresholding and integration into client workflows.

This multistage process yields substantially higher accuracy than simple string comparison methods, crucial for real-world data sets prone to typographical errors and diverse naming conventions.

## PAYKEY GENERATION

If a WALDO match is verified and the Customer is verfied via Straddle identity, Straddle creates a special kind of token: the paykey.

Straddle uses **BLAKE3** as the cryptographic core of our paykeys. It’s a modern hash function coming out of the same lineage as BLAKE2, which you’ll find inside things like the Linux kernel and WireGuard. BLAKE3 was designed to be _as secure as BLAKE2_ but way faster, with a tree structure that can saturate all your cores and SIMD lanes. In practice, that means multi-threaded implementations can be more than twenty times faster than older designs when hashing large messages.

For us, that matters because every time you see a paykey in this demo, we’ve taken verified identity data plus verified bank data, run it through BLAKE3 in keyed mode, and produced a token that looks like random noise to the outside world. That same primitive also acts as our MAC, PRF, and KDF — so we can derive per-tenant keys, authenticate tokens, and manage keys using _one_ well-analyzed algorithm instead of a zoo of legacy primitives.

The result is: we can mint and verify these identity-linked paykeys at very high throughput, with modern cryptographic guarantees, while never exposing raw account numbers or PII to the client. It’s the kind of performance you need if you want identity-first bank payments to feel like a card network, not like a batch file from the ’70s.”

https://www.ietf.org/archive/id/draft-aumasson-blake3-00.html

Understanding Your Vision

You want to build a visual demonstration widget that shows the audience how Straddle generates paykeys through:

1. WALDO identity matching (LSTM-based name matching)
2. BLAKE3 cryptographic hashing

This is for a demo/presentation context, so it needs to be:

- Visually compelling and educational
- Clear enough for a presenter to explain
- Technically accurate in representation (even if simulated)

Key Questions to Refine the Design

1. Trigger & Placement

- When should this widget appear?
  - During /create-paykey command execution?

ANSWER: YES, before we show the paykey generated card

- Should it be a modal overlay, a slide-out panel, or something else?

ANSWER: I think a modal that automatically pops-up then dissapears, with a greenkey animation going to the customer card and the paykey card when complete

2. Visual Style

- Should this match the existing retro 8-bit aesthetic (cyan/magenta neon, scanlines, CRT effects)?
- Or do you want something more "technical/cryptographic" looking (Matrix-style, binary streams, hash visualizations)?

ANSWER: I kind of want something more technical while not deviating from the overall vibes too much

3. Interaction Level

- Passive animation: Automatically plays through the steps with timing

ANSWER: Passive

4. Data Source

- Should it use real customer/paykey data from the current demo state?

ANSWER: Real data

5. Level of Technical Detail

For WALDO, should we show:

- Just the phases (Normalization → Variation → Matching → Score)?
- Actual name variations being generated?
- The similarity score calculation progressing?

ANSWER: All 3 if possible, note the similarty score is actually being calculated by strddle so we'll always receive a static value, but this is a demo so lets show cool shit

For BLAKE3, should we show:

- The tree structure concept visually?
- Pseudo-code or algorithm steps?
- The actual hash output being generated character-by-character?

ANSWER: How deep can you go here? like the tree structure plus hash

6. Educational Callouts

- Do you want tooltips/info boxes explaining technical terms?
- Should there be a "Learn More" link to docs?
- Inline explanations vs. clean visualization?

ANSWER: we will add a "user guide" and "glossary" tabs later, not in scope for your project

Initial Design Hypothesis

Based on your description, here's what I'm leaning toward:

A modal overlay with 3 animated stages:

Stage 1: WALDO Identity Matching

- Shows customer name from demo state
- Shows bank account owner name
- Animated steps: Normalize → Generate Variations → Compare → Score
- Visual: Name strings morphing, variation tree expanding, similarity score rising 0→95

Stage 2: BLAKE3 Hashing

- Shows inputs: verified identity + verified bank data
- Animated: Tree-based parallel hashing visualization
- Visual: Binary/hex streams flowing through a tree structure, converging to final hash

Stage 3: Paykey Generation

- Shows the final paykey token being assembled
- Format: 758c519d.02.c16f91... (actual format from your API)
- Visual: Token KEY "minting" with a cryptographic seal effect

Style: Retro-futuristic hybrid - keep the neon cyan/magenta but add Matrix-style binary rain and hash visualization

Interaction: ~~Auto-plays with ability to replay,~~ each stage ~3-5 seconds

ANSWER: this should autoplay with no replay, i think the whole thing should take no longer than 10-15 seconds. long enough for the narrative
