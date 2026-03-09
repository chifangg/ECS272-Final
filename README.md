# ECS272-Final

## Overview
Hi! :D  

This is our ECS 272 final project github.  

Our topic is Visualizing Travel City Choices Under Real-World Constraints and it's built on the [Worldwide Travel Cities Ratings and Climate](https://www.kaggle.com/datasets/furkanima/worldwide-travel-cities-ratings-and-climate) dataset (~560 cities globally).   

The system guides users through a narrative intro before opening up an interactive exploration space, where they can filter cities by budget, duration, and personal preferences, and understand why certain choices emerge rather than just which city ranks highest in their needs.
The interface includes a guided tutorial, a home page for our main visualization, an interactive world map explorer with a LLM-based travel plan builder and a visualization gallery with charts and chart recommendations.  

Have fun exploring! 

## Set-up process
1. git clone
2. npm install
3. npm run dev

## Project structure
```bash
src/
├── app/
│   ├── App.tsx
│   └── routes.tsx
│
├── pages/
│   ├── Intro.tsx
│   ├── IntrAfterLoad.tsx
│   ├── Starter.tsx
│   ├── Home.tsx
│   ├── Gallery.tsx
│   ├── Explore.tsx
│   ├── TravelPlan.tsx
│   └── Tutorial.tsx
│
├── components/
│   ├── TopBar.tsx
│   ├── TutorialTopBar.tsx
│   ├── NormalTopBar.tsx
│   ├── BottomBar.tsx
│   ├── LoadingIntro.tsx
│   └── ContinueOverlay.tsx
│
├── data/
│   └── loadData.ts
│
├── assets/
│
└── styles/
    ├── theme.css
    ├── layout.css
    ├── pageTransition.css
    ├── Home.css
    ├── Gallery.css
    ├── Explore.css
    ├── TravelPlan.css
    ├── Tutorial.css
    ├── Starter.css
    ├── NormalTopBar.css
    ├── TutorialTopBar.css
    ├── LoadingIntro.css
    └── ContinueOverlay.css

public/
├── data/
│   └── cities.csv
└── viz/
    ├── city_world_map.html
    ├── city_radar.html
    ├── city_heatmap.html
    ├── budget_donut.html
    ├── temp_linechart.html
    ├── region_grouped_bar.html
    └── score_histogram.html
```

TBC :D