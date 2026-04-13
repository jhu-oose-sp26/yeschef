<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a name="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">YesChef</h3>

  <p align="center">
    A social recipe app for rating, sharing, and discovering recipes with friends.
    <br />
    <a href="./doc/srs/srs_it4.md"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/jhu-oose-sp26/yeschef/issues">Report Bug</a>
    ·
    <a href="https://github.com/jhu-oose-sp26/yeschef/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

YesChef is a social recipe app that helps home cooks evaluate, organize, and share recipes. Users can rate recipes they've tried on two key dimensions — **taste/outcome quality** and **ease of execution** — so they and their friends can quickly identify recipes that are both delicious and realistically achievable. The app supports importing recipes from external sources like NYT Cooking as well as uploading personal recipes to share within your social network.

**Why YesChef?**
* Existing platforms don't provide structured feedback on whether a recipe actually delivers good results for an average home cook.
* There's no great centralized place to organize recipes you've tried, saved, or want to make.
* Friends' recommendations are more trusted than anonymous reviews — YesChef builds a social feedback loop around cooking.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![React Native][ReactNative-badge]][ReactNative-url]
* [![Expo][Expo-badge]][Expo-url]
* [![TypeScript][TypeScript-badge]][TypeScript-url]
* [![Spring Boot][SpringBoot-badge]][SpringBoot-url]
* [![Java][Java-badge]][Java-url]
* [![PostgreSQL][PostgreSQL-badge]][PostgreSQL-url]
* [![Supabase][Supabase-badge]][Supabase-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

The project is split into two parts: a **frontend** (React Native / Expo) and a **backend** (Spring Boot REST API). Follow the steps below to get both running locally.

### Prerequisites

* **Node.js** (v18+) and npm
  ```sh
  npm install npm@latest -g
  ```
* **Java 17**
* **Maven** (or use the included `mvnw` wrapper)
* **Expo CLI**
  ```sh
  npm install -g expo-cli
  ```
* A **Supabase** project with a PostgreSQL database (connection string required)

### Installation

#### Backend

1. Clone the repository
   ```sh
   git clone https://github.com/jhu-oose-sp26/yeschef.git
   cd yeschef/backend
   ```
2. Configure your database connection in `src/main/resources/application.properties`
   ```properties
   spring.datasource.url=jdbc:postgresql://<your-supabase-host>:5432/postgres?sslmode=require
   spring.datasource.username=<your-username>
   spring.datasource.password=<your-password>
   ```
3. Build and run the Spring Boot server
   ```sh
   ./mvnw spring-boot:run
   ```
   The API will start on `http://localhost:8080`.

#### Frontend

1. Navigate to the frontend directory
   ```sh
   cd ../frontend
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Start the Expo dev server
   ```sh
   npm start
   ```
   Scan the QR code with the **Expo Go** app on your device, or press `i` for iOS simulator / `a` for Android emulator.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

Once both servers are running:

- Open the app on your device or simulator via Expo Go.
- Browse and search recipes from external sources or uploaded by users.
- Rate any recipe on **taste quality** and **ease of execution**.
- Save recipes to your personal collection.
- Like and view recipes shared by friends.

_For API endpoint details, see the controller source at [`backend/src/main/java/com/yeschef/api/controller/`](backend/src/main/java/com/yeschef/api/controller/)._

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

### Must Have
- [x] Rate recipes on taste quality and ease of execution
- [x] Upload personal recipes
- [x] Discover recipes from external sources (e.g. NYT Cooking)
- [x] View friends' recipes and social feed
- [x] User profile with stats and personal cookbook
- [x] Search and filter ingredients, recipe time, and difficulty
- [x] Save recipes to a personal collection
- [x] Cross-device authentication

### Nice to Have
- [ ] Recipe recommendations based on activity
- [ ] Ingredient-based recipe suggestions to reduce food waste
- [ ] Upload recipes by photographing handwritten notes
- [ ] Short-form cooking videos
- [ ] Year-in-review "Wrapped" summary
- [ ] Comment on recipes
- [ ] Notifications for friend requests and recipe likes
- [ ] One-line recipe summaries
- [ ] Filter recipes by cuisine type and allergens

See the [open issues](https://github.com/jhu-oose-sp26/yeschef/issues) for a full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- DEPLOYMENT -->
* **Web Application (CLICK HERE):** https://yeschef-sigma.vercel.app
* **Backend:** https://yeschef-7zi4.onrender.com

<!-- CONTRIBUTING -->
## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Team JJARC — [https://github.com/jhu-oose-sp26/yeschef](https://github.com/jhu-oose-sp26/yeschef)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/jhu-oose-sp26/yeschef.svg?style=for-the-badge
[contributors-url]: https://github.com/jhu-oose-sp26/yeschef/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/jhu-oose-sp26/yeschef.svg?style=for-the-badge
[forks-url]: https://github.com/jhu-oose-sp26/yeschef/network/members
[stars-shield]: https://img.shields.io/github/stars/jhu-oose-sp26/yeschef.svg?style=for-the-badge
[stars-url]: https://github.com/jhu-oose-sp26/yeschef/stargazers
[issues-shield]: https://img.shields.io/github/issues/jhu-oose-sp26/yeschef.svg?style=for-the-badge
[issues-url]: https://github.com/jhu-oose-sp26/yeschef/issues

[ReactNative-badge]: https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[ReactNative-url]: https://reactnative.dev/
[Expo-badge]: https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white
[Expo-url]: https://expo.dev/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[SpringBoot-badge]: https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white
[SpringBoot-url]: https://spring.io/projects/spring-boot
[Java-badge]: https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white
[Java-url]: https://openjdk.org/
[PostgreSQL-badge]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Supabase-badge]: https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com/
