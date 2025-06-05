# Kiwi Quiz Challenge – Complete Specification

Create a fully functional, accessible, and browser-friendly quiz game in the style of *Who Wants to Be a Millionaire*, themed around Kiwi (New Zealand) culture. The game must be self-contained, bilingual, and playable offline with all features included.

---

## 🎮 Game Description

Develop a 15-question quiz game using only HTML, CSS, and JavaScript. The game should run directly from `index.html`, work offline, and offer a welcoming experience for all ages.

---

## 🧠 Game Logic

* 15 questions, increasing in difficulty
* Each question has 4 options; only one correct
* Lifelines:

  * 50:50 (removes 2 incorrect options)
  * Ask the Audience (shows bar chart)
  * Phone a Friend (simulated answer hint)
* Prize ladder progression with visual state
* Win state, lose state, or user withdrawal
* Final screen with prize or encouragement

---

## 🖥️ Interface & Style

* Clean, responsive layout
* Accessible color contrast
* Visually highlight current question/prize
* Feedback animations (e.g., shake for wrong, glow for correct)

---

## 🌐 Language Toggle

* Toggle between English and Te Reo Māori
* All UI elements, messages, and questions must support both
* Example mappings:

  * Correct → Tika
  * Incorrect → Hē
  * Question → Pātai
  * Play Again → Tākaro Anō

---

## 🔊 Audio & Effects

* Optional sound cues for:

  * Correct answer
  * Incorrect answer
  * Lifeline used
  * Win/fail transitions
* Use Web Audio API or inline JavaScript only

---

## 📁 Data & Structure

* Questions stored in a `questions.js` file

  * Must include English and Māori for both question and options
  * Include metadata (difficulty level, category)

---

## ♿ Accessibility Requirements

* Keyboard-accessible lifeline and answer buttons
* Use `aria-label` for buttons and messages
* Use `aria-live` for announcing answer feedback
* Color contrast must meet WCAG 2.1

---

## 🔐 Technical Requirements

* Pure HTML, CSS, JavaScript
* No frameworks or CDNs
* Must load and function fully offline
* Compatible with GitHub Pages (static hosting)

---

## ✅ Output Files

* `index.html`
* `style.css`
* `script.js`
* `data/questions.js`

All files must work standalone, with no build step required. Include comments in code for all core logic sections.
