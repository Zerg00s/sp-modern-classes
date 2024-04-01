function loadClassesData() {
    return fetch('refined-classes.txt')
        .then(response => response.text())
        .then(data => {
            // Split data on any combination of new line characters and remove empty strings
            return data.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
        });
}


document.addEventListener('DOMContentLoaded', function () {
    loadClassesData().then(classesRows => {
        var classesBody = document.getElementById('classes-body');

        classesRows.forEach(string => {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            var span = document.createElement('span');
            var btn = document.createElement('button');

            span.className = string;
            span.textContent = string;

            btn.textContent = '📋 Copy'; // Text for the button
            btn.className = 'copy-btn';
            btn.setAttribute('data-class', string); // Store class string in button for easy access

            // Optionally add the button inside the span or next to it, depending on your preference
            span.appendChild(btn); // To add within the span
            // td.appendChild(span); // Uncomment if adding the button next to the span

            td.appendChild(span);
            tr.appendChild(td);
            classesBody.appendChild(tr);
        });
    });

    // Event delegation for copy button clicks
    document.getElementById('classes-body').addEventListener('click', function (event) {
        if (event.target && event.target.matches('.copy-btn')) {
            const classToCopy = event.target.getAttribute('data-class');
            navigator.clipboard.writeText(classToCopy).then(() => {
                // Show feedback to the user
                const originalText = event.target.textContent;
                event.target.textContent = '✔️ Copied!'; // Change button text to indicate success
                event.target.style.backgroundColor = '#34A853'; // Optional: Change button color to green
                setTimeout(() => {
                    event.target.textContent = originalText; // Revert button text after 1.5 seconds
                    event.target.style.backgroundColor = ''; // Optional: Revert button color
                }, 1500);
            }).catch(err => {
                console.error('Error copying text to clipboard', err);
                // Optionally show an error message to the user here
            });
        }
    });
    
});
