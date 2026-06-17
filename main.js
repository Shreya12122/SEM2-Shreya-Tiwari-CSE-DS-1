document.addEventListener("DOMContentLoaded", () => {
    // Initialize standard features across all pages
    initMobileNav();
    init3DTilt();
    initToastAlerts();
    
    // Page-specific initializations
    if (document.querySelector(".cart-layout")) {
        initCartEngine();
    }
    
    if (document.querySelector(".category-page-layout")) {
        initCatalogFiltering();
    }
    
    // Add toast to standard "Add to Cart" button clicks on catalog pages
    initAddToCartListeners();
});

/* ==========================================================================
   1. TOAST ALERTS SYSTEM (agent-dom-bridge)
   ========================================================================== */
let toastContainer = null;

function initToastAlerts() {
    // Create toast container if it doesn't exist
    if (!document.getElementById("toast-container")) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        document.body.appendChild(toastContainer);
    } else {
        toastContainer = document.getElementById("toast-container");
    }
}

function showToast(message) {
    if (!toastContainer) initToastAlerts();
    
    const toast = document.createElement("div");
    toast.className = "toast-alert";
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#ff3f6c;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Force a reflow to trigger slide transition
    toast.offsetHeight;
    
    toast.classList.add("show");
    
    // Autoremove after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        toast.addEventListener("transitionend", () => {
            toast.remove();
        });
    }, 3000);
}

function initAddToCartListeners() {
    const addButtons = document.querySelectorAll(".product-card .btn");
    addButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const productCard = btn.closest(".product-card");
            const brand = productCard.querySelector(".brand").textContent;
            const name = productCard.querySelector(".name").textContent;
            showToast(`Added ${brand} ${name} to Bag!`);
        });
    });
}

/* ==========================================================================
   2. MOBILE NAV DRAWER (agent-js-mechanics)
   ========================================================================== */
function initMobileNav() {
    const headerContainer = document.querySelector(".header-container");
    const mainNav = document.querySelector(".main-nav");
    
    if (!headerContainer || !mainNav) return;
    
    // Inject mobile hamburger toggle if missing
    let menuToggle = document.querySelector(".menu-toggle");
    if (!menuToggle) {
        menuToggle = document.createElement("button");
        menuToggle.className = "menu-toggle";
        menuToggle.setAttribute("aria-label", "Toggle Menu");
        menuToggle.innerHTML = "<span></span><span></span><span></span>";
        
        // Insert it right after the main logo or as a helper inside header-container
        const logo = headerContainer.querySelector(".logo");
        if (logo) {
            logo.after(menuToggle);
        } else {
            headerContainer.prepend(menuToggle);
        }
    }
    
    menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        menuToggle.classList.toggle("open");
        mainNav.classList.toggle("nav-open");
    });
    
    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (mainNav.classList.contains("nav-open") && !mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
            menuToggle.classList.remove("open");
            mainNav.classList.remove("nav-open");
        }
    });
}

/* ==========================================================================
   3. CART CALCULATION ENGINE (agent-js-mechanics & agent-dom-bridge)
   ========================================================================== */
function initCartEngine() {
    const cartList = document.querySelector(".cart-items-list");
    if (!cartList) return;
    
    const cartCards = cartList.querySelectorAll(".cart-item-card");
    
    // Parse unit prices and bind listeners for each item card
    cartCards.forEach(card => {
        // Read unit price from initial price and set as dataset attribute
        const priceElement = card.querySelector(".cart-item-price p");
        const priceNum = parseFloat(priceElement.textContent.replace(/[^\d.]/g, ''));
        card.dataset.unitPrice = priceNum;
        
        const qtyVal = card.querySelector(".quantity-value");
        const plusBtn = card.querySelector(".plus-btn");
        const minusBtn = card.querySelector(".minus-btn");
        const removeBtn = card.querySelector(".remove-btn");
        
        plusBtn.addEventListener("click", () => {
            let qty = parseInt(qtyVal.textContent);
            qty++;
            qtyVal.textContent = qty;
            updateItemPrice(card, qty);
            recalculateCartTotals();
            showToast("Quantity increased!");
        });
        
        minusBtn.addEventListener("click", () => {
            let qty = parseInt(qtyVal.textContent);
            if (qty > 1) {
                qty--;
                qtyVal.textContent = qty;
                updateItemPrice(card, qty);
                recalculateCartTotals();
                showToast("Quantity decreased!");
            } else {
                showToast("Minimum quantity is 1");
            }
        });
        
        removeBtn.addEventListener("click", () => {
            removeItemFromCart(card);
        });
    });
}

function updateItemPrice(card, qty) {
    const unitPrice = parseFloat(card.dataset.unitPrice);
    const priceElement = card.querySelector(".cart-item-price p");
    priceElement.textContent = `₹${unitPrice * qty}`;
}

