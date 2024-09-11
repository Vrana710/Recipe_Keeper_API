const apiUrl = 'http://127.0.0.1:8000/recipes';

document.addEventListener('DOMContentLoaded', () => {
    fetchRecipes();
    initializeCalendar();

    document.getElementById('recipe-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const id = document.getElementById('recipe-id') ? document.getElementById('recipe-id').value : '';
        const name = document.getElementById('recipe-name').value;
        const ingredients = document.getElementById('ingredients').value.split(',').map(ingredient => ingredient.trim());
        const date = document.getElementById('recipe-date').value;

        const recipe = { name, ingredients, scheduled_date: date };

        if (id) {
            updateRecipe(id, recipe);
        } else {
            addRecipe(recipe);
        }
    });

    document.getElementById('search-bar').addEventListener('input', function() {
        const query = this.value;
        fetchRecipes(query);
    });

    document.getElementById('sort-by').addEventListener('change', function() {
        const sortBy = this.value;
        fetchRecipes('', sortBy);
    });
});

/**
 * Initializes the calendar view.
 */
function initializeCalendar() {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: function(fetchInfo, successCallback, failureCallback) {
            fetchRecipesForCalendar(successCallback, failureCallback);
        }
    });

    calendar.render();
}

/**
 * Fetches recipes for the calendar and passes them to the callback function.
 * @param {function} successCallback - Function to call with the event data.
 * @param {function} failureCallback - Function to call on error.
 */
async function fetchRecipesForCalendar(successCallback, failureCallback) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch recipes.');
        const recipes = await response.json();
        const events = recipes.map(recipe => ({
            title: recipe.name,
            start: recipe.scheduled_date,
            // Optionally add more fields like color or description
        }));
        successCallback(events);
    } catch (error) {
        console.error('Error fetching recipes for calendar:', error);
        failureCallback(error);
    }
}

/**
 * Fetches the list of recipes from the API and renders them.
 * @param {string} query - The search query for filtering recipes.
 * @param {string} sortBy - The attribute to sort recipes by.
 */
async function fetchRecipes(query = '', sortBy = '') {
    try {
        const response = await fetch(`${apiUrl}?search=${encodeURIComponent(query)}&sort_by=${encodeURIComponent(sortBy)}`);
        if (!response.ok) throw new Error('Failed to fetch recipes.');
        const recipes = await response.json();
        renderRecipes(recipes);
    } catch (error) {
        displayMessage('error', 'Error fetching recipes: ' + error.message);
    }
}

/**
 * Renders the list of recipes into the HTML.
 * @param {Array} recipes - The array of recipe objects to render.
 */
function renderRecipes(recipes) {
    const displayArea = document.getElementById('display-area');
    displayArea.innerHTML = '';

    recipes.forEach(recipe => {
        const div = document.createElement('div');
        div.className = 'col-md-4 mb-3';
        div.innerHTML = `
            <div class="recipe-card card p-3">
                <strong>${recipe.name}</strong>
                <p>Ingredients: ${recipe.ingredients.join(', ')}</p>
                <p>Scheduled for: ${new Date(recipe.scheduled_date).toLocaleDateString()}</p>
                <div id="comments-section-${recipe.id}" class="comments-section">
                    <textarea class="form-control" id="comment-text-${recipe.id}" rows="2" placeholder="Add a comment"></textarea>
                    <button class="btn btn-primary mt-2" onclick="addComment(${recipe.id})">Submit Comment</button>
                    <ul id="comments-list-${recipe.id}" class="list-group mt-3"></ul>
                </div>
                <div class="button-group">
                    <button class="btn btn-warning" onclick="editRecipe(${recipe.id})" title="Edit Recipe">Edit</button>
                    <button class="btn btn-danger" onclick="deleteRecipe(${recipe.id})" title="Delete Recipe">Delete</button>
                </div>
            </div>
        `;
        displayArea.appendChild(div);

        // Fetch and render comments for each recipe
        fetchComments(recipe.id);
    });
}


/**
 * Adds a new recipe by sending a POST request to the API.
 * @param {Object} recipe - The recipe object to add.
 */
async function addRecipe(recipe) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipe)
        });
        if (!response.ok) throw new Error('Failed to add recipe.');
        await response.json();
        displayMessage('success', 'Recipe added successfully!');
        fetchRecipes();
    } catch (error) {
        displayMessage('error', 'Error adding recipe: ' + error.message);
    }
}

/**
 * Updates an existing recipe by sending a PUT request to the API.
 * @param {number} id - The ID of the recipe to update.
 * @param {Object} recipe - The updated recipe object.
 */
async function updateRecipe(id, recipe) {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipe)
        });
        if (!response.ok) throw new Error('Failed to update recipe.');
        await response.json();
        displayMessage('success', 'Recipe updated successfully!');
        fetchRecipes();
    } catch (error) {
        displayMessage('error', 'Error updating recipe: ' + error.message);
    }
}

/**
 * Deletes a recipe by sending a DELETE request to the API.
 * @param {number} id - The ID of the recipe to delete.
 */
async function deleteRecipe(id) {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete recipe.');
        await response.json();
        displayMessage('success', 'Recipe deleted successfully!');
        fetchRecipes();
    } catch (error) {
        displayMessage('error', 'Error deleting recipe: ' + error.message);
    }
}

