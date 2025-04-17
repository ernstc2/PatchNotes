function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("userLogin").value;
    const password = document.getElementById("passLogin").value;
    const options = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({email: username, password: password})
    };

    fetch("/user/login", options)
        .then(response => {
            if (!response.ok) throw new Error("Login failed");
            return response.json();
        })
        .then(data => {
            console.log("Login success:", data);
            window.location.href = 'index.html'; // Only redirect on success
        })
        .catch(error => {
            console.error("Login error:", error);
            alert("Login failed. Please try again.");
        });
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("userRegister").value;
    const password = document.getElementById("passRegister").value;
    const options = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({email: username, password: password})
    };

    fetch("/user/register", options).then(response => response.json()).then(data => {
        console.log(data);
    });

    console.log(username);
    console.log(password);

}

//Check whether to render articles or profile view
let currentView = 'articles'; // 'articles' or 'profile'

//Check if we should display Login or Profile
document.addEventListener("DOMContentLoaded", async function() {
    try {
        const response = await fetch(`${window.base}/user/authenticated`, {
            credentials: 'include'  
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
      
        if (data.authenticated) {
            document.getElementById("login-btn").style.display = "none";
            document.getElementById("profile-btn").style.display = "block";
            document.getElementById("logout-btn").style.display = "block";
            
            //display all articles when clicking on logo (it is like clicking "home")
            document.getElementById("home").addEventListener("click", () => {
                toggleView('articles');
            });

            // Add click handler ONLY when profile button is visible
            document.getElementById("profile-btn").addEventListener("click", () => {
                toggleView('profile');
            });
        } else {
            document.getElementById("login-btn").style.display = "block";
            document.getElementById("profile-btn").style.display = "none";
            document.getElementById("logout-btn").style.display = "none";
        }
        
        // Initial render
        renderContent();
    } catch (error) {
        console.error("Authentication check failed:", error);
        document.getElementById("login-btn").style.display = "block";
        document.getElementById("profile-btn").style.display = "none";
    }
});

// Add these new functions
function toggleView(view) {
    console.log(view);
    currentView = view;
    renderContent();
}

function filterCheckboxes() {
    const checkedValues = Array.from(document.querySelectorAll('.filter-container input:checked'))
                         .map(cb => cb.value);
    
    const filtered = window.allArticles.filter(article => 
        checkedValues.includes(article.type)
    );
    
    // Get the current root
    const container = document.getElementById('article-container');
    const root = ReactDOM.createRoot(container);
    
    // Render the filtered articles
    displayArticles(root, filtered);
} 

async function renderContent() {
    const container = document.getElementById('article-container');
    const root = ReactDOM.createRoot(container);
    
    if (currentView === 'profile') {
        root.render(React.createElement(Profile));
    } else {
        // Only fetch new data if we don't already have it
        if (!window.allArticles || window.allArticles.length === 0) {
            const response = await fetch(`${window.base}/data/latest/14`);
            const data = await response.json();
            
            const normalizedExecOrders = data.execOrders.map(normalizeExecutiveOrder);
            const normalizedRegulations = data.regulations.map(normalizeRegulation);
            const normalizedBills = data.bills.map(normalizeBill);  

            window.allArticles = [
                ...normalizedBills,
                ...normalizedExecOrders,
                ...normalizedRegulations
            ].sort((a, b) => new Date(b.latestAction.actionDate) - new Date(a.latestAction.actionDate));
        }
        
        // Apply current checkbox filters
        const checkedValues = Array.from(document.querySelectorAll('.filter-container input:checked'))
                               .map(cb => cb.value);
        const filtered = window.allArticles.filter(article => 
            checkedValues.includes(article.type)
        );
        
        displayArticles(root, filtered);
    }
}
