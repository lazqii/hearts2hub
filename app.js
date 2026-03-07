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
                renderVideos();
            });

            filterContainer.appendChild(btn);
        });
    }

    // 3. Render Videos base on filters & search
    function renderVideos() {
        // Filter Logic
        let filteredVideos = videoArchive.filter(video => {
            const matchCategory = currentCategory === "All" || video.category === currentCategory;
            const matchSearch = video.title.toLowerCase().includes(currentSearchTerm.toLowerCase());
            return matchCategory && matchSearch;
        });

        // Clear Grid
        videoGrid.innerHTML = "";

        // Update Counter
        resultCount.textContent = `${filteredVideos.length} Video${filteredVideos.length !== 1 ? 's' : ''} Found`;

        if (filteredVideos.length === 0) {
            emptyState.classList.remove("hidden");
            videoGrid.style.display = "none";
            return;
        }

        emptyState.classList.add("hidden");
        videoGrid.style.display = "grid";

        // Render Cards
        filteredVideos.forEach(video => {
            const card = document.createElement("article");
            card.className = "video-card";

            // Format Date (Optional utility)
            const dateObj = new Date(video.date);
            const formattedDate = dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

            // High Res YouTube Thumbnail
            const thumbUrl = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;

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
                        <span><i data-lucide="eye" width="14" height="14"></i> ${video.views || "N/A"}</span>
                    </div>
                </div>
            `;

            // Open Modal on target click
            card.addEventListener("click", () => openModal(video));

            videoGrid.appendChild(card);
        });

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
