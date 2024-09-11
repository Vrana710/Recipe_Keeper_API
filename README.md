# Recipe Keeper

Recipe Keeper is a web application designed for managing recipes. Users can add, view, edit, and delete recipes through a clean and interactive interface. The backend is built with FastAPI, and the frontend is implemented using HTML, CSS, and JavaScript.

## Table of Contents

- [Introduction](#introduction)
- [Technologies](#technologies)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Bonus Features](#bonus-features)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Introduction

The Recipe Keeper application allows users to manage their recipes effectively. The main features include:

- **Add** new recipes
- **View** a list of all recipes
- **Edit** existing recipes
- **Delete** recipes
- **Search** and **Sort** recipes
- **Calendar View** for scheduled recipes
- **Comment System** for recipe interactions

The backend is powered by FastAPI, providing a robust API for handling recipes. The frontend is built with HTML, CSS, and JavaScript, allowing users to interact with the API and manage recipes easily.

## Technologies

- **Backend:** FastAPI
- **Frontend:** HTML, CSS, JavaScript
- **Server:** Uvicorn (ASGI server)
- **Libraries:** Bootstrap, FullCalendar, Font Awesome

## Setup and Installation

### Backend Setup

1. **Install Dependencies:**

   Make sure you have Python installed. Then, install the required Python packages using pip:

   ```bash
   pip install fastapi uvicorn
   ```

2. **Create Backend Files:**

   Save the provided FastAPI code into a file named `main.py`.

3. **Run the Backend Server:**

   Start the FastAPI server with the following command:

   ```bash
   uvicorn main:app --reload
   ```
4. **Clone the repository:**

   ```bash
   git clone https://github.com/Vrana710/Recipe_Keeper_API.git

   cd Recipe_Keeper_API
   ```

### Frontend Setup

1. **Create Frontend Files:**

   Save the provided HTML, CSS, and JavaScript code into `index.html`, `styles.css`, `calendar-styles.css` and `scripts.js` respectively.

2. **Open `index.html` in Your Web Browser:**

   Ensure the FastAPI server is running at `http://127.0.0.1:8000` and open `index.html` to interact with the Recipe Keeper application.

## Usage

1. **Start the Backend Server:**

   Ensure the FastAPI server is running with the command provided above.

2. **Interact with the Application:**

   - Use the form to add new recipes.
   - View, edit, and delete recipes from the list.
   - Use the search bar to filter recipes by name.
   - Sort recipes using the provided sort options.
   - View and manage scheduled recipes on the calendar.
   - Add, edit, and delete comments for each recipe.

## API Documentation

### **GET /recipes**

Retrieve the list of all recipes.

### **POST /recipes**

Create a new recipe. Requires a JSON body with `name` and `ingredients`.

### **GET /recipes/{recipe_id}**

Retrieve a specific recipe by its ID.

### **PUT /recipes/{recipe_id}**

Update a specific recipe by its ID. Requires a JSON body with `name` and `ingredients`.

### **DELETE /recipes/{recipe_id}**

Delete a specific recipe by its ID.

## Bonus Features

- **Recipe Search:** Implement a search bar to filter recipes by name.

## Contributing

Contributions are welcome! If you would like to contribute, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any questions, please reach out to [ranavarsha710@gmail.com](mailto:ranavarsha710@gmail.com).