/**
 * Fetches a specific recipe for editing and populates the form.
 * @param {number} id - The ID of the recipe to edit.
 */
function editRecipe(id) {
    fetch(`${apiUrl}/${id}`)
        .then(response => response.json())
        .then(recipe => {
            const idElement = document.getElementById('recipe-id');
            const nameElement = document.getElementById('recipe-name');
            const ingredientsElement = document.getElementById('ingredients');
            const dateElement = document.getElementById('recipe-date');

            if (idElement && nameElement && ingredientsElement && dateElement) {
                idElement.value = recipe.id;
                nameElement.value = recipe.name;
                ingredientsElement.value = recipe.ingredients.join(', ');
                dateElement.value = recipe.scheduled_date || '';
                document.getElementById('comments-section').style.display = 'block';
                fetchComments(id);
            } else {
                console.error('One or more form elements are missing');
            }
        })
        .catch(error => displayMessage('error', 'Error fetching recipe for edit: ' + error.message));
}

/**
 * Displays a message to the user.
 * @param {string} type - The type of message ('success' or 'error').
 * @param {string} message - The message to display.
 */
function displayMessage(type, message) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${type}`;
    messageContainer.textContent = message;
    document.body.insertBefore(messageContainer, document.body.firstChild);
    setTimeout(() => {
        messageContainer.remove();
    }, 3000);
}

/**
 * Adds a comment to the recipe.
 * @param {number} recipeId - The ID of the recipe to add a comment to.
 */
async function addComment(recipeId) {
    const commentText = document.getElementById(`comment-text-${recipeId}`).value;

    try {
        const response = await fetch(`${apiUrl}/${recipeId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: commentText, date: new Date().toISOString().split('T')[0] })
        });
        if (!response.ok) throw new Error('Failed to add comment.');
        await response.json();
        displayMessage('success', 'Comment added successfully!');
        fetchComments(recipeId);
    } catch (error) {
        displayMessage('error', 'Error adding comment: ' + error.message);
    }
}


/**
 * Fetches comments for a specific recipe and renders them.
 * @param {number} recipeId - The ID of the recipe to fetch comments for.
 */
async function fetchComments(recipeId) {
    try {
        const response = await fetch(`${apiUrl}/${recipeId}/comments`);
        if (!response.ok) throw new Error('Failed to fetch comments.');
        const comments = await response.json();
        renderComments(recipeId, comments);
    } catch (error) {
        displayMessage('error', 'Error fetching comments: ' + error.message);
    }
}

/**
 * Renders comments into the HTML with edit and delete options and tooltips.
 * @param {number} recipeId - The ID of the recipe to render comments for.
 * @param {Array} comments - The array of comment objects to render.
 */
function renderComments(recipeId, comments) {
    const commentsList = document.getElementById(`comments-list-${recipeId}`);
    commentsList.innerHTML = '';

    comments.forEach(comment => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            ${comment.comment} (Date: ${new Date(comment.date).toLocaleDateString()})
            <div>
                <button class="btn btn-sm btn-warning" 
                        onclick="showEditCommentForm(${recipeId}, '${comment.id}', '${comment.comment}')"
                        title="Edit Comment">
                    <i class="fas fa-edit"></i> 
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="deleteComment(${recipeId}, '${comment.id}')"
                        title="Delete Comment">
                    <i class="fas fa-trash-alt"></i> 
                </button>
            </div>
        `;
        commentsList.appendChild(li);
    });
}



/**
 * Shows the form for editing a comment.
 * @param {number} recipeId - The ID of the recipe.
 * @param {number} commentId - The ID of the comment to edit.
 * @param {string} currentComment - The current text of the comment.
 */
function showEditCommentForm(recipeId, commentId, currentComment) {
    const commentText = prompt('Edit your comment:', currentComment);
    if (commentText) {
        console.log('before edit comment', recipeId, commentId, commentText)
        editComment(recipeId, commentId, commentText);
        console.log('after edit comment', recipeId, commentId, commentText)
    }
}

/**
 * Edits a comment by sending a PUT request to the API.
 * @param {number} recipeId - The ID of the recipe.
 * @param {string} commentId - The ID of the comment to edit.
 * @param {string} commentText - The new text for the comment.
 */
async function editComment(recipeId, commentId, commentText) {
    const updatedComment = { comment: commentText, date: new Date().toISOString().split('T')[0] };

    try {
        const response = await fetch(`${apiUrl}/${recipeId}/comments/${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedComment)
        });
        if (!response.ok) throw new Error('Failed to update comment.');
        await response.json();
        displayMessage('success', 'Comment updated successfully!');
        fetchComments(recipeId);
    } catch (error) {
        displayMessage('error', 'Error updating comment: ' + error.message);
    }
}


/**
 * Deletes a comment by sending a DELETE request to the API.
 * @param {number} recipeId - The ID of the recipe.
 * @param {number} commentId - The ID of the comment to delete.
 */
async function deleteComment(recipeId, commentId) {
    try {
        const response = await fetch(`${apiUrl}/${recipeId}/comments/${commentId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete comment.');
        await response.json();
        displayMessage('success', 'Comment deleted successfully!');
        fetchComments(recipeId);
    } catch (error) {
        displayMessage('error', 'Error deleting comment: ' + error.message);
    }
}
