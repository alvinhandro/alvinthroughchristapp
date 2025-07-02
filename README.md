# alvinthroughchristapp

# Resurrection - A Social Bible App (Cloudflare Edition)

Resurrection is a full-stack web application built with React and the Cloudflare Developer Platform. It allows users to read the Bible, interact with verses, and connect with other users.

This version uses Cloudflare Workers for the backend API and Cloudflare D1 for the database, replacing the original Firebase implementation.

## Features

-   **User Authentication**: Custom JWT-based authentication (sign up, log in, log out).
-   **Bible Reader**: Read the Holy Bible with easy navigation.
-   **Social Interaction**: Like and comment on individual verses.
-   **User Profiles**: View user profiles with bios and follower counts.
-   **Follow System**: Follow and unfollow other users.
-   **Direct Messaging**: Engage in private chats.

## Tech Stack

-   **Frontend**: React
-   **Backend**: Cloudflare Workers
-   **Database**: Cloudflare D1 (SQL)
-   **Hosting**: Cloudflare Pages
-   **Styling**: Tailwind CSS

## Getting Started

Follow these instructions to get the project running locally and deploy it to Cloudflare.

### Prerequisites

-   A [Cloudflare account](https://dash.cloudflare.com/sign-up).
-   [Node.js](https://nodejs.org/) and npm installed.
-   The [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated: `npm install -g wrangler` and `wrangler login`.

### Local Development Setup

1.  **Clone the repository**
    ```sh
    git clone https://www.github.com/alvinthroughchrist/alvinthroughchristapp
    cd resurrection-app-cloudflare
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Create a D1 Database**
    Run the following command to create a new D1 database. Make note of the `database_name` and `database_id` from the output.
    ```sh
    wrangler d1 create resurrection-db
    ```

4.  **Update `wrangler.toml`**
    Open the `wrangler.toml` file and replace the placeholder values with the details from the previous step.

5.  **Create the Database Schema**
    Apply the schema to your newly created database.
    ```sh
    wrangler d1 execute resurrection-db --file=./db/schema.sql
    ```

6.  **Run the app locally**
    Wrangler's CLI can run both the frontend and the backend worker simultaneously.
    ```sh
    wrangler pages dev ./public --d1=resurrection-db
    ```
    Your application will be available at `http://localhost:8788`.

### Deployment

1.  **Create a GitHub repository** and push your code to it.

2.  **Connect your repository to Cloudflare Pages.**
    -   Log in to the Cloudflare dashboard.
    -   Go to `Workers & Pages` > `Create application` > `Pages` > `Connect to Git`.
    -   Select your repository.

3.  **Configure the build settings:**
    -   **Framework preset**: `React`
    -   **Build command**: `npm run build`
    -   **Build output directory**: `build`

4.  **Add D1 Database Binding:**
    -   Go to your new Pages project's settings > `Functions` > `D1 database bindings`.
    -   Click `Add binding`.
    -   **Variable name**: `DB`
    -   **D1 database**: Select the `resurrection-db` you created.

5.  **Save and Deploy.**
    Cloudflare will now build and deploy your application. Any future pushes to your main branch will trigger automatic redeployments.

