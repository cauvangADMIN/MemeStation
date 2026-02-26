const slider = document.getElementById("slider");
const tabs = document.querySelectorAll(".tab");
const guide = document.getElementById("scrollGuide");
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const memeBox = document.querySelector(".meme-box");

const BATCH_SIZE = 15;
const PLAY_STORE_LINK = "https://play.google.com/store/apps/details?id=com.memestation.viewer";

/* ================= DATA ================= */

let memeData = {
    vn: [],
    global: []
};

/* ================= STATE ================= */

let currentTab = "vn";
let startY = 0;
let deltaY = 0;
let isDragging = false;
let loadMoreBtn = null;

let tabState = {
    vn: {
        loadedCount: 0,
        currentIndex: 0,
        pendingNextBatch: null,
        loadMoreClickCount: 0
    },
    global: {
        loadedCount: 0,
        currentIndex: 0,
        pendingNextBatch: null,
        loadMoreClickCount: 0
    }
};

/* ================= LOAD MORE ADS ================= */

const loadMoreAdMap = {
    1: "https://shorterwanderer.com/qv394jzf?key=1e88e85568f404ad029fc7a4e3db685f",
    2: "https://shorterwanderer.com/d91f7rhz?key=6da6633dca4cad3f743f1633b8b5da53",
    4: "https://shorterwanderer.com/zmw6nnbnh?key=5f6e16e896ed5dfefee6515585b5ee03",
    6: "https://shorterwanderer.com/v358mgkvej?key=9b130202fbcda0879599843d16bd7577",
    10: "https://shorterwanderer.com/xmjpt9bm?key=7fed831526b5ff86aa9eb8d43f01e0c8",
    13: "https://shorterwanderer.com/v358mgkvej?key=9b130202fbcda0879599843d16bd7577"
};

/* ================= HELPERS ================= */

function getState() {
    return tabState[currentTab];
}

function getMemes() {
    return memeData[currentTab];
}

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

    memeData.vn = [...data.vietnamese].reverse();
    memeData.global = [...data.global].reverse();

    shuffleArray(memeData.vn);
    shuffleArray(memeData.global);
}

/* ================= LOCK RULE ================= */

function isLocked(url) {

    const name = url.split("/").pop();

    // VN rule
    if (currentTab === "vn") {
        return (
            /^memevn_v\d{3}\.jpg$/.test(name) ||
            /^memevn_u\d{3}\.jpg$/.test(name)
        );
    }

    // GLOBAL rule
    if (currentTab === "global") {
        return name.includes("_u");
    }

    return false;
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

/* ================= RENDER ================= */

function renderBatch(startIndex, restoreIndex = null) {

    const state = getState();
    const memes = getMemes();

    slider.innerHTML = "";
    hideLoadMoreButton();

    const batch = memes.slice(startIndex, startIndex + BATCH_SIZE);

    batch.forEach(url => {
        slider.appendChild(createSlide(url));
    });

    state.loadedCount = startIndex;

    if (restoreIndex !== null) {
        state.currentIndex = restoreIndex;
    } else {
        state.currentIndex = 0;
    }

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

    if (currentTab === "video") {
        slider.style.transform = "translateY(0%)";
        return;
    }

    const state = getState();
    slider.style.transform = `translateY(-${state.currentIndex * 100}%)`;
}

/* ================= LOAD MORE ================= */

function createLoadMoreButton() {

    if (loadMoreBtn) return;

    loadMoreBtn = document.createElement("button");
    loadMoreBtn.innerText = "Load More";
    loadMoreBtn.className = "load-more-btn";
    loadMoreBtn.style.display = "none";

    loadMoreBtn.addEventListener("click", () => {

        const state = getState();
        state.loadMoreClickCount++;

        if (loadMoreAdMap[state.loadMoreClickCount]) {
            window.open(loadMoreAdMap[state.loadMoreClickCount], "_blank");
        }

        if (state.pendingNextBatch !== null) {
            renderBatch(state.pendingNextBatch);
            state.pendingNextBatch = null;
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
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
}

/* ================= Tab Video ================= */
function renderVideoTab() {

    slider.innerHTML = "";
    hideLoadMoreButton();
    guide.style.display = "none";

    // RESET transform quan trọng
    slider.style.transform = "translateY(0%)";

    const slide = document.createElement("div");
    slide.className = "slide locked";

    const img = document.createElement("img");
    img.src = "https://via.placeholder.com/600x800?text=Video+Content";
    img.style.objectFit = "cover";

    slide.appendChild(img);

    slide.appendChild(
        createLockOverlay(
            "Download app MemeStation to watch this tab"
        )
    );

    slider.appendChild(slide);
}

/* ================= NAVIGATION ================= */

function nextSlide() {

    if (currentTab === "video") return;

    const state = getState();
    const memes = getMemes();

    if (state.currentIndex < slider.children.length - 1) {
        state.currentIndex++;
        updateSlider();
        guide.style.display = "none";
        return;
    }

    const nextBatchStart = state.loadedCount + BATCH_SIZE;

    if (nextBatchStart < memes.length) {
        state.pendingNextBatch = nextBatchStart;
        showLoadMoreButton();
    }
}

function prevSlide() {

    if (currentTab === "video") return;

    const state = getState();

    if (state.currentIndex > 0) {
        state.currentIndex--;
        updateSlider();
        return;
    }

    const prevBatchStart = state.loadedCount - BATCH_SIZE;

    if (prevBatchStart >= 0) {
        renderBatch(prevBatchStart);
        state.currentIndex = slider.children.length - 1;
        updateSlider();
    }
}

/* ================= TAB LOGIC ================= */

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        if (tab.dataset.tab === currentTab) return;

        // lưu state nếu là vn hoặc global
        if (currentTab === "vn" || currentTab === "global") {
            const oldState = getState();
            oldState.currentIndex = oldState.currentIndex;
            oldState.loadedCount = oldState.loadedCount;
        }

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        currentTab = tab.dataset.tab;

        slider.innerHTML = "";
        hideLoadMoreButton();

        if (currentTab === "vn" || currentTab === "global") {

            guide.style.display = currentTab === "vn" ? "block" : "none";

            const state = getState();

            renderBatch(
                state.loadedCount,
                state.currentIndex
            );
        }

        if (currentTab === "video") {
            renderVideoTab();
        }

    });

});

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
    if (currentTab === "video") {
        deltaY = 0;
        isDragging = false;
        return;
    }

    if (deltaY < -80) nextSlide();
    else if (deltaY > 80) prevSlide();
    deltaY = 0;
    isDragging = false;
});

/* ================= INIT ================= */

(async function init() {
    await loadMemes();
    createLoadMoreButton();
    renderBatch(0);
})();

/* ================= DESKTOP ================= */

if (btnUp && btnDown) {
    btnUp.addEventListener("click", () => {
        if (currentTab !== "video") prevSlide();
    });

    btnDown.addEventListener("click", () => {
        if (currentTab !== "video") nextSlide();
    });
}