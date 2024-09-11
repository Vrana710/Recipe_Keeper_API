import os
import json
from typing import List, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RECIPES_FILE = "data/recipes.json"

# Create the directory and file if they don't exist
def initialize_storage():
    """
    Ensure that the necessary directory and file for storing recipes exist.
    Creates the 'data/' directory and 'recipes.json' file if not present.
    """
    os.makedirs(os.path.dirname(RECIPES_FILE), exist_ok=True)
    if not os.path.exists(RECIPES_FILE):
        with open(RECIPES_FILE, "w") as file:
            json.dump([], file, indent=4)

# Initialize the storage at the start of the application
initialize_storage()

def load_recipes() -> List[Dict]:
    """
    Load recipes from a JSON file into memory.

    If the JSON file does not exist, it initializes an empty list.

    Returns:
        List[Dict]: A list of recipes.
    """
    with open(RECIPES_FILE, "r") as file:
        return json.load(file)

def save_recipes(recipes: List[Dict]):
    """
    Save the current state of recipes to a JSON file.

    Args:
        recipes (List[Dict]): List of recipes to save.
    """
    with open(RECIPES_FILE, "w") as file:
        json.dump(recipes, file, indent=4)


class Comment(BaseModel):
    """
    Comment model for handling comments on recipes.

    Attributes:
        id (Optional[str]): Comment identifier in the format 'CMT<number>'.
        comment (str): Comment text.
        date (Optional[str]): Date of the comment.
    """
    id: Optional[str] = None  # Updated to a string to handle 'CMT' prefix
    comment: str
    date: Optional[str] = None

class Recipe(BaseModel):
    """
    Recipe model for handling recipe data.

    Attributes:
        id (Optional[int]): Recipe identifier.
        name (str): Name of the recipe.
        ingredients (List[str]): List of ingredients for the recipe.
        scheduled_date (Optional[str]): Scheduled date for the recipe.
        comments (List[Comment]): List of comments for the recipe.
    """
    id: Optional[int] = None
    name: str
    ingredients: List[str]
    scheduled_date: Optional[str] = None
    comments: List[Comment] = []

@app.get("/recipes")
def read_recipes(search: Optional[str] = None, sort_by: Optional[str] = None) -> List[Recipe]:
    """
    Retrieve all recipes with optional search and sorting.

    Args:
        search (Optional[str]): Search query for filtering recipes.
        sort_by (Optional[str]): Attribute to sort recipes by.

    Returns:
        List[Recipe]: List of recipes.
    """
    recipes = load_recipes()
    if search:
        recipes = [r for r in recipes if search.lower() in r["name"].lower()]
    if sort_by:
        if sort_by == "name":
            recipes.sort(key=lambda r: r["name"])
        elif sort_by == "date_added":
            recipes.sort(key=lambda r: r["id"])  # Assuming ID is chronological
        elif sort_by == "scheduled_date":
            recipes.sort(key=lambda r: r.get("scheduled_date", ""))
    return [Recipe(**r) for r in recipes]

@app.post("/recipes", response_model=Recipe)
def create_recipe(recipe: Recipe) -> Recipe:
    """
    Create a new recipe.

    Args:
        recipe (Recipe): The recipe details to create.

    Returns:
        Recipe: The created recipe.
    """
    recipes = load_recipes()
    recipe_id = max((r["id"] for r in recipes), default=0) + 1
    recipe.id = recipe_id
    recipes.append(recipe.dict())
    save_recipes(recipes)
    return recipe

@app.get("/recipes/{recipe_id}", response_model=Recipe)
def read_recipe(recipe_id: int) -> Recipe:
    """
    Retrieve a single recipe by its ID.

    Args:
        recipe_id (int): ID of the recipe to retrieve.

    Raises:
        HTTPException: If the recipe with the specified ID is not found.

    Returns:
        Recipe: The requested recipe.
    """
    recipes = load_recipes()
    recipe_dict = next((r for r in recipes if r["id"] == recipe_id), None)
    if recipe_dict is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    return Recipe(**recipe_dict)

@app.put("/recipes/{recipe_id}", response_model=Recipe)
def update_recipe(recipe_id: int, updated_recipe: Recipe) -> Recipe:
    """
    Update a recipe by its ID.

    Args:
        recipe_id (int): ID of the recipe to update.
        updated_recipe (Recipe): New details for the recipe.

    Raises:
        HTTPException: If the recipe with the specified ID is not found.

    Returns:
        Recipe: The updated recipe.
    """
    recipes = load_recipes()
    recipe_index = next((i for i, r in enumerate(recipes) if r["id"] == recipe_id), None)
    if recipe_index is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Preserve the recipe ID
    updated_recipe.id = recipe_id
    recipes[recipe_index] = updated_recipe.dict()
    save_recipes(recipes)
    return updated_recipe

