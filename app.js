// State variables
let todos = [];
let soundEnabled = true;

// Web Audio API Synth Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!soundEnabled) return;
    
    // Resume context if suspended (browser security autoplays)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'add') {
        // Soft rising chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'check') {
        // Pleasant double chime for completion
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.setValueAtTime(0.12, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'uncheck') {
        // Soft click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, now); // G4
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'delete') {
        // Soft descending slide
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(349.23, now); // F4
        osc.frequency.exponentialRampToValueAtTime(196.00, now + 0.25); // G3
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'click') {
        // Very subtle UI click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    }
}

// DOM Elements Caching
const todoForm = document.getElementById('todoForm');
const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const taskCategory = document.getElementById('taskCategory');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const dateDisplay = document.getElementById('dateDisplay');
const soundToggle = document.getElementById('soundToggle');

// Stats Counters
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statCompleted = document.getElementById('statCompleted');
const progressRing = document.getElementById('progressRing');
const progressText = document.getElementById('progressText');
const hudProgressDetails = document.getElementById('hudProgressDetails');

// Search & Filters
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const filterCategory = document.getElementById('filterCategory');
const sortBy = document.getElementById('sortBy');

// Edit Modal
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskTitle = document.getElementById('editTaskTitle');
const editTaskDesc = document.getElementById('editTaskDesc');
const editTaskCategory = document.getElementById('editTaskCategory');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// SVG Progress Ring calculations
const strokeRadius = 34;
const strokeCircumference = 2 * Math.PI * strokeRadius;

// Set up circular progress stroke dash settings
progressRing.style.strokeDasharray = `${strokeCircumference} ${strokeCircumference}`;
progressRing.style.strokeDashoffset = strokeCircumference;

// Set dynamic date in header
function updateHeaderDate() {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date();
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);
}

// Load settings and tasks from LocalStorage
function initApp() {
    updateHeaderDate();
    
    // Load sound state
    const savedSound = localStorage.getItem('aero_sound');
    if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        updateSoundToggleUI();
    }
    
    // Load todos
    const savedTodos = localStorage.getItem('aero_todos');
    if (savedTodos) {
        try {
            todos = JSON.parse(savedTodos);
        } catch (e) {
            console.error('Error parsing localStorage todos', e);
            todos = [];
        }
    } else {
        // Pre-populate with beautiful sample todos for an exceptional first impression
        todos = [
            {
                id: 'sample-1',
                title: 'Design high-fidelity dashboard layouts',
                desc: 'Add glassmorphism filters, glowing text styles, and harmonic gradients to the Figma file.',
                category: 'Work',
                priority: 'High',
                completed: false,
                createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
                id: 'sample-2',
                title: 'Go for a morning cardio session',
                desc: 'Run 5km in the park. Aim for a pace below 5:30 min/km.',
                category: 'Health',
                priority: 'Medium',
                completed: true,
                createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
            },
            {
                id: 'sample-3',
                title: 'Pick up weekly fresh groceries',
                desc: 'Avocados, organic spinach, berries, almond milk, and salmon.',
                category: 'Shopping',
                priority: 'Low',
                completed: false,
                createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
            }
        ];
        saveTodosToStorage();
    }
    
    renderTodos();
}

// Persistence Utility
function saveTodosToStorage() {
    localStorage.setItem('aero_todos', JSON.stringify(todos));
}

// UI State Sound Icon Updates
function updateSoundToggleUI() {
    const icon = soundToggle.querySelector('i');
    if (soundEnabled) {
        soundToggle.classList.remove('muted');
        icon.className = 'fa-solid fa-volume-high';
    } else {
        soundToggle.classList.add('muted');
        icon.className = 'fa-solid fa-volume-xmark';
    }
}

// Calculate and animate stats HUD
function updateStatsDashboard() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    
    // Text counters
    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
    
    // Progress calculation
    let percentage = 0;
    if (total > 0) {
        percentage = Math.round((completed / total) * 100);
    }
    
    // Animate progress text
    progressText.textContent = `${percentage}%`;
    
    // Animate SVG circle
    const offset = strokeCircumference - (percentage / 100) * strokeCircumference;
    progressRing.style.strokeDashoffset = offset;
    
    // Details summary
    if (total === 0) {
        hudProgressDetails.textContent = 'No tasks created yet';
    } else if (percentage === 100) {
        hudProgressDetails.textContent = 'All tasks completed! Great job! 🎉';
    } else {
        hudProgressDetails.textContent = `${completed} of ${total} tasks completed today`;
    }
}

