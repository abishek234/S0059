// public/marketplace.js
let currentPage = 1;
let totalPages = 1;
let allProducts = [];
let filteredProducts = [];

const API_URL = 'http://localhost:7070/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', debounce(filterProducts, 300));
    document.getElementById('materialFilter').addEventListener('change', filterProducts);
    document.getElementById('industryFilter').addEventListener('change', filterProducts);
    document.getElementById('sortFilter').addEventListener('change', sortProducts);
}

async function fetchProducts() {
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}/products/public`);
        const data = await response.json();
        
        if (data.success) {
            allProducts = data.products;
            filteredProducts = [...allProducts];
            updateStats(data.stats);
            sortProducts();
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        showEmpty();
    }
}

function updateStats(stats) {
    if (!stats) return;
    animateValue('totalProducts', 0, stats.total || 0, 1000);
    animateValue('totalCO2Saved', 0, stats.totalCO2Saved || 0, 1000);
    animateValue('totalWaterSaved', 0, stats.totalWaterSaved || 0, 1000);
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = formatNumber(end);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const materialFilter = document.getElementById('materialFilter').value.toLowerCase();
    const industryFilter = document.getElementById('industryFilter').value.toLowerCase();
    
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);
            
        const matchesMaterial = !materialFilter || 
            product.material.toLowerCase().includes(materialFilter);
            
        const matchesIndustry = !industryFilter || 
            product.industry.toLowerCase().includes(industryFilter);
        
        return matchesSearch && matchesMaterial && matchesIndustry;
    });
    
    currentPage = 1;
    sortProducts();
}

function sortProducts() {
    const sortBy = document.getElementById('sortFilter').value;
    
    switch (sortBy) {
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            break;
        case 'oldest':
            filteredProducts.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
            break;
        case 'impact':
            filteredProducts.sort((a, b) => (b.co2Saved + b.waterSaved) - (a.co2Saved + a.waterSaved));
            break;
    }
    
    displayProducts();
}

function displayProducts() {
    const grid = document.getElementById('productsGrid');
    const itemsPerPage = 12;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (filteredProducts.length === 0) {
        showEmpty();
        return;
    }
    
    hideLoading();
    hideEmpty();
    
    grid.innerHTML = pageProducts.map(product => createProductCard(product)).join('');
    grid.classList.remove('hidden');
    
    totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    updatePagination();
}

function createProductCard(product) {
    const firstLetter = product.userId?.name?.charAt(0).toUpperCase() || 'U';
    
    return `
        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
            <div class="relative h-56 overflow-hidden bg-gray-100">
                <img src="${product.imageUrl || 'https://via.placeholder.com/400x300'}" 
                     alt="${product.name}" 
                     class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Product+Image'">
                <button onclick="event.stopPropagation(); openProductModal('${product._id}')" 
                        class="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-main hover:text-white transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                </button>
            </div>
            <div class="p-6">
                <div class="flex gap-2 mb-3">
                    <span class="px-3 py-1 bg-primary-lighter text-primary-dark text-xs font-bold rounded-full">${product.material}</span>
                    <span class="px-3 py-1 bg-success-lighter text-green-800 text-xs font-bold rounded-full">${product.industry}</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${product.description}</p>
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div class="bg-gray-50 rounded-lg p-3 text-center">
                        <div class="text-xl font-bold text-gray-900">${formatNumber(product.co2Saved)}</div>
                        <div class="text-xs text-gray-600">CO₂ Saved</div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3 text-center">
                        <div class="text-xl font-bold text-gray-900">${formatNumber(product.waterSaved)}</div>
                        <div class="text-xs text-gray-600">Water Saved</div>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-primary-main text-white rounded-full flex items-center justify-center font-semibold text-sm">
                            ${firstLetter}
                        </div>
                        <span class="text-sm text-gray-600">${product.userId?.companyName || 'Company'}</span>
                    </div>
                    <div class="flex items-center gap-1 text-gray-500 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        ${product.viewCount || 0}
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function openProductModal(productId) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            modalBody.innerHTML = createProductDetail(data.product);
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
    }
}

