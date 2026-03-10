# ECS272-Final

## Overview
Hi! :D  

This is our github for ECS 272 final project.  

Our topic is Visualizing Travel City Choices Under Real-World Constraints and it's built on the [Worldwide Travel Cities Ratings and Climate](https://www.kaggle.com/datasets/furkanima/worldwide-travel-cities-ratings-and-climate) dataset (~560 cities globally).   

The system guides users through a narrative intro before opening up an interactive exploration space, where they can filter cities by budget, duration, and personal preferences, and understand why certain choices emerge rather than just which city ranks highest in their needs.
The interface includes a guided tutorial, a home page for our main visualization, an interactive world map explorer with a LLM-based travel plan builder and a visualization gallery with charts and chart recommendations.  

Have fun exploring! 

## Set-up process
1. git clone
2. npm install
3. npm run dev

## Main Pages introduction
### Tutorial
This is the entry point of the system. It displays a world map placeholder with a navigation menu that links to all four main pages. First-time visitors are guided with on-screen hints showing where to click and which page to visit next, following a step-by-step tour across the system.
### Viz Gallery
This presents seven pre-built visualizations covering different angles of the dataset, including regional comparisons, city profiles, budget distributions, climate trends, and score distributions. A factor filter panel lets users select what they are curious about and receive ranked chart recommendations based on their interests. (can add more in the future!)
### Main Viz
This is the primary interactive world map. Cities are plotted as colored dots representing five travel styles (Escape, Buzz, Unwind, Enrich, Thrill), each scored using a weighted formula across nine lifestyle dimensions. Users can toggle travel styles, hover over cities to inspect scores, zoom in for detail, and expand factor cards to see top-ranked cities and scoring formulas.
### Explore Your Own
This gives users full control over the dataset. Filters for budget level, trip duration, and preferred experiences narrow the 560-city pool in real time. Hovering a city shows a side-by-side comparison against the previously hovered city across all selected dimensions. Click the dot and create your plan to obtain a AI-generated trip plan of the city.


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
│   └── Tradeoff.tsx
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
    └── Tradeoff.css

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
  

Thanks for exploring!