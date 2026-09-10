# CineVocab: Learn Films

CineVocab App Specification & Implementation Prompt




Project Overview

CineVocab is an interactive web application designed to turn movie-watching into an intuitive vocabulary learning experience powered by Gemini AI and spaced repetition.




Core Navigation & Global Layout

Bottom Navigation Bar: Positioned fixed at the bottom of the page, spanning full-width, featuring three main tabs with clear icons and labels:




Discover (Home)

Word Bank

Review & Quiz

State Persistence: The application must save user preferences locally (e.g., in localStorage). If a user selects/chooses a specific movie, switches tabs, or refreshes/reopens the browser, the app must automatically remember and restore the last selected movie.

Notification System: Toast/alert notifications (e.g., when clicking the "Save Word" button) must smoothly stack or dismiss instantly. If a user saves a new card while a previous notification is active, the first notification must disappear immediately right before the new one animates into view to prevent visual jumping or clutter.

Tab 1: Discover (Home)

Core Function: Real-time vocabulary extraction from movie sentences using Gemini AI.




Movie Selection & Management UI

Design & UX: Re-imagine the movie selection and addition workflow to be compact, elegant, and space-efficient (avoiding multi-line wrapping when handling large movie collections).

Selection Interface: Use a custom-styled, interactive dropdown/combobox or slide-out menu featuring movie posters or stylized badges.

Add Movie Panel: Replacing basic browser inputs or tiny inline forms, the "Add Movie" modal/panel must feature a polished, modern overlay design matching the overall UI aesthetic, with full search capabilities and smooth animations.

Sentence Input & Results

Input Workspace: Clean, minimal input area featuring a prominent text box for pasting complex sentences from movies, alongside a primary Submit button that triggers the Gemini API request.

Word Extraction Cards: Render extracted difficult words into sleek cards.




Card Badge Layout (Single-Line Row): Standardize the metadata line directly beneath the target word to render three distinct, color-coded, soft-edge rectangular/oval pill badges arranged horizontally on the same line:




Phonetic IPA: Styled inside a soft-edge colored badge.

Part of Speech (Kind of Word): Color-coded dynamically based on the word type (e.g., Noun = Red, Verb = Green, Adjective = Blue, etc.).

Frequency & Usage Level: A creative 4-to-5 level indicator showing real-world utility (e.g., Very Common, Common, Uncommon, Rare), enclosed in a soft-edge colored badge.

Content: English definition followed by 3 natural, native-speaker example sentences.

Actions: An upgraded, visually distinct "Save Word" icon button (no audio/pronunciation play icon on the cards).

Tab 2: Word Bank

Core Function: A media-focused archive of all saved vocabulary organized by movie source.




Ordering & Card Design

Chronological Card Order: Display saved word cards in chronological order from oldest at the top to newest at the bottom.

Card Consistency: Apply the exact same single-line, soft-edge badge styling (IPA, color-coded Part of Speech, Frequency Level) to the saved cards in this view.

Accordion Folders & Export System

Movie Folders: An accordion or list view organized by movie title. Expanding a movie reveals its saved word cards.

Unified Export System: Remove individual per-movie export buttons. Use a single, prominent Global Export Button at the top of the tab:




Clicking the button opens a modal prompt asking the user:




Scope: Export a Specific Movie or All Movies.

Format: Choose between PDF or CSV.

PDF Formatting Specifications:




Header: Displays the Movie Title prominently at the top of the document.

Metadata Row: Render the IPA, Part of Speech, and Frequency Level clearly without text truncation, awkward font faces, line breaks, or incorrect IPA symbol rendering.

Compact Layout: Optimize vertical padding and remove excessive whitespace beneath example sentences so each word card remains compact and visually balanced on printed pages.

Tab 3: Review & Quiz

Core Function: Active recall, spaced repetition, and interactive knowledge testing.




Spaced Repetition Flashcards: Interactive flip cards displaying the target word on the front, with definition, examples, and rating buttons (Easy, Medium, Hard) on the back to calculate review schedules.

Interactive Quiz Modes:




Fill-in-the-Blank: Practice context retention by placing missing target words into original sentences.

Multiple Choice: Match vocabulary to correct definitions or synonyms.

Matching Game: Interactive side-by-side matching of target words with their corresponding meanings.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cinevocab-ai-learn.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/52f40bf0-30cf-43c2-b793-51b1642f1791).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
