# Software Requirement Specification

## Problem Statement
People often lack a reliable way to evaluate recipes before investing time and money into making them. While platforms like NYT Cooking offer high-quality recipes, they don’t really provide feedback on whether a recipe actually delivers good results and if it is realistically achievable for the average home cook. Additionally, people often need a centralized place to organize recipes they’ve tried, liked, disliked, or want to try. 

There's also a missed opportunity for people to curate and share their personal recipes in a social environment where friends can try, rate, and provide feedback on each other's cooking. This can create a network of recipe discovery that goes beyond algorithm-driven recommendations.


## Potential Clients
The user base would be home cooks / everyday chefs who would like a platform to manage and rate their own recipes and to view and recreate their friends recipes. 

## Proposed Solution
We will build a recipe app that allows users to search and rate recipes from trusted sources like NYT Cooking on two critical dimensions: taste/outcome quality and ease of execution. This dual-rating system will help home cooks quickly identify recipes that are both delicious and realistically achievable, reducing wasted time and ingredients on disappointing results. The app will also function as a social app and personal recipe management system where users can organize their recipe collection, upload their own creations, and share them within their social network. By enabling friends to try and rate each other's recipes, we create a trusted feedback loop that goes beyond anonymous reviews and allow people to build a community around shared cooking experiences.


## Functional Requirements 
### Must Have
- As a forgetful user, I want to be able to rate recipes I have tried so I can easily recall how well the recipe came out and how easy it was to make.
- As a creative user, I want to be able to upload my own recipes so I can maintain an archive of my favorite recipes.
- As an uninspired cook, I want to be able to discover new recipes from other outlets like the New York Times so I can find ideas for what to make for dinner without having to research multiple sites online.
- As a social user, I want to be able to see my friends’ recipes so I can see what my friends are up to and try out their favorite foods.
- As a reflective user, I want to be able to see my own profile so I can keep track of my stats and my own digital cookbook.
- As a curious user, I want to be able to search and filter for new recipes based on cuisine type, ingredients, and recipe difficulty so I can use up the produce in my fridge and minimize food waste.
- As an organized user, I want to be able to save recipes so that I can quickly refer to them when I want to cook.
- As a frequent user, I want to be able to sign in from different devices so that I can see my recipes wherever I am. 

### Nice to Have
- As an organized user, I want to be recommended recipes based on what I like, have made, and I have saved so that I don’t have to search for recipes that I think I will want.
- As a environmentally-conscious user, I want to be able to tell the app what ingredients I have and get a customized recipe using up exactly what I have so I waste less food and use everything I buy.
- As a lazy user, I want to be able to upload the physical recipes I have written down by taking a photo, so I don’t have to type out all of the recipes I have already and can easily transition to use the app.
- As a visual learner, I want to be able to scroll through short-form videos of people cooking and showing off their recipes so that I can better follow the cooking process.
- As a reflective user, I want to be able to see a “Wrapped” summary of my year in recipes so that I can reminisce and see in retrospect how my year of cooking has been.
- As a social user, I want to be able to comment on people’s recipes so that I can express my feelings and interact with other users.
- As a keen user, I want to be able to receive notifications if people friend me or like my recipes so that I can stay up-to-date on my online interactions.
- As a no-nonsense user, I want to be able to read one-line summaries of each recipe so that I can quickly understand what each recipe is without having to read all of the details.
- As a categorically-minded person, I want to be able to filter recipes by cuisine type and allergens so that I can quickly narrow search results. 

## Non-functional Requirements
- The application should be able to save the user (should not having to sign in every time app opens)
- The home page / explore page should infinitely scroll
- The app should operate smoothly (no lagging webpages)

## Software Architecture & Technology Stack
- **Frontend:** React Native, JavaScript/TypeScript (Expo)
- **Backend:** Spring boot, Java (Maven)
- **Database + Auth:** Supabase

## Similar Apps
- Pepper App
    - User's are able to post their favorite meals and recipes for their friends to see
    - It allows user to import, organize, and share recipes from TikTok, Instagram, and blogs    
    - Our app has similar functionalies on the social aspect (interacting with friends), but our's differs by the rating aspect
- Beli
    - Has rating aspect but only for restaurants and cannot upload your own cooking/food
    - Has social aspect where you can see what your friends rate other restaurants
    - Our app differ's for utilizing recipies instead of restaurants and being able to upload your own personal recipes. 
- Tasty
    - Functions as a comprehensive digital cookbook and cooking coach with video guided recipes
    - Our app is mainly focused on the social aspect of sharing recipes and trying each others. We also have the rating aspect for the recipes. 