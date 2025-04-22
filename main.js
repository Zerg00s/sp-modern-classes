function loadClassesData() {
    return fetch('refined-classes.csv')
        .then(response => response.text())
        .then(data => {
            // Parse CSV data (comma-separated values)
            const rows = data.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
            const header = parseCSVRow(rows[0]);
            
            // Get the indices for each column
            const classIndex = header.findIndex(col => col.trim().toLowerCase() === 'class');
            const categoryIndex = header.findIndex(col => col.trim().toLowerCase() === 'category');
            const notesIndex = header.findIndex(col => col.trim().toLowerCase() === 'notes');
            
            // Parse data rows, skipping header
            return rows.slice(1).map(row => {
                const columns = parseCSVRow(row);
                return {
                    class: columns[classIndex] ? columns[classIndex].trim() : '',
                    category: columns[categoryIndex] ? columns[categoryIndex].trim() : '',
                    notes: columns[notesIndex] ? columns[notesIndex].trim() : ''
                };
            });
        });
}

// Helper function to parse CSV rows correctly (handling quotes, commas in fields, etc.)
function parseCSVRow(row) {
    const result = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(currentValue);
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    // Add the last value
    result.push(currentValue);
    return result;
}

document.addEventListener('DOMContentLoaded', function () {
    // Add CSS for tabs, categories, buttons, and toggle switch
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        /* Row relative positioning for absolute button placement */
        #classes-body tr {
            position: relative;
        }
        
        /* Complete isolation of the copy button from parent styles */
        .copy-btn-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: none !important; /* Let clicks pass through to the content underneath */
            opacity: 1 !important;
            z-index: 1000 !important;
        }
        
        /* Make the button receive clicks */
        .copy-btn {
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: hidden !important;
            z-index: 1001 !important;
            background-color: #4CAF50 !important;
            color: white !important;
            border: none !important;
            padding: 10px 20px !important;
            border-radius: 5px !important;
            font-size: 0.8em !important;
            cursor: pointer !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
        }
        
        /* Show button on hover */
        tr:hover .copy-btn {
            visibility: visible !important;
        }
        
        /* Search and filter container */
        .filter-container {
            margin: 20px auto;
            width: 80%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        #class-search {
            width: 100%;
            max-width: 500px;
            padding: 10px;
            font-size: 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        
        /* Category tabs styling */
        .category-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 0 auto 20px auto;
            justify-content: center;
        }
        
        .category-tab {
            padding: 8px 16px;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 20px;
            cursor: pointer;
            transition: background-color 0.2s, color 0.2s;
        }
        
        .category-tab:hover {
            background-color: #e0e0e0;
        }
        
        .category-tab.active {
            background-color: #0078d4;
            color: white;
            font-weight: bold;
        }
        
        /* Toggle switch for borders */
        .toggle-container {
            display: flex;
            align-items: center;
            margin: 10px 0 20px 0;
        }
        
        .toggle-label {
            margin-right: 10px;
            font-size: 24px;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 24px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
            background-color: #0078d4;
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(48px);
        }
        
        /* Border styles ONLY for span elements when toggled */
        #classes-body.toggled tr > td > span {
            border-style: solid;
        }
    `;
    document.head.appendChild(styleEl);

    loadClassesData().then(classesData => {
        var classesBody = document.getElementById('classes-body');
        
        // Extract unique categories and sort them
        const categories = [...new Set(classesData.map(item => item.category))].filter(Boolean).sort();
        
        // Create toggle for borders
        createBordersToggle();
        
        // Create category tabs
        createCategoryTabs(categories);
        
        // Render all classes initially
        renderClasses(classesData, classesBody);
        
        // Add search input
        createSearchInput(classesData, classesBody);
    }).catch(error => {
        console.error('Error loading classes data:', error);
        // Show a friendly error message in the UI
        const classesBody = document.getElementById('classes-body');
        if (classesBody) {
            const errorRow = document.createElement('tr');
            const errorCell = document.createElement('td');
            errorCell.innerHTML = '<span style="color: red;">Error loading class data. Please check the console for details.</span>';
            errorRow.appendChild(errorCell);
            classesBody.appendChild(errorRow);
        }
    });

    // Event delegation for copy button clicks
    document.getElementById('classes-body').addEventListener('click', function (event) {
        if (event.target && event.target.matches('.copy-btn')) {
            const classToCopy = event.target.getAttribute('data-class');
            navigator.clipboard.writeText(classToCopy).then(() => {
                // Show feedback to the user
                const originalText = event.target.textContent;
                event.target.textContent = '✔️ Copied!';
                event.target.style.backgroundColor = '#34A853';
                setTimeout(() => {
                    event.target.textContent = originalText;
                    event.target.style.backgroundColor = '';
                }, 1500);
            }).catch(err => {
                console.error('Error copying text to clipboard', err);
            });
        }
    });
    
    // Event delegation for mouseenter to trigger animations
    document.getElementById('classes-body').addEventListener('mouseenter', function (event) {
        // Only trigger for span elements that contain class names
        if (event.target && 
            event.target.tagName === 'SPAN' && 
            event.target.hasAttribute('data-original-class')) {
            
            // Get the original class
            const originalClass = event.target.getAttribute('data-original-class');
            if (originalClass) {
                // Remove the class
                event.target.classList.remove(originalClass);
                
                // Force reflow
                void event.target.offsetWidth;
                
                // Add the class back to trigger animation
                event.target.classList.add(originalClass);
            }
        }
    }, true);
});

// Function to create toggle for borders
function createBordersToggle() {
    // Find the filter container
    let filterContainer = document.querySelector('.filter-container');
    if (!filterContainer) {
        // Create filter container if it doesn't exist
        const table = document.querySelector('.classes');
        if (!table || !table.parentNode) return;
        
        filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        table.parentNode.insertBefore(filterContainer, table);
    }
    
    // Create toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'toggle-container';
    
    // Create toggle label
    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'toggle-label';
    toggleLabel.textContent = 'Show borders:';
    toggleContainer.appendChild(toggleLabel);
    
    // Create toggle switch
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'toggle-switch';
    
    // Create toggle input (checkbox)
    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'borders-toggle';
    
    // Create toggle slider
    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'toggle-slider';
    
    // Assemble toggle switch
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(toggleSlider);
    toggleContainer.appendChild(toggleSwitch);
    
    // Add toggle to filter container
    filterContainer.appendChild(toggleContainer);
    
    // Add event listener to toggle
    toggleInput.addEventListener('change', function() {
        const classesBody = document.getElementById('classes-body');
        if (this.checked) {
            classesBody.classList.add('toggled');
        } else {
            classesBody.classList.remove('toggled');
        }
    });
}

// Function to create tabs for categories
function createCategoryTabs(categories) {
    // Find the table to insert before
    const table = document.querySelector('.classes');
    if (!table || !table.parentNode) return;
    
    // Create filter container if it doesn't exist
    let filterContainer = document.querySelector('.filter-container');
    if (!filterContainer) {
        filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        table.parentNode.insertBefore(filterContainer, table);
    }
    
    // Create tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'category-tabs';
    
    // Add "All" tab
    const allTab = document.createElement('div');
    allTab.className = 'category-tab active';
    allTab.textContent = 'All';
    allTab.setAttribute('data-category', '');
    tabsContainer.appendChild(allTab);
    
    // Add tabs for each category
    categories.forEach(category => {
        const tab = document.createElement('div');
        tab.className = 'category-tab';
        tab.textContent = category;
        tab.setAttribute('data-category', category);
        tabsContainer.appendChild(tab);
    });
    
    // Add tabs to filter container
    filterContainer.appendChild(tabsContainer);
    
    // Add event listeners for tabs
    tabsContainer.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('category-tab')) {
            // Get the selected category
            const category = event.target.getAttribute('data-category');
            
            // Update active tab
            document.querySelectorAll('.category-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Apply filtering
            filterByCategory(category);
            
            // Update search to respect category filter
            const searchTerm = document.getElementById('class-search')?.value || '';
            if (searchTerm) {
                filterBySearch(searchTerm, category);
            }
        }
    });
}

// Function to create search input
function createSearchInput(classesData, classesBody) {
    // Find the filter container
    let filterContainer = document.querySelector('.filter-container');
    if (!filterContainer) {
        // Create filter container if it doesn't exist
        const table = document.querySelector('.classes');
        if (!table || !table.parentNode) return;
        
        filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        table.parentNode.insertBefore(filterContainer, table);
    }
    
    // Create search input if it doesn't exist
    if (!document.getElementById('class-search')) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'class-search';
        searchInput.placeholder = 'Search by class name...';
        
        // Insert search at the top of the filter container
        filterContainer.insertBefore(searchInput, filterContainer.firstChild);
        
        // Add event listener for search
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            // Get active category
            const activeTab = document.querySelector('.category-tab.active');
            const activeCategory = activeTab ? activeTab.getAttribute('data-category') : '';
            
            filterBySearch(searchTerm, activeCategory);
        });
    }
}

// Function to filter classes by search term
function filterBySearch(searchTerm, category = '') {
    const rows = document.querySelectorAll('#classes-body tr');
    
    rows.forEach(row => {
        // Skip if already hidden by category filter
        if (category && row.getAttribute('data-category') !== category) {
            return;
        }
        
        const className = row.querySelector('[data-original-class]')?.textContent || '';
        
        // Show if class name matches the search term
        if (className.toLowerCase().includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Function to filter classes by category
function filterByCategory(category) {
    const rows = document.querySelectorAll('#classes-body tr');
    
    rows.forEach(row => {
        const rowCategory = row.getAttribute('data-category');
        
        // Show all rows if no category selected or if category matches
        if (!category || rowCategory === category) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Function to render classes
function renderClasses(classesData, classesBody) {
    // Clear existing content
    classesBody.innerHTML = '';
    
    classesData.forEach(item => {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        var span = document.createElement('span');
        
        // Store category for filtering (hidden attribute)
        tr.setAttribute('data-category', item.category);
        
        // Create completely isolated button container
        var btnContainer = document.createElement('div');
        btnContainer.className = 'copy-btn-container';
        
        var btn = document.createElement('button');
        btn.textContent = '📋 Copy';
        btn.className = 'copy-btn';
        btn.setAttribute('data-class', item.class);
        
        // Set up the class display - simplified, just the class name
        span.className = item.class;
        span.textContent = item.class;
        span.setAttribute('data-original-class', item.class);
        
        // No category badge
        // No notes display
        
        td.appendChild(span);
        
        // Add button to isolated container
        btnContainer.appendChild(btn);
        
        // Add button container
        td.appendChild(btnContainer);
        
        tr.appendChild(td);
        classesBody.appendChild(tr);
    });
}