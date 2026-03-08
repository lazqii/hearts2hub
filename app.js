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

    // Add Video Elements
    const addVideoBtn = document.getElementById("add-video-btn");
    const addVideoModal = document.getElementById("add-video-modal");
    const closeAddModalBtn = document.getElementById("close-add-modal");

    // Form Elements
    const ytUrlInput = document.getElementById("yt-url-input");
    const fetchYtBtn = document.getElementById("fetch-yt-btn");
    const previewCard = document.getElementById("video-preview-data");
    const previewThumb = document.getElementById("preview-thumbnail");
    const editTitle = document.getElementById("edit-title-input");
    const editDate = document.getElementById("edit-date-input");
    const editCategory = document.getElementById("edit-category-select");
    const generatedGroup = document.getElementById("generated-code-group");
    const generatedOutput = document.getElementById("generated-code-output");
    const copyCodeBtn = document.getElementById("copy-code-btn");
    const generateCodeBtn = document.getElementById("generate-code-btn");
    const addModalActions = document.getElementById("add-modal-actions");

    // State
    let currentCategory = "All";
    let currentSearchTerm = "";
    let extractedVideoId = null;

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

            // Populate Dropdown in Add Video form at the same time
            if (category !== "All") {
                const opt = document.createElement("option");
                opt.value = category;
                opt.textContent = category;
                editCategory.appendChild(opt);
            }

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

        // Sort Videos by Date (Newest first)
        filteredVideos.sort((a, b) => new Date(b.date) - new Date(a.date));

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

        // Add Video Listeners
        addVideoBtn.addEventListener("click", () => {
            // Reset form
            ytUrlInput.value = "";
            previewCard.classList.add("hidden");
            generatedGroup.classList.add("hidden");
            addModalActions.classList.add("hidden");
            addModalActions.classList.add("hidden");
            extractedVideoIds = [];

            addVideoModal.classList.add("active");
            document.body.style.overflow = "hidden";
        });

        closeAddModalBtn.addEventListener("click", () => {
            addVideoModal.classList.remove("active");
            document.body.style.overflow = "";
        });

        fetchYtBtn.addEventListener("click", () => {
            const url = ytUrlInput.value.trim();
            if (!url) return;

            // Extract IDs
            let videoIds = [];
            const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/g;
            let match;

            while ((match = regex.exec(url)) !== null) {
                if (!videoIds.includes(match[1])) {
                    videoIds.push(match[1]);
                }
            }

            if (videoIds.length > 0) {
                extractedVideoIds = videoIds;

                // Auto fill dummy data for preview using the first video
                previewThumb.src = `https://img.youtube.com/vi/${videoIds[0]}/mqdefault.jpg`;

                if (videoIds.length > 1) {
                    editTitle.value = `Bulk Import (${videoIds.length} Videos)`;
                } else {
                    editTitle.value = "New Video Title";
                }

                // Set date to today
                editDate.value = new Date().toISOString().split('T')[0];

                previewCard.classList.remove("hidden");
                addModalActions.classList.remove("hidden");
                generatedGroup.classList.add("hidden");
            } else {
                alert("Please enter a valid YouTube URL");
            }
        });

        generateCodeBtn.addEventListener("click", () => {
            if (!extractedVideoIds || extractedVideoIds.length === 0) return;

            const baseTitle = editTitle.value || "Untitled Video";
            const date = editDate.value || new Date().toISOString().split('T')[0];
            const category = editCategory.value || categories[1];

            let combinedJsObjects = "";

            extractedVideoIds.forEach((id, index) => {
                const titleStr = extractedVideoIds.length > 1 ? `${baseTitle} (Part ${index + 1})` : baseTitle;
                combinedJsObjects += `{
    id: "${id}",
    title: "${titleStr}",
    date: "${date}",
    category: "${category}"
},\n`;
            });

            generatedOutput.textContent = combinedJsObjects;
            generatedGroup.classList.remove("hidden");
        });

        copyCodeBtn.addEventListener("click", () => {
            const code = generatedOutput.textContent;
            navigator.clipboard.writeText(code).then(() => {
                const originalIcon = copyCodeBtn.innerHTML;
                copyCodeBtn.innerHTML = '<i data-lucide="check" style="color:var(--accent-color)"></i>';
                lucide.createIcons();
                setTimeout(() => {
                    copyCodeBtn.innerHTML = originalIcon;
                    lucide.createIcons();
                }, 2000);
            });
        });

    }

    // Run
    init();
});
