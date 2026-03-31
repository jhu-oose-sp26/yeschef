For iteration 3, we planned to complete the following objectives:
- extended the relational database to support social connections - specifically, implemented the Friendships class
- added ratings functionality (core must have). This included
    - API routes
    - logic connecting users to ratings and included logic to validate such connections
- added social functionality (core must have). This included
    - API routes
    - routes to get recipes from a user's friends
    - logic to handle friend connections
- built out the user profile (core must have). This included 
    - linking uploaded recipes to the appropriate user
    - logic to fetch user information to display on profile
- implemented save/unsave recipe functionality (core must have)
- extended and fixed backend tests (solving the errors we had from iteration 2)
- extended frontend to include new features:
    - main feed
    - friends feed
    - rating summary
    - built out rating functionality for each recipe

What we did well for iteration 3:
- While iteration 3 had more work than the previous two iterations, we completed all objectives and were able to smoothly collaborate both in person and remotely to ensure that all of our dependent assignments were completed in a timely manner.
- We are able to view our frontend and test the backend functionality on a browser and using an emulator that simulates an iPhone. 

Challenges from Iteration 3 and how we will improve:
- Our group divided responsibilities across database, frontend, API implementation, and API testing. While this structure kept work organized, we identified two areas where our delegation approach fell short.
    - First, we should integrate testing with development. Having a dedicated person write API tests was not optimal since the person who implemented the routes is the one who is most familiar with the code's behavior and who would benefit the most from writing edge case tests to test their code. Going forward, whoever writes a route will also be responsible for writing its tests.
    - Second, we lacked a clear method for documenting which layer of the code owned which responsibilities. For example, when the database developer decided to delegate friend-request validation to the API layer, we relied on verbal communication. This system was prone to error and miscommunication. In the next iteration, we will maintain explicit written documentation of these cross-layer responsibilities to keep the team aligned and reduce mistakes.