// Generate & Render Todo Cards
function renderTodos() {
    // Get filter states
    const query = searchInput.value.toLowerCase().trim();
    const statusVal = filterStatus.value;
    const categoryVal = filterCategory.value;
    const sortVal = sortBy.value;
    
    // Apply filters
    let filtered = todos.filter(todo => {
        const matchesSearch = todo.title.toLowerCase().includes(query) || 
                              todo.desc.toLowerCase().includes(query);
        
        const matchesStatus = statusVal === 'all' || 
                             (statusVal === 'completed' && todo.completed) ||
                             (statusVal === 'active' && !todo.completed);
                             
        const matchesCategory = categoryVal === 'all' || todo.category === categoryVal;
        
        return matchesSearch && matchesStatus && matchesCategory;
    });
    
    // Sort items
    filtered.sort((a, b) => {
        if (sortVal === 'dateDesc') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortVal === 'dateAsc') {
            return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortVal === 'alphabetical') {
            return a.title.localeCompare(b.title);
        } else if (sortVal === 'priorityDesc') {
            const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return 0;
    });
    
    // Update stats HUD
    updateStatsDashboard();
    
    // Show/Hide Empty State
    if (filtered.length === 0) {
        todoList.style.display = 'none';
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        todoList.style.display = 'flex';
        
        // Re-generate list items
        todoList.innerHTML = '';
        filtered.forEach(todo => {
            const card = document.createElement('div');
            card.className = `todo-item p-${todo.priority.toLowerCase()} ${todo.completed ? 'completed' : ''}`;
            card.dataset.id = todo.id;
            
            // Map category icon
            let catIcon = 'fa-tag';
            if (todo.category === 'Work') catIcon = 'fa-briefcase';
            else if (todo.category === 'Personal') catIcon = 'fa-house';
            else if (todo.category === 'Shopping') catIcon = 'fa-cart-shopping';
            else if (todo.category === 'Health') catIcon = 'fa-heart-pulse';
            else if (todo.category === 'Finance') catIcon = 'fa-credit-card';
            else if (todo.category === 'Other') catIcon = 'fa-sparkles';
            
            card.innerHTML = `
                <label class="todo-checkbox-wrapper">
                    <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                    <div class="checkbox-custom">
                        <i class="fa-solid fa-check"></i>
                    </div>
                </label>
                <div class="todo-content">
                    <h3 class="todo-title">${escapeHTML(todo.title)}</h3>
                    ${todo.desc ? `<p class="todo-desc">${escapeHTML(todo.desc)}</p>` : ''}
                    <div class="todo-meta">
                        <span class="badge badge-cat-${todo.category.toLowerCase()}">
                            <i class="fa-solid ${catIcon}"></i> ${todo.category}
                        </span>
                        <span class="badge badge-priority p-${todo.priority.toLowerCase()}">
                            ${todo.priority} Priority
                        </span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit-btn" title="Edit Task">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete Task">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
            
            // Add click events to buttons & elements inside the card
            const checkbox = card.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => toggleTodoStatus(todo.id, checkbox.checked));
            
            const editBtn = card.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(todo);
            });
            
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeTodo(todo.id, card);
            });
            
            todoList.appendChild(card);
        });
    }
}

// Prevent HTML injection attacks
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Action: Create Todo
function addTodo(title, desc, category, priority) {
    const newTodo = {
        id: 'todo-' + Date.now(),
        title,
        desc,
        category,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    saveTodosToStorage();
    playSound('add');
    renderTodos();
}

// Action: Toggle Completed Status
function toggleTodoStatus(id, isCompleted) {
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex > -1) {
        todos[todoIndex].completed = isCompleted;
        saveTodosToStorage();
        playSound(isCompleted ? 'check' : 'uncheck');
        renderTodos();
    }
}

// Action: Remove Todo with card slide-out animation
function removeTodo(id, cardElement) {
    playSound('delete');
    
    // Add deletion animation class
    cardElement.classList.add('removing');
    
    // Wait for the slideOut CSS animation to complete (300ms)
    cardElement.addEventListener('animationend', () => {
        todos = todos.filter(t => t.id !== id);
        saveTodosToStorage();
        renderTodos();
    });
}

// Action: Edit Modal Open
function openEditModal(todo) {
    playSound('click');
    editTaskId.value = todo.id;
    editTaskTitle.value = todo.title;
    editTaskDesc.value = todo.desc || '';
    editTaskCategory.value = todo.category;
    
    // Set priority radio buttons
    const radios = document.getElementsByName('editPriority');
    radios.forEach(radio => {
        if (radio.value === todo.priority) {
            radio.checked = true;
        }
    });
    
    editModal.classList.add('open');
}

// Action: Close Edit Modal
function closeEditModal() {
    playSound('click');
    editModal.classList.remove('open');
}

// Action: Save Edit Changes
function saveEditTask(e) {
    e.preventDefault();
    const id = editTaskId.value;
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex > -1) {
        const title = editTaskTitle.value.trim();
        const desc = editTaskDesc.value.trim();
        const category = editTaskCategory.value;
        
        let priority = 'Medium';
        const radios = document.getElementsByName('editPriority');
        radios.forEach(radio => {
            if (radio.checked) priority = radio.value;
        });
        
        todos[todoIndex].title = title;
        todos[todoIndex].desc = desc;
        todos[todoIndex].category = category;
        todos[todoIndex].priority = priority;
        
        saveTodosToStorage();
        playSound('add');
        editModal.classList.remove('open');
        renderTodos();
    }
}

// Event Listeners
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitle.value.trim();
    const desc = taskDesc.value.trim();
    const category = taskCategory.value;
    
    let priority = 'Medium';
    const radios = document.getElementsByName('priority');
    radios.forEach(radio => {
        if (radio.checked) priority = radio.value;
    });
    
    addTodo(title, desc, category, priority);
    
    // Reset inputs
    taskTitle.value = '';
    taskDesc.value = '';
    taskCategory.selectedIndex = 0;
    
    // Focus title again
    taskTitle.focus();
});

// Search and Filter updates
searchInput.addEventListener('input', () => {
    // Render on search input (debounce is not strictly necessary for client-side local lists)
    renderTodos();
});

filterStatus.addEventListener('change', () => {
    playSound('click');
    renderTodos();
});

filterCategory.addEventListener('change', () => {
    playSound('click');
    renderTodos();
});

sortBy.addEventListener('change', () => {
    playSound('click');
    renderTodos();
});

// Sound Toggle
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('aero_sound', soundEnabled);
    updateSoundToggleUI();
    playSound('click');
});

// Modal Actions
closeModalBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);
editForm.addEventListener('submit', saveEditTask);

// Close modal if clicking outside content
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initApp);
