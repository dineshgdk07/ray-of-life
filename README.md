# ray-of-life

## Site

**"Ray of Life"** is an interactive web-based narrative experience designed to evoke emotion through visual storytelling. It combines technical creativity with artistic direction to create a "digital poem."

**Key Technical Pillars:**

- **Atmospheric Visuals:** The site relies heavily on HTML5 Canvas and DOM manipulation to create dynamic lighting (a spotlight effect that reveals content), generative particle systems (drifting hearts, floating dust), and smooth CSS transitions.
- **Audio Integration:** Background music is tightly coupled with user interaction, featuring auto-play handling, volume fade-ins, and state-based warnings.
- **Interactive Mechanics:** The experience tracks mouse movement to control a "Firefly" light source, creating a sense of exploration and discovery.

## Flow

The narrative unfolds in three distinct Acts, each with its own visual style and interaction model.

### 1. Act 1: The Search

- **The Hook:** The experience begins in total darkness. A single "firefly" follows the user's cursor, casting a dynamic spotlight (`lightRadius`) that reveals the hidden world underneath.
- **The Entities:** Hidden "Heart" particles drift in the darkness. They exhibit "shy" behavior—fading in when the light is near, but actively fleeting (repulsion) if the light gets too close/bright.
- **The Choice:** A "Yes/No" prompt appears. The "No" button is programmed with a "runaway" mechanic:
  - It calculates "safe zones" relative to the cursor to dodge interaction.
  - After 3 failed attempts to click it, the button "breaks," admitting defeat and guiding the user to "Yes."
- **Transition:** Selecting "Yes" triggers the background music and fades out the Act 1 layer.

### 2. Act 2: The Message

- **The Shift:** The visual style shifts from a dark, abstract void to a warm, textured parchment interface.
- **Magic Ink:** A custom typewriter effect reveals a poem stanza by stanza. Unlike standard text reveals, this splits words into individual character spans (`char-span`) and animates their opacity to simulate ink absorbing into paper.
- **Atmosphere:** subtle "dust motes" float across the screen, adding depth and a sense of stillness to the reading experience.
- **Progression:** The user reads through the poem sections. At the end, a "Page Turn" effect clears the text, presenting the button to move to the finale.

### 3. Act 3: The Proposal

- **The Climax:** The final question is presented.
- **Outcomes:**
  - **"Yes" (The Golden Evening):** Triggers the `celebrate()` function. This initializes a full-screen Canvas overlay where hundreds of golden particles explode and drift, simulating a magical, glowing evening. The text changes to a celebratory message, and the background brightens.
  - **"No" (The Sad Ending):** The screen plunges into a red-tinted darkness. A somber message appears, respecting the user's choice but altering the mood entirely.
