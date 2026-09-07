# DripScore AI

# DRIPCHECK — PART 1

## Foundation, Branding, Navigation & Home Page

Build the foundation of a full-stack web application called **DripCheck**.

DripCheck is a Gen-Z fashion and outfit analysis platform.

The core idea:

> **Step in. Get scored. Own the vibe.**

Users can:

* Check an outfit using their camera
* Upload an outfit photo
* Receive an AI-powered style analysis
* Get a Drip Score from 1–10
* Receive useful styling suggestions
* Compare their score with others
* Compete on a daily leaderboard
* Discover trending outfits
* Save and share their results

This is being built for a **college technology showcase**, so the UI needs to feel like a real modern startup product rather than a college assignment.

---

# DESIGN DIRECTION

Create a premium Gen-Z fashion aesthetic.

Use:

* Dark-first UI
* Black / charcoal background
* White typography
* One strong neon/vibrant accent
* Subtle gradients
* Large rounded cards
* Fashion photography
* Glassmorphism only where appropriate
* Smooth micro-interactions
* Modern typography
* Minimal but bold layout

The interface should feel inspired by modern social apps, fashion platforms and premium AI products.

Do NOT copy Instagram, TikTok, Pinterest or any existing platform.

Create a unique DripCheck identity.

Avoid excessive emojis.

Use emojis selectively.

---

# BRAND

Name:

**DripCheck**

Main tagline:

**Step in. Get scored. Own the vibe.**

Secondary tagline:

**Your fit. AI's verdict.**

Logo should be simple and text-based initially.

Create a small flame/check-style icon that can be used as the brand mark.

---

# MAIN NAVIGATION

Desktop:

Left sidebar or top navigation with:

* Home
* Live Check
* Photo Check
* Discover
* Leaderboard
* Saved
* Profile

Prominent CTA:

**🔥 Check My Fit**

Mobile:

Use bottom navigation:

Home
Live
Check
Discover
Profile

---

# HOME PAGE

The homepage should immediately communicate the main purpose of DripCheck.

Hero section:

Large headline:

**What's the verdict on your fit?**

Subtitle:

**Check your outfit with AI, get your Drip Score, and see how your style stacks up.**

Primary button:

**🔥 Live Fit Check**

Secondary button:

**📸 Upload a Fit**

---

# HERO VISUAL

Create a large stylish visual card showing an example person/outfit.

Overlay:

**DRIP SCORE**

# 8.9

Then show small breakdown:

Style 9.2
Colors 8.7
Coordination 8.9

Add a subtle animated score ring.

---

# DAILY TOP 3

This is an important feature.

Place a stylish **Top 3 of the Day** leaderboard in the top-right area of the homepage on desktop.

Title:

**🔥 Today's Drip**

Display:

🥇 #1
🥈 #2
🥉 #3

Each user card should show:

* Profile image
* Username
* Outfit thumbnail
* Drip Score

Example:

#1 @alexdrip — 9.7
#2 @sarahstyle — 9.5
#3 @rahulfits — 9.4

Make this visually impressive.

The leaderboard must eventually use real database data.

For now, create demo data if the database is not yet populated.

---

# LIVE CHECK CTA

Create a large section:

## LIVE FIT CHECK

**Don't upload. Just step in.**

Subtitle:

"Turn on your camera and let DripCheck analyze your fit."

Button:

**Start Live Check**

Add a small animated camera indicator.

---

# PHOTO CHECK CTA

Section:

## Got the perfect mirror pic?

Upload it.

Button:

**Upload My Fit**

---

# HOW IT WORKS

Three cards:

### 01

📸
**Show the fit**

Use Live Camera or upload a photo.

### 02

🤖
**AI checks the details**

DripCheck analyzes style, colors, coordination and accessories.

### 03

🔥
**Get your score**

Receive a Drip Score and personalized suggestions.

---

# TRENDING FITS

Create a horizontally scrollable section:

**Trending Fits**

Each card:

Outfit image
Username
Drip Score
Style tags

Example:

#streetwear
#minimal
#sneakers

---

# STYLE CATEGORIES

Create visually attractive categories:

Streetwear
Minimal
Y2K
Old Money
Vintage
Athleisure
Grunge
Techwear
Korean
Casual
Formal

Clicking a category should eventually open filtered discovery results.

---

# HOME PAGE MICROINTERACTIONS

Add:

* Smooth card hover
* Score number animation
* Button hover
* Subtle glow
* Page transition
* Skeleton loading
* Smooth scrolling

Do not over-animate.

---

# IMPORTANT

Build the actual reusable components and routing.

Do NOT make this only a static landing page.

Prepare the architecture for:

* Authentication
* Database
* AI analysis
* Live camera
* Outfit uploads
* Ratings
* Leaderboard
* Social features

Use clean reusable components.

Preferred stack:

React/Next.js if supported by Lovable
Tailwind CSS
Supabase
PostgreSQL
Supabase Auth
Supabase Storage

Use TypeScript if available.

At this stage, focus on the foundation and Home Page, but structure everything so later features can connect to real data.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fit-score-vibe.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/713bee32-5a4f-435f-b1c4-038a18ffacb1).

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
