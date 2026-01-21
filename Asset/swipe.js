 const pages = [
    "index.html",
    "index_NoBB.html",
    "infus.html",
    "insulin.html",
    "anestesi.html"
  ];

  const currentPage = location.pathname.split("/").pop();
  const currentIndex = pages.indexOf(currentPage);

  let startX = 0;
  let endX = 0;
  let isAnimating = false;

  document.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  document.addEventListener("touchend", e => {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    if (isAnimating) return;

    const diff = startX - endX;
    const threshold = 80;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0 && currentIndex < pages.length - 1) {
      slideTo(pages[currentIndex + 1], "left");
    }

    if (diff < 0 && currentIndex > 0) {
      slideTo(pages[currentIndex - 1], "right");
    }
  }

  function slideTo(url, direction) {
    isAnimating = true;

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.className = "page-slide";
    iframe.style.border = "none";

    iframe.classList.add(
      direction === "left" ? "slide-in-right" : "slide-in-left"
    );

    document.body.appendChild(iframe);

    requestAnimationFrame(() => {
      iframe.classList.remove("slide-in-right", "slide-in-left");
      iframe.classList.add("slide-center");

      document.body.classList.add(
        direction === "left" ? "slide-out-left" : "slide-out-right"
      );
    });

    setTimeout(() => {
      window.location.href = url;
    }, 300);
  }