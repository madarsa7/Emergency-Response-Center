const API_URL = 'http://localhost:5000/api';

// State Management
let emergencies = [];
let currentFilter = 'all';

// DOM Elements
const form = document.getElementById('emergencyForm');
const emergenciesDiv = document.getElementById('emergencies');
const themeToggle = document.getElementById('themeToggle');
const clockDiv = document.getElementById('clock');
const activeCountEl = document.getElementById('activeCount');
const resolvedCountEl = document.getElementById('resolvedCount');
const pendingCountEl = document.getElementById('pendingCount');

// Statistics
let stats = {
    resolved: 0,
    pending: 0
};

// Update Clock
function updateClock() {
    const now = new Date();
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    clockDiv.textContent = now.toLocaleTimeString(undefined, options);
}
setInterval(updateClock, 1000);
updateClock();

// Get Emergency Icon
function getEmergencyIcon(type) {
    const icons = {
        'Medical': '🚑',
        'Fire': '🔥',
        'Crime': '👮',
        'Natural Disaster': '🌪️',
        'Other': '⚠️'
    };
    return icons[type] || '⚠️';
}

// Get Priority Badge
function getPriorityBadge(priority) {
    const badges = {
        'High': 'bg-danger',
        'Medium': 'bg-warning text-dark',
        'Low': 'bg-info'
    };
    return badges[priority] || 'bg-secondary';
}

// Render Active Emergencies by Priority
// Render Active Emergencies by Priority, excluding resolved emergencies
// Render Active Emergencies by Priority (Pending Only)
function renderActiveEmergencies() {
    const priorityLevels = ['High', 'Medium', 'Low'];
    
    // Filter only active (pending) emergencies
    const activeEmergencies = emergencies.filter(e => e.status === 'pending');
    
    emergenciesDiv.innerHTML = priorityLevels.map(level => {
        const levelEmergencies = activeEmergencies.filter(e => e.priority === level);
        return `
            <div class="priority-section">
                <h3>${level} Priority</h3>
                ${levelEmergencies.map(emergency => `
                    <div class="list-group-item emergency-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="ms-2 me-auto">
                                <div class="d-flex align-items-center mb-2">
                                    <h5 class="mb-0">${getEmergencyIcon(emergency.type)} ${emergency.type}</h5>
                                    <span class="badge ${getPriorityBadge(emergency.priority)} ms-2">${emergency.priority}</span>
                                </div>
                                <p class="mb-1"><strong>Reported by:</strong> ${emergency.reporter}</p>
                                <p class="mb-1">${emergency.description}</p>
                                <p class="mb-1"><strong>Location:</strong> ${emergency.location}</p>
                                <small class="text-muted">Reported at: ${emergency.timestamp}</small>
                            </div>
                            <div class="d-flex flex-column">
                                <button class="btn btn-success btn-sm mb-2" onclick="resolveEmergency('${emergency._id}')">
                                    ✅ Resolve
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

// Render Resolved Emergencies
function renderResolvedEmergencies() {
    const resolvedEmergencies = emergencies.filter(e => e.status === 'resolved');
    
    const resolvedEmergenciesDiv = document.getElementById('resolvedEmergencies');
    resolvedEmergenciesDiv.innerHTML = resolvedEmergencies.map(emergency => `
        <div class="list-group-item emergency-item">
            <div class="d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                    <div class="d-flex align-items-center mb-2">
                        <h5 class="mb-0">${getEmergencyIcon(emergency.type)} ${emergency.type}</h5>
                        <span class="badge ${getPriorityBadge(emergency.priority)} ms-2">${emergency.priority}</span>
                    </div>
                    <p class="mb-1"><strong>Reported by:</strong> ${emergency.reporter}</p>
                    <p class="mb-1">${emergency.description}</p>
                    <p class="mb-1"><strong>Location:</strong> ${emergency.location}</p>
                    <small class="text-muted">Resolved at: ${emergency.timestamp}</small>
                </div>
            </div>
        </div>
    `).join('');
}

// Render both Active and Resolved Emergencies
function renderEmergencies() {
    renderActiveEmergencies();
    renderResolvedEmergencies();
}

// Modify the resolve function to refresh the display
async function resolveEmergency(id) {
    if (confirm('Are you sure you want to mark this emergency as resolved?')) {
        try {
            const response = await fetch(`${API_URL}/emergencies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'resolved' })
            });

            if (!response.ok) throw new Error('Failed to resolve emergency');

            showNotification('Emergency marked as resolved!', 'success');
            fetchEmergencies(); // Refresh list to reflect resolved items
        } catch (error) {
            showNotification('Failed to resolve emergency', 'danger');
        }
    }
}

// Fetch and Update Emergencies and Stats
async function fetchEmergencies() {
    try {
        const response = await fetch(`${API_URL}/emergencies`);
        emergencies = await response.json();
        renderEmergencies();
    } catch (error) {
        showNotification('Failed to fetch emergencies', 'danger');
    }
}



// Form Submission with Validation
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emergency = {
        reporter: document.getElementById('reporterName').value,
        type: document.getElementById('emergencyType').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value,
        location: document.getElementById('location').value
    };

    if (!emergency.reporter || !emergency.type || !emergency.priority) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/emergencies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emergency)
        });

        if (!response.ok) throw new Error('Failed to create emergency');

        form.reset();
        showNotification('Emergency reported successfully!', 'success');
        fetchEmergencies();
        fetchStats();
    } catch (error) {
        showNotification('Failed to report emergency', 'danger');
    }
});

// Resolve Emergency
async function resolveEmergency(id) {
    if (confirm('Are you sure you want to mark this emergency as resolved?')) {
        try {
            const response = await fetch(`${API_URL}/emergencies/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'resolved' })
            });

            if (!response.ok) throw new Error('Failed to resolve emergency');

            showNotification('Emergency marked as resolved!', 'success');
            fetchEmergencies();
            fetchStats();
        } catch (error) {
            showNotification('Failed to resolve emergency', 'danger');
        }
    }
}

// Filter Emergencies
async function filterEmergencies(priority) {
    currentFilter = priority;  // Update the current filter for UI purposes
    try {
        // Add priority as a query parameter if it's specified
        const queryParams = priority === 'all' ? '' : `?priority=${priority}`;
        const response = await fetch(`${API_URL}/emergencies${queryParams}`);
        emergencies = await response.json();
        renderEmergencies(); // Refresh the display based on filtered data
    } catch (error) {
        showNotification('Failed to filter emergencies', 'danger');
    }
}


// Fetch and Update Emergencies and Stats
async function fetchEmergencies() {
    try {
        const response = await fetch(`${API_URL}/emergencies`);
        emergencies = await response.json();
        renderEmergencies();
    } catch (error) {
        showNotification('Failed to fetch emergencies', 'danger');
    }
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        activeCountEl.textContent = stats.active;
        resolvedCountEl.textContent = stats.resolved;
        pendingCountEl.textContent = stats.pending;
    } catch (error) {
        showNotification('Failed to fetch statistics', 'danger');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    fetchEmergencies();
    fetchStats();
});
setInterval(() => {
    fetchEmergencies();
    fetchStats();
}, 30000);