function createProductDetail(product) {
    const firstLetter = product.userId?.name?.charAt(0).toUpperCase() || 'U';
    
    return `
        <img src="${product.imageUrl || 'https://via.placeholder.com/900x400'}" 
             alt="${product.name}" 
             class="w-full h-96 object-cover rounded-xl mb-6"
             onerror="this.src='https://via.placeholder.com/900x400?text=Product+Image'">
        
        <div class="mb-6">
            <div class="flex gap-2 mb-4">
                <span class="px-4 py-2 bg-primary-lighter text-primary-dark text-sm font-bold rounded-lg">${product.material}</span>
                <span class="px-4 py-2 bg-success-lighter text-green-800 text-sm font-bold rounded-lg">${product.industry}</span>
            </div>
            <h2 class="text-3xl font-bold text-gray-900 mb-4">${product.name}</h2>
            <p class="text-gray-600 text-lg leading-relaxed">${product.description}</p>
        </div>
        
        <div class="mb-6">
            <h4 class="text-xl font-bold text-gray-900 mb-4">Product Details</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">Material</div>
                    <div class="font-semibold text-gray-900">${product.material}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">Quantity</div>
                    <div class="font-semibold text-gray-900">${product.quantity}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">Industry</div>
                    <div class="font-semibold text-gray-900">${product.industry}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">Target Market</div>
                    <div class="font-semibold text-gray-900">${product.targetMarket}</div>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h4 class="text-xl font-bold text-gray-900 mb-4">Environmental Impact</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-success-lighter rounded-lg p-6 text-center">
                    <div class="text-3xl font-bold text-gray-900 mb-2">${formatNumber(product.co2Saved)}</div>
                    <div class="text-sm text-gray-600">Tons CO₂ Saved/Year</div>
                </div>
                <div class="bg-blue-50 rounded-lg p-6 text-center">
                    <div class="text-3xl font-bold text-gray-900 mb-2">${formatNumber(product.waterSaved)}</div>
                    <div class="text-sm text-gray-600">Liters Water Saved/Year</div>
                </div>
                <div class="bg-yellow-50 rounded-lg p-6 text-center">
                    <div class="text-3xl font-bold text-gray-900 mb-2">${product.profitMargin}%</div>
                    <div class="text-sm text-gray-600">Profit Margin</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-6 text-center">
                    <div class="text-3xl font-bold text-gray-900 mb-2">${product.feasibilityScore}/10</div>
                    <div class="text-sm text-gray-600">Feasibility Score</div>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h4 class="text-xl font-bold text-gray-900 mb-4">Submitted By</h4>
            <div class="flex items-center gap-4 bg-gray-50 rounded-lg p-6">
                <div class="w-14 h-14 bg-primary-main text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                    ${firstLetter}
                </div>
                <div>
                    <div class="text-lg font-bold text-gray-900">${product.userId?.name || 'Unknown'}</div>
                    <div class="text-gray-600">${product.userId?.companyName || 'Company'} • ${product.userId?.location || 'Location'}</div>
                </div>
            </div>
        </div>
        
        <div class="pt-6 border-t border-gray-200">
            <button onclick="openReportModal('${product._id}')" class="w-full px-6 py-3 border-2 border-error-main text-error-main rounded-lg font-semibold hover:bg-error-lighter transition flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                Report Product
            </button>
        </div>
    `;
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.body.style.overflow = '';
}

function openReportModal(productId) {
    closeProductModal();
    const modal = document.getElementById('reportModal');
    document.getElementById('reportProductId').value = productId;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('reportForm').reset();
}

async function submitReport(event) {
    event.preventDefault();
    
    const productId = document.getElementById('reportProductId').value;
    const reason = document.getElementById('reportReason').value;
    const email = document.getElementById('reportEmail').value;
    const details = document.getElementById('reportDetails').value;
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, reporterEmail: email, details })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Report submitted successfully!');
            closeReportModal();
        } else {
            alert(data.message || 'Failed to submit report');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit report');
    }
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }
    
    pagination.classList.remove('hidden');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function changePage(direction) {
    currentPage += direction;
    displayProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('productsGrid').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

function showEmpty() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('productsGrid').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('pagination').classList.add('hidden');
}

function hideEmpty() {
    document.getElementById('emptyState').classList.add('hidden');
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
        closeReportModal();
    }
});