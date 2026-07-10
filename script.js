let products = [];
let cart = JSON.parse(localStorage.getItem('hayday_cart')) || [];
let currentCategory = 'all';

// "hayday*2025!admin" şifrəsinin Base64 gizli qarşılığı
const ADMIN_PASSWORD_ENCRYPTED = "aGF5ZGF5KjIwMjUhYWRtaW4=";
const MY_WHATSAPP_NUMBER = "994707093536"; // Sənin WhatsApp nömrən

// Sənin Firebase Realtime Database Linkin
const FIREBASE_URL = "https://shop-798eb-default-rtdb.europe-west1.firebasedatabase.app/products";

// DOM Elementləri
const hamburgerBtn = document.getElementById('hamburger-btn');
const sideMenu = document.getElementById('side-menu');
const productsContainer = document.getElementById('products-container');
const cartCountElement = document.getElementById('cart-count');
const contactMenuLink = document.getElementById('contact-menu-link');

// Səbət səhifəsi elementləri
const cartItemsPageContainer = document.getElementById('cart-items-page');
const totalAmountPageElement = document.getElementById('total-amount-page');
const clearCartPageBtn = document.getElementById('clear-cart-page-btn');
const checkoutWhatsappBtn = document.getElementById('checkout-whatsapp-btn');

// Admin səhifəsi elementləri
const adminLoginBox = document.getElementById('admin-login-box');
const adminMainPanel = document.getElementById('admin-main-panel');
const adminPassInput = document.getElementById('admin-pass-input');
const adminLoginBtn = document.getElementById('admin-login-btn');
const productForm = document.getElementById('product-form');
const adminProductsContainer = document.getElementById('admin-products-container');
const imageSourceSelect = document.getElementById('image-source-select');
const urlImageGroup = document.getElementById('url-image-group');
const fileImageGroup = document.getElementById('file-image-group');


// ==========================================
// AVTOMATİK ŞƏKİL SIXIŞDIRICI (COMPRESSOR)
// ==========================================
function compressImage(base64Str, maxWidth = 300, maxHeight = 300) {
    return new Promise((resolve) => {
        let img = new Image();
        img.src = base64Str;
        img.onload = () => {
            let canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% keyfiyyətlə sıxışdırır
        };
    });
}


// ==========================================
// FIREBASE INTERNET BAZASI FUNKSİYALARI
// ==========================================
async function fetchProductsFromFirebase() {
    try {
        const response = await fetch(`${FIREBASE_URL}.json`);
        const data = await response.json();
        
        products = [];
        if (data) {
            Object.keys(data).forEach(key => {
                products.push({ firebaseKey: key, ...data[key] });
            });
        }
        
        displayProducts();
        if (adminMainPanel && !adminMainPanel.classList.contains('hidden')) {
            displayAdminProducts();
        }
    } catch (error) {
        console.error("Məlumat bazadan çəkilərkən xəta oldu:", error);
    }
}

async function saveProductToFirebase(name, imageSrc, price, category) {
    const newProduct = { id: Date.now(), name, image: imageSrc, price, category };
    
    try {
        const response = await fetch(`${FIREBASE_URL}.json`, {
            method: 'POST',
            body: JSON.stringify(newProduct)
        });
        
        if(response.ok) {
            alert("Məhsul uğurla onlayn bazaya əlavə edildi!");
            productForm.reset();
            imageSourceSelect.value = 'url';
            urlImageGroup.classList.remove('hidden');
            fileImageGroup.classList.add('hidden');
            fetchProductsFromFirebase();
        } else {
            alert("Baza qəbul etmədi. Şəkil hələ də çox böyük ola bilər.");
        }
    } catch (error) {
        alert("Məhsul bazaya yazıla bilmədi, interneti yoxla!");
    }
}

async function deleteProductFromFirebase(firebaseKey) {
    if (confirm("Bu məhsulu silmək istəyirsiniz?")) {
        try {
            await fetch(`${FIREBASE_URL}/${firebaseKey}.json`, {
                method: 'DELETE'
            });
            fetchProductsFromFirebase();
        } catch (error) {
            alert("Silinmə zamanı xəta oldu!");
        }
    }
}


// ==========================================
// 1. HAMBURGER MENYU VƏ SÜRÜŞMƏ (SCROLL)
// ==========================================
if (hamburgerBtn && sideMenu) {
    hamburgerBtn.addEventListener('click', (e) => {
        sideMenu.classList.toggle('show');
        e.stopPropagation();
    });
    document.addEventListener('click', () => { sideMenu.classList.remove('show'); });
}


