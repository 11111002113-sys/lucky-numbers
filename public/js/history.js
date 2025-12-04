// API Configuration
const API_URL = window.location.origin;

// State
let currentPage = 1;
let totalPages = 1;
const limit = 30;

// Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('resultsContainer');
const noResults = document.getElementById('noResults');
const resultsTable = document.getElementById('resultsTable');
const pagination = document.getElementById('pagination');
const searchDate = document.getElementById('searchDate');

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Format day
function formatDay(dateString) {
  const date = new Date(dateString);
  const options = { weekday: 'short' };
  return date.toLocaleDateString('en-US', options);
}

// Load results
async function loadResults(page = 1) {
  try {
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    resultsContainer.style.display = 'none';
    noResults.style.display = 'none';

    // Clear search input
    searchDate.value = '';

    const response = await fetch(`${API_URL}/api/results?limit=${limit}&page=${page}`);
    const data = await response.json();

    if (data.success) {
      if (data.data.length === 0) {
        loadingState.style.display = 'none';
        noResults.style.display = 'block';
        return;
      }

      currentPage = data.page;
      totalPages = data.pages;
      
      displayResults(data.data);
      createPagination();
      
      loadingState.style.display = 'none';
      resultsContainer.style.display = 'block';
    } else {
      throw new Error(data.message || 'Failed to load results');
    }
  } catch (error) {
    console.error('Error loading results:', error);
    loadingState.style.display = 'none';
    errorMessage.textContent = error.message || 'Unable to load results. Please try again.';
    errorState.style.display = 'block';
  }
}

// Search by date
async function searchByDate() {
  const date = searchDate.value;
  
  if (!date) {
    alert('Please select a date');
    return;
  }

  try {
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    resultsContainer.style.display = 'none';
    noResults.style.display = 'none';

    const response = await fetch(`${API_URL}/api/results/${date}`);
    const data = await response.json();

    if (data.success) {
      displayResults([data.data]);
      pagination.innerHTML = ''; // Clear pagination for single result
      
      loadingState.style.display = 'none';
      resultsContainer.style.display = 'block';
    } else {
      loadingState.style.display = 'none';
      noResults.style.display = 'block';
    }
  } catch (error) {
    console.error('Error searching results:', error);
    loadingState.style.display = 'none';
    noResults.style.display = 'block';
  }
}

// Display results in table
function displayResults(results) {
  resultsTable.innerHTML = '';

  results.forEach(result => {
    const row = document.createElement('tr');
    
    // Format results
    const frDisplay = result.fr_result !== null && result.fr_result !== undefined
      ? String(result.fr_result).padStart(2, '0')
      : 'Pending';
    
    const srDisplay = result.sr_result !== null && result.sr_result !== undefined
      ? String(result.sr_result).padStart(2, '0')
      : 'Pending';

    // Status badge
    let statusBadge;
    if (result.status === 'declared') {
      statusBadge = '<span class="status-badge declared">Declared</span>';
    } else if (result.status === 'partial') {
      statusBadge = '<span class="status-badge partial">Partial</span>';
    } else {
      statusBadge = '<span class="status-badge pending">Pending</span>';
    }

    row.innerHTML = `
      <td><strong>${formatDate(result.date)}</strong></td>
      <td>${formatDay(result.date)}</td>
      <td><span class="result-value">${frDisplay}</span></td>
      <td><span class="result-value">${srDisplay}</span></td>
      <td>${statusBadge}</td>
    `;

    resultsTable.appendChild(row);
  });
}

// Create pagination
function createPagination() {
  pagination.innerHTML = '';

  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Previous';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => loadResults(currentPage - 1);
  pagination.appendChild(prevBtn);

  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.textContent = '1';
    firstBtn.onclick = () => loadResults(1);
    pagination.appendChild(firstBtn);

    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.style.padding = '0 10px';
      pagination.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = i === currentPage ? 'active' : '';
    pageBtn.onclick = () => loadResults(i);
    pagination.appendChild(pageBtn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.style.padding = '0 10px';
      pagination.appendChild(dots);
    }

    const lastBtn = document.createElement('button');
    lastBtn.textContent = totalPages;
    lastBtn.onclick = () => loadResults(totalPages);
    pagination.appendChild(lastBtn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => loadResults(currentPage + 1);
  pagination.appendChild(nextBtn);
}

// Initialize
loadResults();
