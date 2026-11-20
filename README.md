🏙️ StayPulse AI — NYC Airbnb Room Type Predictor

A machine learning web application that predicts Airbnb room types (Entire home/apt, Private room, Shared room) in New York City based on listing attributes like spatial coordinates, pricing, minimum nights, and host activity metrics.

🛠️ Project Architecture

airbnb-predictor/
├── server.py           # Flask backend server & model endpoint
├── Model_Pipeline.pkl  # Pre-trained Scikit-Learn pipeline
├── index.html          # Dark glassmorphism frontend HTML
├── styles.css          # Styling & animations
├── app.js              # Interactivity, preset logic & API calls
└── README.md           # Project documentation


🚀 Getting Started

1. Prerequisites

Ensure you have Python 3.8+ installed on your system.

2. Installation

Clone or download the project repository, navigate into the project directory, and install the required dependencies:

pip install flask joblib pandas numpy scikit-learn


Note: If your Model_Pipeline.pkl uses specific model libraries (e.g., xgboost or lightgbm), install them as well:

pip install xgboost lightgbm


🏃 Running the Application

Step 1: Start the Flask Backend Server

Execute the following command in your terminal inside the project directory:

python server.py


Upon startup, Flask will:

Load Model_Pipeline.pkl into memory once.

Serve static assets (index.html, styles.css, app.js).

Listen for incoming HTTP requests on http://127.0.0.1:8000.

Expected terminal output:

 * Serving Flask app 'server'
 * Debug mode: on
 * Running on http://127.0.0.1:8000


Step 2: Open in Browser

Navigate to http://127.0.0.1:8000 in any web browser.

🔌 API Endpoints

GET /

Serves the web dashboard (index.html).

POST /predict

Evaluates listing features through the scikit-learn pipeline and returns class predictions with probability scores.

Request Body (application/json)

{
  "latitude": 40.7549,
  "longitude": -73.9840,
  "price": 230,
  "minimum_nights": 2,
  "number_of_reviews": 68,
  "reviews_per_month": 2.4,
  "calculated_host_listings_count": 1,
  "availability_365": 140,
  "neighbourhood_group": "Manhattan",
  "neighbourhood": "Midtown"
}


Response Body (200 OK)

{
  "Predicted_room_type": "Entire home/apt",
  "Probability": [0.852, 0.128, 0.020]
}


💡 Features

Instant Borough Presets: Quick toggle between Manhattan, Brooklyn, Queens, and Bronx configurations.

Probability Distribution: Visual breakdown of confidence percentages across room type categories.

JSON Payload Inspector: Real-time visibility into sent feature payloads and model responses.

Zero CORS Configuration Needed: Flask serves static files directly alongside the prediction route.
