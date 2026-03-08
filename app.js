document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const videoGrid = document.getElementById("video-grid");
    const filterContainer = document.getElementById("filter-container");
    const searchInput = document.getElementById("search-input");
    const resultCount = document.getElementById("result-count");
    const emptyState = document.getElementById("empty-state");
    const themeToggle = document.getElementById("theme-toggle");

    // Modal Elements
    const modal = document.getElementById("video-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const modalTitle = document.getElementById("modal-title");
    const youtubePlayer = document.getElementById("youtube-player");
    // State
    let currentCategory = "All";
    let currentSearchTerm = "";
    let currentEraFilter = null;

    // 1. Initialize App
    function init() {
        renderFilters();
        renderVideos();
        setupEventListeners();
        checkTheme();
    }

    // 2. Render Filters
    function renderFilters() {
        categories.forEach(category => {
            const btn = document.createElement("button");
            btn.className = `filter-btn ${category === "All" ? "active" : ""}`;
            btn.textContent = category;
            btn.dataset.category = category;


            btn.addEventListener("click", () => {
                // Remove active class from all
                document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentCategory = category;
                currentEraFilter = null; // Reset era when changing category
                
                // Clear search logic gracefully
                searchInput.value = "";
                currentSearchTerm = "";
                
                renderVideos();
            });

            filterContainer.appendChild(btn);
        });
    }

    // Helper to create a standard video card element
    function createVideoCard(video) {
        const card = document.createElement("article");
        card.className = "video-card";

        const dateObj = new Date(video.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
        // Use maxresdefault for highest available quality, fallbacks automatically handled by youtube if missing
        const thumbUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;

        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbUrl}" alt="${video.title}" loading="lazy">
                <div class="play-overlay">
                    <div class="play-icon">
                        <i data-lucide="play" width="24" height="24" fill="currentColor"></i>
                    </div>
                </div>
            </div>
            <div class="video-info">
                <span class="video-category">${video.category}</span>
                <h3 class="video-title" title="${video.title}">${video.title}</h3>
                <div class="video-meta">
                    <span><i data-lucide="calendar" width="14" height="14"></i> ${formattedDate}</span>
                </div>
            </div>
        `;
        card.addEventListener("click", () => openModal(video));
        return card;
    }

    // 3. Render Videos base on filters, search, and eras
    function renderVideos() {
        // Clear Grid
        videoGrid.innerHTML = "";
        videoGrid.style.display = "block"; // Change from grid so we can stack era blocks

        // Filter Logic
        let filteredVideos = videoArchive.filter(video => {
            const matchCategory = currentCategory === "All" || video.category === currentCategory;
            const matchSearch = video.title.toLowerCase().includes(currentSearchTerm.toLowerCase());
            
            // Era filter check
            let matchEra = true;
            if (currentEraFilter) {
                const eraObj = eras.find(e => e.id === currentEraFilter);
                if (eraObj) {
                    const vDate = new Date(video.date);
                    const eStart = new Date(eraObj.startDate);
                    const eEnd = new Date(eraObj.endDate);
                    matchEra = vDate >= eStart && vDate <= eEnd;
                }
            }
            
            return matchCategory && matchSearch && matchEra;
        });

        // Sort Videos by Date (Newest first)
        filteredVideos.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Display results counter
        const countingTotal = filteredVideos.length;
        resultCount.textContent = `${countingTotal} Video${countingTotal !== 1 ? 's' : ''} Found`;

        if (countingTotal === 0) {
            emptyState.classList.remove("hidden");
            videoGrid.style.display = "none";
            return;
        }

        emptyState.classList.add("hidden");

        // UI BRANCH: Are we on the default Home Page? (No specific category, no search, no era)
        const isHomePage = (currentCategory === "All" && currentSearchTerm === "" && !currentEraFilter);

        if (isHomePage) {
            // Group by Era
            let renderedErasCount = 0;
            
            // eras list is usually chronological but let's reverse iteration to show newest first 
            const sortedEras = [...eras].reverse();
            
            sortedEras.forEach(era => {
                // Filter main list again just for this Era
                const vDateStart = new Date(era.startDate);
                const vDateEnd = new Date(era.endDate);
                
                const videosInEra = filteredVideos.filter(video => {
                    const videoDate = new Date(video.date);
                    return videoDate >= vDateStart && videoDate <= vDateEnd;
                });
                
                if (videosInEra.length > 0) {
                    renderedErasCount++;
                    
                    // Create Era Wrapper
                    const eraWrapper = document.createElement("div");
                    eraWrapper.className = "era-section mb-16";
                    
                    // Header
                    // Header structure with optional View All button
                    const viewAllHTML = videosInEra.length > 10 ? 
                        `<button class="view-all-btn" data-era="${era.id}">View All <i data-lucide="arrow-right" width="16" height="16"></i></button>` : '';

                    eraWrapper.innerHTML = `
                        <div class="era-header">
                            <div class="era-header-left">
                                <h2 class="era-title">${era.name}</h2>
                                <span class="era-count">${videosInEra.length} Videos</span>
                            </div>
                            ${viewAllHTML}
                        </div>
                        <div class="inner-era-grid"></div>
                    `;
                    
                    const innerGrid = eraWrapper.querySelector('.inner-era-grid');
                    
                    // Slice to max 10
                    const videosToRender = videosInEra.slice(0, 10);
                    videosToRender.forEach(video => {
                        innerGrid.appendChild(createVideoCard(video));
                    });
                    
                    // Attach event listener to View All button if it exists
                    const viewAllBtn = eraWrapper.querySelector('.view-all-btn');
                    if (viewAllBtn) {
                        viewAllBtn.addEventListener("click", () => {
                            currentEraFilter = era.id;
                            renderVideos();
                            window.scrollTo(0,0);
                        });
                    }
                    
                    videoGrid.appendChild(eraWrapper);
                }
            });
            
            // Fallback for videos that don't match any era (pre-debut or edge cases)
            // Skipped for now, assuming all videos fall into an era or we just don't show edge cases in Era view.
            
        } else {
            // Standard Flat Grid view for filters/search/era-view
            
            // If we are specifically viewing an Era, add a back button at the top
            if (currentEraFilter) {
                const activeEraObj = eras.find(e => e.id === currentEraFilter);
                if(activeEraObj) {
                    const eraTitleHeader = document.createElement("div");
                    eraTitleHeader.className = "era-page-header";
                    eraTitleHeader.style.gridColumn = "1 / -1"; // span full width
                    eraTitleHeader.style.marginBottom = "24px";
                    
                    eraTitleHeader.innerHTML = `
                        <button id="back-to-eras-btn" class="view-all-btn" style="margin-bottom: 20px;">
                            <i data-lucide="arrow-left" width="16" height="16"></i> Back to All Eras
                        </button>
                        <h2 class="era-title" style="font-size: 2rem;">${activeEraObj.name}</h2>
                        <p class="text-muted" style="margin-top: 8px;">Showing all ${filteredVideos.length} videos from this era.</p>
                    `;
                    videoGrid.appendChild(eraTitleHeader);
                    
                    // Attach event listener immediately after adding to DOM
                    setTimeout(() => {
                        const backBtn = document.getElementById("back-to-eras-btn");
                        if(backBtn) {
                            backBtn.addEventListener("click", () => {
                                currentEraFilter = null;
                                // find 'All' category button and simulate click to reset UI state properly
                                const allBtn = document.querySelector('.filter-btn[data-category="All"]');
                                if(allBtn) {
                                    allBtn.click();
                                } else {
                                    renderVideos();
                                }
                                window.scrollTo(0,0);
                            });
                        }
                    }, 0);
                }
            }
            
            videoGrid.style.display = "grid";
            filteredVideos.forEach(video => {
                videoGrid.appendChild(createVideoCard(video));
            });
        }

        // Re-init lucide icons for newly added elements
        lucide.createIcons();
    }

    // 4. Modal Logic
    function openModal(video) {
        modalTitle.textContent = video.title;
        // Using YouTube Embed URL with autoplay
        youtubePlayer.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`;
        modal.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent background scroll
    }

    function closeModal() {
        modal.classList.remove("active");
        youtubePlayer.src = ""; // Stop video audio
        document.body.style.overflow = ""; // Restore background scroll
    }

    // 5. Setup Listeners
    function setupEventListeners() {
        // Search Input
        searchInput.addEventListener("input", (e) => {
            currentSearchTerm = e.target.value;
            renderVideos();
        });

        // Close Modal via button
        closeModalBtn.addEventListener("click", closeModal);

        // Close Modal via outside click
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Run
    init();
});