// ==========================================
// 2. MAĞAZA VİTRİNİ VƏ FİLTRLƏMƏ
// ==========================================
function displayProducts() {
    if (!productsContainer) return;
    productsContainer.innerHTML = "";

    const filteredProducts = currentCategory === 'all' ? products : products.filter(p => p.category === currentCategory);

    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = "<p style='text-align:center; grid-column: 1/-1; color: #777; padding: 20px;'>Bu kateqoriyada məhsul yoxdur.</p>";
        return;
    }

    const catNames = { gold: "Qızıl", tools: "Alət", materials: "Material" };
    let productsHTML = "";

    filteredProducts.forEach(product => {
        productsHTML += `
            <div class="product-card">
                <span class="category-badge">${catNames[product.category] || 'Məhsul'}</span>
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/120?text=Şəkil+Yoxdur'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">${product.price.toFixed(2)} AZN</p>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Səbətə At
                    </button>
                </div>
            </div>`;
    });

    productsContainer.innerHTML = productsHTML;
}

document.querySelectorAll('.cat-btn').forEach(button => {
    button.addEventListener('click', function() {
        const activeBtn = document.querySelector('.cat-btn.active');
        if (activeBtn) activeBtn.classList.remove('active');
        
        this.classList.add('active');
        currentCategory = this.getAttribute('data-category');
        displayProducts();
    });
});


// ==========================================
// 3. SƏBƏT FUNKSİYALARI VƏ WHATSAPP SİFARİŞİ
// ==========================================
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) { 
        existingItem.quantity += 1; 
    } else { 
        cart.push({ ...product, quantity: 1 }); 
    }

    localStorage.setItem('hayday_cart', JSON.stringify(cart));
    updateCartState();
};

function displayCartPage() {
    if (!cartItemsPageContainer) return;
    cartItemsPageContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItemsPageContainer.innerHTML = "<p style='text-align:center; padding: 30px 0; color:#777;'>Səbətiniz tamamilə boşdur.</p>";
        totalAmountPageElement.textContent = "0.00";
        return;
    }

    let cartHTML = "";
    cart.forEach(item => {
        total += item.price * item.quantity;
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} ədəd x ${item.price.toFixed(2)} AZN</p>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>`;
    });
    
    cartItemsPageContainer.innerHTML = cartHTML;
    totalAmountPageElement.textContent = total.toFixed(2);
}

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('hayday_cart', JSON.stringify(cart));
    updateCartState();
};

function updateCartState() {
    if (cartCountElement) {
        cartCountElement.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
    displayCartPage();
}


// ==========================================
// 4. ADMİN PANELİ FUNKSİYALARI
// ==========================================
if (imageSourceSelect) {
    imageSourceSelect.addEventListener('change', function() {
        if (this.value === 'url') {
            urlImageGroup.classList.remove('hidden');
            fileImageGroup.classList.add('hidden');
        } else {
            urlImageGroup.classList.add('hidden');
            fileImageGroup.classList.remove('hidden');
        }
    });
}

if (adminLoginBtn && adminPassInput) {
    adminLoginBtn.addEventListener('click', () => {
        const enteredPassword = adminPassInput.value.trim();
        const encodedInput = btoa(enteredPassword);

        if (encodedInput === ADMIN_PASSWORD_ENCRYPTED) {
            adminLoginBox.classList.add('hidden');
            adminMainPanel.classList.remove('hidden');
            displayAdminProducts();
        } else {
            alert("Yanlış şifrə!");
            adminPassInput.value = "";
        }
    });
}

function displayAdminProducts() {
    if (!adminProductsContainer) return;
    adminProductsContainer.innerHTML = "";

    if (products.length === 0) {
        adminProductsContainer.innerHTML = "<p style='color:#777;'>Vitrində mal yoxdur.</p>";
        return;
    }

    let adminHTML = "";
    products.forEach(product => {
        adminHTML += `
            <div class="product-card" style="padding: 10px; font-size:14px;">
                <button class="delete-prod-btn" onclick="deleteProductFromFirebase('${product.firebaseKey}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <div class="product-image"><img src="${product.image}" style="max-width:60px; height:60px; object-fit:contain;"></div>
                <h4>${product.name}</h4>
                <p>${product.price.toFixed(2)} AZN</p>
            </div>`;
    });
    adminProductsContainer.innerHTML = adminHTML;
}

if (productForm) {
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('prod-name').value;
        const price = parseFloat(document.getElementById('prod-price').value);
        const category = document.getElementById('prod-category').value;
        const source = imageSourceSelect.value;

        if (source === 'url') {
            const imageURL = document.getElementById('prod-image-url').value;
            saveProductToFirebase(name, imageURL, price, category);
        } else {
            const fileInput = document.getElementById('prod-image-file');
            if (fileInput.files.length === 0) {
                alert("Zəhmət olmasa bir şəkil seçin!");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64Image = event.target.result;
                
                // Seçilən şəkli sıxışdırıb sonra Firebase-ə göndəririk
                compressImage(base64Image).then(compressedBase64 => {
                    saveProductToFirebase(name, compressedBase64, price, category);
                });
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    });
}

fetchProductsFromFirebase();
updateCartState();