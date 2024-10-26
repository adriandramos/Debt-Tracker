// Function to fetch trackers from the server and populate the dropdown
async function fetchTrackers() {
    const username = localStorage.getItem('username'); // Retrieve the username from localStorage

    try {
        const response = await fetch(`http://localhost:3002/get_trackers?username=${encodeURIComponent(username)}`);
        const trackers = await response.json();

        const dropdown = document.getElementById('trackerDropdown');
        dropdown.innerHTML = ''; // Clear previous options

        // Add initial "Select a Tracker" option
        const defaultOption = document.createElement('option');
        defaultOption.text = "Select a Tracker";
        defaultOption.value = "";
        dropdown.add(defaultOption);

        // Add new options to the dropdown with debt_id
        trackers.forEach((tracker) => {
            const option = document.createElement('option');
            option.value = tracker.debt_id; // Store debt_id in the option's value
            option.text = tracker.debt_name;
            option.dataset.total = tracker.debt_total;
            option.dataset.deadline = tracker.deadline;
            dropdown.add(option);
        });
    } catch (error) {
        console.error('Error fetching tracker data:', error);
    }
}

// Display selected tracker details
function displayTrackerDetails() {
    const dropdown = document.getElementById('trackerDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];

    if (selectedOption.value) {
        document.getElementById('debtName').textContent = `Debt Name: ${selectedOption.text}`;
        document.getElementById('debtTotal').textContent = `Debt Total: $${selectedOption.dataset.total}`;
        document.getElementById('debtDeadline').textContent = `Deadline: ${selectedOption.dataset.deadline}`;
        document.getElementById('debtAdvice').textContent = ''; // Clear previous advice
    } else {
        document.getElementById('debtName').textContent = '';
        document.getElementById('debtTotal').textContent = '';
        document.getElementById('debtDeadline').textContent = '';
        document.getElementById('debtAdvice').textContent = '';
    }
}

// Calculate and update debt total for the selected tracker
function updateDebtTotal() {
    const dropdown = document.getElementById('trackerDropdown');
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);

    if (selectedOption.value && !isNaN(paymentAmount)) {
        let newTotal = parseFloat(selectedOption.dataset.total) - paymentAmount;
        const debtId = selectedOption.value;

        // Update displayed debt total
        document.getElementById('debtTotal').textContent = `Debt Total: $${newTotal}`;
        selectedOption.dataset.total = newTotal; // Update data attribute

        // Calculate daily payment advice
        const deadlineDate = new Date(selectedOption.dataset.deadline);
        const currentDate = new Date();
        const remainingDays = Math.max(Math.ceil((deadlineDate - currentDate) / (1000 * 60 * 60 * 24)), 0);
        
        if (remainingDays > 0) {
            const dailyPayment = (newTotal / remainingDays).toFixed(2);
            document.getElementById('debtAdvice').textContent = `You need to pay $${dailyPayment} per day to meet your deadline.`;
        } else {
            document.getElementById('debtAdvice').textContent = 'Deadline has passed. Consider extending or paying off debt.';
        }

        // Save updated total to the server
        saveUpdatedDebt(debtId, newTotal);
    }
}

// Expose updateDebtTotal globally
window.updateDebtTotal = updateDebtTotal;

// Function to save updated debt total to the server
async function saveUpdatedDebt(debtId, newTotal) {
    try {
        const response = await fetch('http://localhost:3002/update_debt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ debtId, newTotal })
        });
        const result = await response.text();
        console.log(result);
    } catch (error) {
        console.error('Error updating debt on the server:', error);
    }
}

// Fetch trackers on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchTrackers();

    // Add event listener to dropdown to display selected tracker details
    const dropdown = document.getElementById('trackerDropdown');
    dropdown.addEventListener('change', displayTrackerDetails);
});
