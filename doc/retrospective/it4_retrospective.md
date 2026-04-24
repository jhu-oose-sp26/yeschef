For iteration 4, we planned to complete the following objectives:

- Implemented and stabilized security and authentication across the full stack, including signup, login, token refresh, and email verification flows, JWT validation on all protected routes, and integration with Supabase Auth linked to our local users table
- Extended backend functionality to allow friends to view each other's saved and liked recipes, including new API routes for HasLiked and additional test coverage
- Built out the Create tab, allowing logged-in users to post recipes with a title, prep/cook time, ingredients, and steps
- Reworked the Home tab so users can scroll through friends' posted recipes, with loading, empty, error, and refresh states handled
- Built the Search tab with recipe search by name or partial name, and filtering by ingredient and preparation time
- Built the Browse tab for exploring a seeded database of recipes
- Completed the full Profile page on the frontend
- Extended and updated the relational database schema in Supabase, including a new Posts table with appropriate primary and foreign key relationships
- Reworked backend routing and optimized database calls to better accommodate the frontend
- Achieved full-stack deployment by identifying and configuring hosting tools for both the frontend and backend

What we did well for iteration 4:

- We made substantial progress across every layer of the stack simultaneously. Each team member owned a distinct area (authentication, social backend, frontend tabs, database schema, and deployment) and all of those pieces came together by the end of the iteration.
- The app is now in a near-complete visual and functional state, with the Create, Home, Browse, Search, and Profile pages all implemented and the backend fully secured with authentication.
- Caroline successfully merged contributions from all individual branches and resolved conflicts to keep the codebase synchronized.

Challenges from Iteration 4 and how we will improve:

- Deployment was completed later than planned, in part due to an unexpected hardware failure. One team member's laptop became completely unresponsive and had to be replaced entirely. While this was outside of our control, we recognize that we could have used the delay more proactively by researching hosting options and deployment configuration in the meantime. In the next iteration, we will identify deployment dependencies earlier so that a blocker on one person does not stall the team's overall progress.
- Our API routes have been noticeably slow, negatively impacting the user experience. Anna made initial progress reworking backend routing and optimizing database calls this iteration, but further improvement is needed. Addressing API performance will be a continued priority in iteration 5.
- We did not sufficiently account for friendship functionality on the frontend, despite social features being central to the app's purpose. The full backend for friend connections has been implemented, but this is not yet reflected in the UI. This meant that users currently have no way to add friends or view their friends' activity in a meaningful way. In the next iteration, we will prioritize surfacing these features on the frontend so the social layer of the app is actually accessible to users.