@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int) -> Dict[str, str]:
    """
    Delete a recipe by its ID.

    Args:
        recipe_id (int): ID of the recipe to delete.

    Raises:
        HTTPException: If the recipe with the specified ID is not found.

    Returns:
        Dict[str, str]: A status message indicating successful deletion.
    """
    recipes = load_recipes()
    recipe_index = next((i for i, r in enumerate(recipes) if r["id"] == recipe_id), None)
    if recipe_index is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    del recipes[recipe_index]
    save_recipes(recipes)
    return {"status": "success", "message": "Recipe deleted successfully"}

@app.post("/recipes/{recipe_id}/comments", response_model=Comment)
def add_comment(recipe_id: int, comment: Comment) -> Comment:
    """
    Add a comment to a recipe.

    Args:
        recipe_id (int): ID of the recipe to add a comment to.
        comment (Comment): Comment to add.

    Returns:
        Comment: The added comment.
    """
    recipes = load_recipes()
    recipe = next((r for r in recipes if r["id"] == recipe_id), None)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    comments = recipe.setdefault("comments", [])

    # Generate new comment ID in the format 'CMT1', 'CMT2', etc.
    if comment.id is None:
        existing_ids = [int(c["id"].replace("CMT", "")) for c in comments if c["id"].startswith("CMT")]
        new_id_number = max(existing_ids, default=0) + 1
        comment.id = f"CMT{new_id_number}"
    else:
        existing_comment = next((c for c in comments if c["id"] == comment.id), None)
        if existing_comment is not None:
            raise HTTPException(status_code=400, detail="Comment with this ID already exists")

    # Add the new comment
    comments.append(comment.dict())
    save_recipes(recipes)
    return comment


@app.get("/recipes/{recipe_id}/comments", response_model=List[Comment])
def get_comments(recipe_id: int) -> List[Comment]:
    """
    Get comments for a recipe.

    Args:
        recipe_id (int): ID of the recipe to get comments for.

    Raises:
        HTTPException: If the recipe with the specified ID is not found.

    Returns:
        List[Comment]: List of comments for the recipe.
    """
    recipes = load_recipes()
    recipe = next((r for r in recipes if r["id"] == recipe_id), None)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return [Comment(**c) for c in recipe.get("comments", [])]

@app.put("/recipes/{recipe_id}/comments/{comment_id}", response_model=Comment)
def update_comment(recipe_id: int, comment_id: str, updated_comment: Comment) -> Comment:
    """
    Update a comment for a recipe.

    Args:
        recipe_id (int): ID of the recipe to update the comment in.
        comment_id (str): ID of the comment to update.
        updated_comment (Comment): New details for the comment.

    Raises:
        HTTPException: If the recipe or comment with the specified ID is not found.

    Returns:
        Comment: The updated comment.
    """
    recipes = load_recipes()
    recipe = next((r for r in recipes if r["id"] == recipe_id), None)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    comments = recipe.get("comments", [])
    comment_index = next((i for i, c in enumerate(comments) if c["id"] == comment_id), None)
    if comment_index is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Preserve the comment ID
    updated_comment.id = comment_id
    comments[comment_index] = updated_comment.dict()
    recipe["comments"] = comments
    save_recipes(recipes)
    return updated_comment


@app.delete("/recipes/{recipe_id}/comments/{comment_id}")
def delete_comment(recipe_id: int, comment_id: str) -> Dict[str, str]:
    """
    Delete a comment from a recipe.

    Args:
        recipe_id (int): ID of the recipe to delete the comment from.
        comment_id (str): ID of the comment to delete.

    Raises:
        HTTPException: If the recipe or comment with the specified ID is not found.

    Returns:
        Dict[str, str]: A status message indicating successful deletion.
    """
    recipes = load_recipes()
    recipe = next((r for r in recipes if r["id"] == recipe_id), None)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    comments = recipe.get("comments", [])
    comments = [c for c in comments if c["id"] != comment_id]
    recipe["comments"] = comments
    save_recipes(recipes)
    return {"status": "success", "message": "Comment deleted successfully"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
