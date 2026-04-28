For iteration 5, we planned to complete the following objectives:

- Implemented comments functionality, including backend routes, controller logic, and test coverage
- Implemented password reset functionality with transactional email support via Resend, linked to a custom domain
- Set up a custom domain and configured it with Vercel for deployment, along with alternative Supabase redirect URLs for authentication flows
- Redesigned and updated the frontend UI across the Profile, Search, Friends, and Login/Sign Up pages
- Implemented image uploading (including HEIC support) for Post objects, with database storage, API routes, and frontend integration
- Implemented a notification system with associated backend routes and test coverage
- Wrapped recipe data in post routes to better support UI needs, and added tests for post routes, comments, and notifications
- Completed friends functionality and the ability to view other users' profiles
- Redesigned UI for recipe cards, Home, Posts, and Create pages, and updated the app to utilize the Posts model throughout

What we did well for iteration 5:

- The app reached a polished, feature-complete state this iteration. The social layer that was missing from iteration 4 (friends, other users' profiles, and activity feeds) is now fully accessible to users on the frontend, directly addressing one of our key gaps from last time.
- The team delivered meaningful improvements at every layer of the stack simultaneously, from backend infrastructure (comments, notifications, password reset) to deployment configuration (custom domain, email integration) to a cohesive UI redesign.
- Julia supplied a full visual redesign of the app with other memmbers giving input during the design process. The full visual design gave the app a consistent and refined look across all pages, and a few other team memebers helped following through on implementing and debugging that design across key screens.

Challenges from Iteration 5 and how we will improve:

UI bug tracking was decentralized, which caused issues to slip through the cracks. Because each person was responsible for their own pages, bugs were not always caught or prioritized in a timely manner, and fixing them depended on the availability of whoever originally built that screen. We should have designated a single person to track all UI bugs as they are discovered, maintain a running list, and take ownership of resolving them (regardless of who originally wrote the code). This could have prevented bugs from stalling and ensuring nothing was overlooked.