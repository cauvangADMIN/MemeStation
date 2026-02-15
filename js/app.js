const slider = document.getElementById("slider");
const tabs = document.querySelectorAll(".tab");
const guide = document.getElementById("scrollGuide");
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const memeBox = document.querySelector(".meme-box");

const BATCH_SIZE = 15;
const PLAY_STORE_LINK = "https://play.google.com/store/apps/details?id=com.memestation.viewer";

/* ================= STATE ================= */

let memes = [];
let currentIndex = 0;
let loadedCount = 0;
let startY = 0;
let deltaY = 0;
let isDragging = false;
let currentTab = "vn";

let vnState = {
    loadedCount: 0,
    currentIndex: 0
};

let pendingNextBatch = null;
let loadMoreBtn = null;

/* ================= LOAD MORE ADS CONTROL ================= */

let loadMoreClickCount = 0;

const loadMoreAdMap = {
    1: "https://shorterwanderer.com/qv394jzf?key=1e88e85568f404ad029fc7a4e3db685f",
    2: "https://shorterwanderer.com/d91f7rhz?key=6da6633dca4cad3f743f1633b8b5da53",
    4: "https://shorterwanderer.com/zmw6nnbnh?key=5f6e16e896ed5dfefee6515585b5ee03",
    6: "https://shorterwanderer.com/v358mgkvej?key=9b130202fbcda0879599843d16bd7577"
};

/* ================= SHUFFLE ================= */

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/* ================= FETCH ================= */

async function loadMemes() {
    const res = await fetch("data/memes.json");
    const data = await res.json();
    memes = data.vietnamese.reverse();
    shuffleArray(memes);
}

/* ================= LOAD MORE BUTTON ================= */

function createLoadMoreButton() {
    if (loadMoreBtn) return;

    loadMoreBtn = document.createElement("button");
    loadMoreBtn.innerText = "Load More";
    loadMoreBtn.className = "load-more-btn";
    loadMoreBtn.style.display = "none";

    loadMoreBtn.addEventListener("click", () => {

        loadMoreClickCount++;

        // 🔥 Trigger ad nếu trùng lần click
        if (loadMoreAdMap[loadMoreClickCount]) {
            window.open(loadMoreAdMap[loadMoreClickCount], "_blank");
        }

        if (pendingNextBatch !== null) {
            renderBatch(pendingNextBatch);
            pendingNextBatch = null;
            hideLoadMoreButton();
        }
    });

    memeBox.appendChild(loadMoreBtn);
}

function showLoadMoreButton() {
    createLoadMoreButton();
    loadMoreBtn.style.display = "block";
}

function hideLoadMoreButton() {
    if (loadMoreBtn) {
        loadMoreBtn.style.display = "none";
    }
}

/* ================= LOCK RULE ================= */

function isLocked(url) {
    const name = url.split("/").pop();
    return (
        /^memevn_v\d{3}\.jpg$/.test(name) ||
        /^memevn_u\d{3}\.jpg$/.test(name)
    );
}

/* ================= OVERLAY ================= */

function createLockOverlay(message) {
    const overlay = document.createElement("div");
    overlay.className = "lock-overlay";

    overlay.innerHTML = `
        <div>
            <div>${message}</div>
            <br/>
            <a href="${PLAY_STORE_LINK}" 
               target="_blank" 
               rel="noopener noreferrer"
               style="color:#00ffcc; text-decoration:underline; font-weight:bold;">
               Click here to find app on Google Play Store
            </a>
        </div>
    `;

    return overlay;
}

/* ================= RENDER BATCH ================= */

function renderBatch(startIndex) {
    slider.innerHTML = "";
    hideLoadMoreButton();

    const batch = memes.slice(startIndex, startIndex + BATCH_SIZE);

    batch.forEach(url => {
        slider.appendChild(createSlide(url));
    });

    loadedCount = startIndex;
    currentIndex = 0;
    updateSlider();
}

function createSlide(url) {
    const slide = document.createElement("div");
    slide.className = "slide";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.src = url;

    slide.appendChild(img);

    if (isLocked(url)) {
        slide.classList.add("locked");
        slide.appendChild(
            createLockOverlay(
                "Download app MemeStation on Google Play Store to watch this meme"
            )
        );
    }

    return slide;
}

/* ================= SLIDER ================= */

function updateSlider() {
    slider.style.transform = `translateY(-${currentIndex * 100}%)`;
}

function resetSliderState() {
    currentIndex = 0;
    loadedCount = 0;
    slider.innerHTML = "";
    slider.style.transform = "translateY(0%)";
    hideLoadMoreButton();
}

/* ================= NAVIGATION ================= */

function nextSlide() {

    if (currentIndex < slider.children.length - 1) {
        currentIndex++;
        updateSlider();
        guide.style.display = "none";
        return;
    }

    const nextBatchStart = loadedCount + BATCH_SIZE;

    if (nextBatchStart < memes.length) {
        pendingNextBatch = nextBatchStart;
        showLoadMoreButton();
    }
}

function prevSlide() {

    if (currentIndex > 0) {
        currentIndex--;
        updateSlider();
        return;
    }

    const prevBatchStart = loadedCount - BATCH_SIZE;

    if (prevBatchStart >= 0) {
        renderBatch(prevBatchStart);
        currentIndex = slider.children.length - 1;
        updateSlider();
    }
}

/* ================= TOUCH ================= */

slider.addEventListener("touchstart", e => {
    startY = e.touches[0].clientY;
    isDragging = true;
});

slider.addEventListener("touchmove", e => {
    if (!isDragging) return;
    deltaY = e.touches[0].clientY - startY;
});

slider.addEventListener("touchend", () => {
    if (deltaY < -80) nextSlide();
    else if (deltaY > 80) prevSlide();
    deltaY = 0;
    isDragging = false;
});

/* ================= MOUSE ================= */

slider.addEventListener("mousedown", e => {
    startY = e.clientY;
    isDragging = true;
});

slider.addEventListener("mousemove", e => {
    if (!isDragging) return;
    deltaY = e.clientY - startY;
});

slider.addEventListener("mouseup", () => {
    if (deltaY < -80) nextSlide();
    else if (deltaY > 80) prevSlide();
    deltaY = 0;
    isDragging = false;
});

/* ================= TAB LOGIC ================= */

tabs.forEach(tab => {
    tab.addEventListener("click", () => {

        if (tab.dataset.tab === currentTab) return;

        if (currentTab === "vn") {
            vnState.loadedCount = loadedCount;
            vnState.currentIndex = currentIndex;
        }

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        currentTab = tab.dataset.tab;
        resetSliderState();

        if (currentTab === "vn") {
            guide.style.display = "block";
            renderBatch(vnState.loadedCount);
            currentIndex = vnState.currentIndex;
            updateSlider();
        } else {
            guide.style.display = "none";

            const slide = document.createElement("div");
            slide.className = "slide locked";

            const img = document.createElement("img");
            img.src = "https://via.placeholder.com/600x800?text=Premium+Content";
            slide.appendChild(img);

            slide.appendChild(
                createLockOverlay(
                    "Download app MemeStation on Google Play Store to watch this tab"
                )
            );

            slider.appendChild(slide);
        }
    });
});

/* ================= INIT ================= */

(async function init() {
    await loadMemes();
    createLoadMoreButton();
    renderBatch(0);
})();

/* ================= DESKTOP BUTTONS ================= */

if (btnUp && btnDown) {
    btnUp.addEventListener("click", () => prevSlide());
    btnDown.addEventListener("click", () => nextSlide());
}