function removeItemFromCart(card) {
    // 350ms Graceful Exit transition (agent-dom-bridge)
    card.classList.add("exit-active");
    
    const itemName = card.querySelector(".name").textContent;
    const itemBrand = card.querySelector(".brand").textContent;
    
    setTimeout(() => {
        card.remove();
        recalculateCartTotals();
        showToast(`Removed ${itemBrand} ${itemName} from Bag`);
        
        // If no items left, show empty state
        const remainingItems = document.querySelectorAll(".cart-item-card");
        if (remainingItems.length === 0) {
            const cartList = document.querySelector(".cart-items-list");
            if (cartList) {
                cartList.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; background:#fff; border-radius:20px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--border-color); margin-bottom:15px;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        <h3 style="margin-bottom:10px;">Your Shopping Bag is empty</h3>
                        <p style="color:#535766; margin-bottom:20px;">Explore fashion trends and add items to your cart.</p>
                        <a href="index.html" class="btn" style="display:inline-block; padding: 12px 30px; text-decoration:none;">Go To Home</a>
                    </div>
                `;
            }
        }
    }, 350);
}

function recalculateCartTotals() {
    const remainingCards = document.querySelectorAll(".cart-item-card");
    let subtotal = 0;
    
    remainingCards.forEach(card => {
        const qty = parseInt(card.querySelector(".quantity-value").textContent);
        const unitPrice = parseFloat(card.dataset.unitPrice);
        subtotal += unitPrice * qty;
    });
    
    // Update labels inside the order summary card
    const summaryRows = document.querySelectorAll(".summary-row");
    summaryRows.forEach(row => {
        const label = row.querySelector("span:first-child").textContent;
        if (label.includes("Subtotal")) {
            row.querySelector("span:last-child").textContent = `₹${subtotal}`;
        } else if (label.includes("Total") && row.classList.contains("total")) {
            row.querySelector("span:last-child").textContent = `₹${subtotal}`;
        }
    });
}

/* ==========================================================================
   4. CATALOG FILTERING SYSTEM (agent-js-mechanics)
   ========================================================================== */
function initCatalogFiltering() {
    const filtersSidebar = document.querySelector(".filters");
    const productGrid = document.querySelector(".product-grid");
    
    if (!filtersSidebar || !productGrid) return;
    
    const checkboxes = filtersSidebar.querySelectorAll("input[type='checkbox']");
    const productCards = productGrid.querySelectorAll(".product-card");
    
    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            filterCatalog();
        });
    });
    
    function filterCatalog() {
        // Collect checked categories
        const checkedCategories = Array.from(filtersSidebar.querySelectorAll("input[name='category']:checked"))
            .map(cb => cb.value);
            
        // Collect checked brands
        const checkedBrands = Array.from(filtersSidebar.querySelectorAll("input[name='brand']:checked"))
            .map(cb => cb.value);
            
        productCards.forEach(card => {
            const category = card.getAttribute("data-category");
            const brand = card.getAttribute("data-brand");
            
            const matchesCategory = checkedCategories.length === 0 || checkedCategories.includes(category);
            const matchesBrand = checkedBrands.length === 0 || checkedBrands.includes(brand);
            
            if (matchesCategory && matchesBrand) {
                // Silky smooth reveal animation
                card.style.display = "block";
                // Trigger transition
                setTimeout(() => {
                    card.style.opacity = "1";
                    card.style.transform = "scale(1)";
                }, 10);
            } else {
                // Hide with smooth fade out
                card.style.opacity = "0";
                card.style.transform = "scale(0.9)";
                // Wait for animation to hide display
                card.addEventListener("transitionend", function handler(e) {
                    if (card.style.opacity === "0") {
                        card.style.display = "none";
                    }
                    card.removeEventListener("transitionend", handler);
                });
            }
        });
    }
}

/* ==========================================================================
   5. TACTILE 3D TILT ANIMATION SYSTEM (agent-css-stylist & agent-dom-bridge)
   ========================================================================== */
function init3DTilt() {
    // Check if pointer device supports hover/fine positioning and width is desktop
    if (window.innerWidth <= 768 || window.matchMedia("(pointer: coarse)").matches) {
        return;
    }
    
    const tiltCards = document.querySelectorAll(".product-card, .cart-item-card");
    
    tiltCards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            card.classList.add("is-tilting");
        });
        
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            
            // X and Y cursor positions relative to target card elements
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Normalize inputs between -0.5 and 0.5
            const normX = x / rect.width - 0.5;
            const normY = y / rect.height - 0.5;
            
            // Angle clamp constraints
            const maxTilt = 8; // degrees
            const tiltX = -normY * maxTilt;
            const tiltY = normX * maxTilt;
            
            // Calculate ambient shadow shifts
            const shadowX = -normX * 15;
            const shadowY = -normY * 15;
            
            // Smoothly render multi-axis matrix transforms
            requestAnimationFrame(() => {
                card.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px) scale(1.02)`;
                card.style.boxShadow = `${shadowX}px ${shadowY + 15}px 35px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)`;
            });
        });
        
        card.addEventListener("mouseleave", () => {
            card.classList.remove("is-tilting");
            requestAnimationFrame(() => {
                card.style.transform = "";
                card.style.boxShadow = "";
            });
        });
    });
}
